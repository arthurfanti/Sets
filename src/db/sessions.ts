import { readyDatabase, type SetsDb } from "@/db/database";
import type { PerformedSet, Prescription, Session } from "@/domain";
import { lastActivityAt } from "@/domain/session";

/**
 * Session persistence. A Session is one document: its Plan and every Set it
 * records are written together, so a confirmed Set is atomic and there is no
 * second place for the Plan to drift.
 *
 * The rules here enforce what the Session screens rely on: one active Session
 * at a time, and reads that tolerate records written before a field existed.
 */

/** Three slots for an Exercise the Lifter adds mid-Session; no prescription. */
const AD_HOC_SETS = 3;
/** The Plan prescribes no reps for an ad-hoc Exercise; history fills them. */
const AD_HOC_REPS = "";

export class ActiveSessionError extends Error {
  readonly session: Session;

  constructor(session: Session) {
    super("A Session is already open.");
    this.name = "ActiveSessionError";
    this.session = session;
  }
}

export class MissingSessionError extends Error {
  constructor(id: string) {
    super(`Session ${id} was not found.`);
    this.name = "MissingSessionError";
  }
}

export class MissingRoutineError extends Error {
  constructor(id: string) {
    super(`Routine ${id} was not found.`);
    this.name = "MissingRoutineError";
  }
}

function isOpen(session: Session): boolean {
  return session.endedAt === undefined;
}

/**
 * Reads a stored Set list under the current shape. A record written before
 * `PerformedSet.index` existed derives the index from its position within that
 * Exercise's Sets, which is exactly how older Sessions were ordered.
 */
function withIndexes(sets: PerformedSet[]): PerformedSet[] {
  const next = new Map<string, number>();
  return sets.map((set) => {
    const fallback = next.get(set.exerciseId) ?? 0;
    next.set(set.exerciseId, fallback + 1);
    const stored = set as PerformedSet & { index?: number };
    return typeof stored.index === "number" ? stored : { ...set, index: fallback };
  });
}

function readSession(session: Session): Session {
  return { ...session, sets: withIndexes(session.sets) };
}

function abort(tx: { abort(): void; done: Promise<unknown> }): void {
  tx.abort();
  // The abort rejects `done`; swallowing it here keeps the caller's rejection
  // (the meaningful one) from being accompanied by an unhandled rejection.
  void tx.done.catch(() => undefined);
}

export async function findActiveSession(database?: SetsDb): Promise<Session | undefined> {
  const db = database ?? (await readyDatabase());
  const all = await db.getAll("sessions");
  return all.filter(isOpen).sort((a, b) => b.startedAt - a.startedAt)[0];
}

export async function getSession(id: string, database?: SetsDb): Promise<Session | undefined> {
  const db = database ?? (await readyDatabase());
  const session = await db.get("sessions", id);
  return session ? readSession(session) : undefined;
}

/**
 * Starts a Session from a Routine, copying its prescriptions as the Plan.
 * Refuses when another Session is open: the caller asks the Lifter whether to
 * resume it or discard it first.
 */
export async function startSession(routineId: string, database?: SetsDb): Promise<Session> {
  const db = database ?? (await readyDatabase());
  const routine = await db.get("routines", routineId);
  if (!routine) throw new MissingRoutineError(routineId);

  const plan = routine.prescriptions.map((prescription): Prescription => ({ ...prescription }));
  return createSession(db, routineId, plan);
}

/**
 * Starts an empty Session: no Routine and no Plan, so it can only record Sets
 * the Lifter adds. One active Session at a time still holds.
 */
export async function startEmptySession(database?: SetsDb): Promise<Session> {
  const db = database ?? (await readyDatabase());
  return createSession(db, null, []);
}

/**
 * Inserts a new open Session, refusing when one is already open. `startedAt` is
 * set once, here, and nothing rewrites it afterwards.
 */
