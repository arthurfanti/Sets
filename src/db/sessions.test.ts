import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import { createExercise, hideExercise, listSelectableExercises } from "@/db/exercises";
import { listExercises } from "@/db/repositories";
import {
  ActiveSessionError,
  addExerciseToSession,
  appendSet,
  deleteFinishedSession,
  discardSession,
  findActiveSession,
  finishSession,
  getSession,
  listExerciseSessions,
  listFinishedSessions,
  MissingSessionError,
  MissingSetError,
  startEmptySession,
  startSession,
  updateSet,
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

describe("startEmptySession", () => {
  it("starts a Session with no Routine and no Plan", async () => {
    const before = Date.now();
    const session = await startEmptySession(db);

    expect(session.id).toMatch(/^ses_/);
    expect(session.routineId).toBeNull();
    expect(session.startedAt).toBeGreaterThanOrEqual(before);
    expect(session.plan).toEqual([]);
    expect(session.sets).toEqual([]);
  });

  it("refuses a second active Session", async () => {
    const session = await startSession(routine.id, db);

    await expect(startEmptySession(db)).rejects.toBeInstanceOf(ActiveSessionError);
    await expect(startEmptySession(db)).rejects.toMatchObject({ session: { id: session.id } });
  });

  it("can be discarded", async () => {
    const session = await startEmptySession(db);

    await discardSession(session.id, db);

    expect(await findActiveSession(db)).toBeUndefined();
  });
});

describe("finishSession", () => {
  it("ends the Session at the last logged Set, not at the moment of finishing", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 1_000 },
      db,
    );
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 1, weight: 100, reps: 7, confirmedAt: 2_500 },
      db,
    );

    const finished = await finishSession(session.id, db);

    expect(finished.endedAt).toBe(2_500);
    expect((await getSession(session.id, db))?.endedAt).toBe(2_500);
  });

  it("leaves the start time alone", async () => {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 5_000 },
      db,
    );

    const finished = await finishSession(session.id, db);

    expect(finished.startedAt).toBe(session.startedAt);
  });

  it("records a zero duration for an empty Session", async () => {
    const session = await startEmptySession(db);
    const finished = await finishSession(session.id, db);

    expect(finished.endedAt).toBe(session.startedAt);
    expect((await listFinishedSessions(db)).map((row) => row.id)).toEqual([session.id]);
  });

  it("does not move an ending that is already recorded", async () => {
    const session = await startSession(routine.id, db);
    await db.put("sessions", { ...session, endedAt: 4_000 });
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 9_000 },
      db,
    );

    expect((await finishSession(session.id, db)).endedAt).toBe(4_000);
  });

  it("never rewrites the Routine, even when weights and Exercises deviated", async () => {
    const before = await db.get("routines", routine.id);
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: session.plan[0]?.exerciseId ?? "supino-reto", index: 0, weight: 130, reps: 3 },
      db,
    );
    await addExerciseToSession(session.id, "agachamento-livre", db);

    await finishSession(session.id, db);

    expect(await db.get("routines", routine.id)).toEqual(before);
  });

  it("refuses a Session that does not exist", async () => {
    await expect(finishSession("ses_ausente", db)).rejects.toBeInstanceOf(MissingSessionError);
  });
});

describe("updateSet", () => {
  async function finishedSessionWithOneSet(): Promise<Session> {
    const session = await startSession(routine.id, db);
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 1_000 },
      db,
    );
    await appendSet(
      session.id,
      { exerciseId: "supino-reto", index: 1, weight: 100, reps: 7, confirmedAt: 2_000 },
      db,
    );
    return finishSession(session.id, db);
  }

  it("corrects the weight and reps, and the correction survives a reload", async () => {
    const session = await finishedSessionWithOneSet();

    await updateSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 102.5, reps: 6 },
      db,
    );
    db.close();
    db = await openDatabase(dbName);

    const saved = await getSession(session.id, db);
    expect(saved?.sets[0]).toMatchObject({ weight: 102.5, reps: 6 });
  });

  it("keeps the Set's slot, its recorded moment and the other Sets untouched", async () => {
    const session = await finishedSessionWithOneSet();

    const updated = await updateSet(
      session.id,
      { exerciseId: "supino-reto", index: 0, weight: 105, reps: 5 },
      db,
    );

    expect(updated.sets).toEqual([
      expect.objectContaining({ index: 0, weight: 105, reps: 5, confirmedAt: 1_000 }),
      expect.objectContaining({ index: 1, weight: 100, reps: 7, confirmedAt: 2_000 }),
    ]);
  });

  it("refuses a Set the Session never recorded", async () => {
    const session = await finishedSessionWithOneSet();

    await expect(
      updateSet(session.id, { exerciseId: "supino-reto", index: 9, weight: 100, reps: 8 }, db),
    ).rejects.toBeInstanceOf(MissingSetError);
  });

  it("refuses a Session that does not exist", async () => {
    await expect(
      updateSet("ses_ausente", { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8 }, db),
    ).rejects.toBeInstanceOf(MissingSessionError);
  });
});

