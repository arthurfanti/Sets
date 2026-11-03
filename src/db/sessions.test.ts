import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import {
  ActiveSessionError,
  addExerciseToSession,
  appendSet,
  discardSession,
  findActiveSession,
  getSession,
  listFinishedSessions,
  startSession,
} from "@/db/sessions";
import type { Routine, Session } from "@/domain";

let dbName: string;
let db: SetsDb;
let routine: Routine;

beforeEach(async () => {
  dbName = `sets-sessions-${crypto.randomUUID()}`;
  db = await openDatabase(dbName);
  await seedDatabase(db, 1);
  const routines = await db.getAll("routines");
  const first = routines.find((row) => row.source === "builtin");
  if (!first) throw new Error("seed has no built-in Routine");
  routine = first;
});

describe("startSession", () => {
  it("snapshots the Routine's Plan, so later Routine edits do not reach the Session", async () => {
    const session = await startSession(routine.id, db);
    await db.put("routines", { ...routine, prescriptions: [] });

    expect((await getSession(session.id, db))?.plan).toEqual(routine.prescriptions);
  });

  it("starts the Session with an id, a start time and no Sets", async () => {
    const before = Date.now();
    const session = await startSession(routine.id, db);

    expect(session.id).toMatch(/^ses_/);
    expect(session.routineId).toBe(routine.id);
    expect(session.startedAt).toBeGreaterThanOrEqual(before);
    expect(session.endedAt).toBeUndefined();
    expect(session.sets).toEqual([]);
  });

  it("refuses a second active Session and names the one already open", async () => {
    const session = await startSession(routine.id, db);

    await expect(startSession(routine.id, db)).rejects.toBeInstanceOf(ActiveSessionError);
    await expect(startSession(routine.id, db)).rejects.toMatchObject({
      session: { id: session.id },
    });
  });
});

describe("findActiveSession", () => {
  it("is the Session that has not ended", async () => {
    const session = await startSession(routine.id, db);

    expect((await findActiveSession(db))?.id).toBe(session.id);
  });

  it("is missing once the Session has ended", async () => {
    const session = await startSession(routine.id, db);
    await db.put("sessions", { ...session, endedAt: Date.now() });

    expect(await findActiveSession(db)).toBeUndefined();
  });
});

describe("appendSet", () => {
  it("persists the Set immediately and keeps it across a reopen", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 102.5, reps: 5 },
      db,
    );
    db.close();

    db = await openDatabase(dbName);
    expect((await getSession(session.id, db))?.sets).toEqual([
      expect.objectContaining({ exerciseId: "supino-reto", index: 0, weight: 102.5, reps: 5 }),
    ]);
  });

  it("keeps the confirmed order and the recorded timestamp", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 111 },
      db,
    );
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 1, weight: 100, reps: 7, confirmedAt: 222 },
      db,
    );

    const saved = await getSession(session.id, db);
    expect(saved?.sets.map((set) => [set.index, set.reps, set.confirmedAt])).toEqual([
      [0, 8, 111],
      [1, 7, 222],
    ]);
  });

  it("keeps one Set per slot when a confirmation replaces an earlier one", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 1 },
      db,
    );
    const updated = await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 105, reps: 6, confirmedAt: 2 },
      db,
    );

    expect(updated.sets).toEqual([
      expect.objectContaining({ exerciseId: "supino-reto", index: 0, weight: 105, reps: 6 }),
    ]);
  });

  it("never writes back to the Routine", async () => {
    const before = await db.get("routines", routine.id);
    const session = await startSession(routine.id, db);
    await appendSet(session.id, { exerciseId: "supino-reto", index: 0, weight: 130, reps: 3 }, db);

    expect(await db.get("routines", routine.id)).toEqual(before);
  });
});

describe("addExerciseToSession", () => {
  it("appends an Exercise block to the live Plan without leaving the Session", async () => {
    const session = await startSession(routine.id, db);
    const updated = await addExerciseToSession(session.id, "agachamento-livre", db);

    expect(updated.plan.at(-1)).toMatchObject({
      exerciseId: "agachamento-livre",
      sets: 3,
      reps: "",
    });
    expect((await getSession(session.id, db))?.plan.at(-1)?.exerciseId).toBe("agachamento-livre");
  });

  it("does not add the same Exercise twice", async () => {
    const session = await startSession(routine.id, db);
    await addExerciseToSession(session.id, "agachamento-livre", db);
    const updated = await addExerciseToSession(session.id, "agachamento-livre", db);

    expect(updated.plan.filter((row) => row.exerciseId === "agachamento-livre")).toHaveLength(1);
  });
});

describe("listFinishedSessions", () => {
  it("returns only ended Sessions, newest first", async () => {
    const older = await startSession(routine.id, db);
    await db.put("sessions", { ...older, startedAt: 1_000, endedAt: 1_001 });
    const newer = await startSession(routine.id, db);
    await db.put("sessions", { ...newer, startedAt: 2_000, endedAt: 2_001 });

    const finished = await listFinishedSessions(db);
    expect(finished.map((session) => session.id)).toEqual([newer.id, older.id]);
  });

  it("derives the slot index for a Set written before the field existed", async () => {
    const session = await startSession(routine.id, db);
    const legacy = {
      ...session,
      endedAt: Date.now(),
      sets: [
        { exerciseId: "supino-reto", weight: 100, reps: 8, confirmedAt: 1 },
        { exerciseId: "supino-reto", weight: 100, reps: 7, confirmedAt: 2 },
        { exerciseId: "agachamento", weight: 120, reps: 5, confirmedAt: 3 },
      ],
    } as unknown as Session;
    await db.put("sessions", legacy);

    const [read] = await listFinishedSessions(db);
    expect(read?.sets.map((set) => [set.exerciseId, set.index])).toEqual([
      ["supino-reto", 0],
      ["supino-reto", 1],
      ["agachamento", 0],
    ]);
  });
});

describe("discardSession", () => {
  it("removes the open Session so another one can start", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(session.id, { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8 }, db);

    await discardSession(session.id, db);

    expect(await getSession(session.id, db)).toBeUndefined();
    expect(await findActiveSession(db)).toBeUndefined();
    await expect(startSession(routine.id, db)).resolves.toMatchObject({ routineId: routine.id });
  });
});