async function createSession(
  db: SetsDb,
  routineId: string | null,
  plan: Prescription[],
): Promise<Session> {
  const session: Session = {
    id: `ses_${crypto.randomUUID()}`,
    routineId,
    startedAt: Date.now(),
    plan,
    sets: [],
  };

  const tx = db.transaction("sessions", "readwrite");
  const open = (await tx.store.getAll()).find(isOpen);
  if (open) {
    abort(tx);
    throw new ActiveSessionError(readSession(open));
  }
  await tx.store.put(session);
  await tx.done;
  return session;
}

export interface SetInput {
  exerciseId: string;
  index: number;
  weight: number;
  reps: number;
  confirmedAt?: number;
}

/** Writes one confirmed Set to the device immediately, replacing its slot. */
export async function appendSet(
  sessionId: string,
  input: SetInput,
  database?: SetsDb,
): Promise<Session> {
  const db = database ?? (await readyDatabase());
  const tx = db.transaction("sessions", "readwrite");
  const session = await tx.store.get(sessionId);
  if (!session) {
    abort(tx);
    throw new MissingSessionError(sessionId);
  }

  const set: PerformedSet = {
    exerciseId: input.exerciseId,
    index: input.index,
    weight: input.weight,
    reps: input.reps,
    confirmedAt: input.confirmedAt ?? Date.now(),
  };
  const sets = withIndexes(session.sets);
  const existing = sets.findIndex(
    (row) => row.exerciseId === set.exerciseId && row.index === set.index,
  );
  if (existing >= 0) sets[existing] = set;
  else sets.push(set);

  const updated: Session = { ...session, sets };
  await tx.store.put(updated);
  await tx.done;
  return updated;
}

/**
 * Adds an Exercise to the live Session's Plan. The addition is a change to the
 * Session only — never to the Routine (ADR 0004).
 */
export async function addExerciseToSession(
  sessionId: string,
  exerciseId: string,
  database?: SetsDb,
): Promise<Session> {
  const db = database ?? (await readyDatabase());
  const tx = db.transaction(["exercises", "sessions"], "readwrite");
  const session = await tx.objectStore("sessions").get(sessionId);
  if (!session) {
    abort(tx);
    throw new MissingSessionError(sessionId);
  }
  if (session.plan.some((row) => row.exerciseId === exerciseId)) {
    await tx.done;
    return readSession(session);
  }
  const exercise = await tx.objectStore("exercises").get(exerciseId);
  if (!exercise) {
    abort(tx);
    throw new Error(`Exercise ${exerciseId} was not found.`);
  }

  const added: Prescription = { exerciseId, sets: AD_HOC_SETS, reps: AD_HOC_REPS };
  const updated: Session = { ...session, plan: [...session.plan, added] };
  await tx.objectStore("sessions").put(updated);
  await tx.done;
  return updated;
}

/**
 * Closes the Session where the Lifter last worked: at the last logged Set, not
 * at the moment Finish was tapped, so a Session resumed after an overnight gap
 * never bills the gap as training time. An empty Session ends where it started
 * and so records duration 0. The Routine is untouched (ADR 0004), and an
 * ending that is already recorded is never moved.
 */
export async function finishSession(sessionId: string, database?: SetsDb): Promise<Session> {
  const db = database ?? (await readyDatabase());
  const tx = db.transaction("sessions", "readwrite");
  const session = await tx.store.get(sessionId);
  if (!session) {
    abort(tx);
    throw new MissingSessionError(sessionId);
  }
  if (session.endedAt !== undefined) {
    await tx.done;
    return readSession(session);
  }

  const updated: Session = { ...session, endedAt: lastActivityAt(session) };
  await tx.store.put(updated);
  await tx.done;
  return readSession(updated);
}

/** Removes an open Session the Lifter chose to discard. */
export async function discardSession(sessionId: string, database?: SetsDb): Promise<void> {
  const db = database ?? (await readyDatabase());
  await db.delete("sessions", sessionId);
}

/** Every ended Session, newest first — the pool pre-fill walks back through. */
export async function listFinishedSessions(database?: SetsDb): Promise<Session[]> {
  const db = database ?? (await readyDatabase());
  const all = await db.getAll("sessions");
  return all
    .filter((session) => session.endedAt !== undefined)
    .sort((a, b) => b.startedAt - a.startedAt)
    .map(readSession);
}