describe("deleteFinishedSession", () => {
  it("removes the Session, so its Sets no longer count toward volume", async () => {
    const deleted = await startSession(routine.id, db);
    await appendSet(
      deleted.id,
      { exerciseId: "supino-reto", index: 0, weight: 100, reps: 8, confirmedAt: 1_000 },
      db,
    );
    await finishSession(deleted.id, db);
    const kept = await startSession(routine.id, db);
    await finishSession(kept.id, db);

    await deleteFinishedSession(deleted.id, db);

    expect(await getSession(deleted.id, db)).toBeUndefined();
    const remaining = await listFinishedSessions(db);
    expect(remaining.map((session) => session.id)).toEqual([kept.id]);
    expect(remaining.flatMap((session) => session.sets)).toEqual([]);
  });

  it("refuses the open Session, which is discarded from the Session screen", async () => {
    const open = await startSession(routine.id, db);

    await expect(deleteFinishedSession(open.id, db)).rejects.toThrow();
    expect((await findActiveSession(db))?.id).toBe(open.id);
  });

  it("refuses a Session that does not exist", async () => {
    await expect(deleteFinishedSession("ses_ausente", db)).rejects.toBeInstanceOf(
      MissingSessionError,
    );
  });
});

describe("an Exercise that left the picker", () => {
  it("still resolves its name for the Sets a finished Session recorded", async () => {
    const exercise = await createExercise(
      { name: "Rosca Scott unilateral", muscleGroup: "Bíceps" },
      db,
    );
    const session = await startSession(routine.id, db);
    await appendSet(session.id, { exerciseId: exercise.id, index: 0, weight: 30, reps: 10 }, db);
    await finishSession(session.id, db);

    await hideExercise(exercise.id, db);

    expect(await listSelectableExercises(db)).not.toContainEqual(
      expect.objectContaining({ id: exercise.id }),
    );
    const [finished] = await listFinishedSessions(db);
    expect(finished?.sets[0]?.exerciseId).toBe(exercise.id);
    const names = new Map((await listExercises(db)).map((row) => [row.id, row.name]));
    expect(names.get(finished?.sets[0]?.exerciseId ?? "")).toBe("Rosca Scott unilateral");
  });
});

describe("listExerciseSessions", () => {
  it("reads only the finished Sessions that recorded the Exercise, newest first", async () => {
    const finishedOld = {
      id: "ses_velha",
      routineId: null,
      startedAt: 1_000,
      endedAt: 2_000,
      plan: [],
      sets: [
        { exerciseId: "supino-reto", index: 0, weight: 100, reps: 5, confirmedAt: 1_500 },
        { exerciseId: "agachamento", index: 0, weight: 140, reps: 5, confirmedAt: 1_600 },
      ],
    };
    const finishedNew = {
      id: "ses_nova",
      routineId: null,
      startedAt: 3_000,
      endedAt: 4_000,
      plan: [],
      sets: [{ exerciseId: "supino-reto", index: 0, weight: 95, reps: 8, confirmedAt: 3_500 }],
    };
    const otherExercise = {
      id: "ses_outra",
      routineId: null,
      startedAt: 5_000,
      endedAt: 6_000,
      plan: [],
      sets: [{ exerciseId: "agachamento", index: 0, weight: 150, reps: 5, confirmedAt: 5_500 }],
    };
    const open = {
      id: "ses_aberta",
      routineId: null,
      startedAt: 7_000,
      plan: [],
      sets: [{ exerciseId: "supino-reto", index: 0, weight: 110, reps: 3, confirmedAt: 7_500 }],
    };
    await db.put("sessions", finishedOld);
    await db.put("sessions", finishedNew);
    await db.put("sessions", otherExercise);
    await db.put("sessions", open);

    const sessions = await listExerciseSessions("supino-reto", db);

    expect(sessions.map((session) => session.id)).toEqual(["ses_nova", "ses_velha"]);
    expect(sessions.flatMap((session) => session.sets).map((set) => set.exerciseId)).toEqual([
      "supino-reto",
      "supino-reto",
      "agachamento",
    ]);
    expect(sessions[1]?.sets[1]?.index).toBe(0);
  });

  it("returns nothing for an Exercise with no recorded Sets", async () => {
    expect(await listExerciseSessions("nunca-feito", db)).toEqual([]);
  });
});
