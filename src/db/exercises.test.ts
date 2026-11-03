import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import {
  BuiltInExerciseError,
  createExercise,
  ExerciseNameConflictError,
  hideExercise,
  listSelectableExercises,
  renameExercise,
} from "@/db/exercises";
import { listExercises } from "@/db/repositories";
import type { Session } from "@/domain";

let dbName: string;
let db: SetsDb;

beforeEach(async () => {
  dbName = `sets-test-${crypto.randomUUID()}`;
  db = await openDatabase(dbName);
  await seedDatabase(db, 1);
});

const builtIn = exerciseSeed[0]?.slug ?? "";

describe("createExercise", () => {
  it("writes a User Exercise that a fresh database handle can read", async () => {
    const created = await createExercise({ name: "  Rosca no banco ", muscleGroup: "Bíceps" }, db);
    expect(created.id).toMatch(/^usr_/);
    expect(created.source).toBe("user");
    expect(created.name).toBe("Rosca no banco");

    db.close();
    const reopened = await openDatabase(dbName);
    expect(await reopened.get("exercises", created.id)).toEqual(created);
    reopened.close();
  });

  it("refuses a name that only differs by case, accents or spacing", async () => {
    const error = await createExercise({ name: " SUPINO  reto ", muscleGroup: "Peito" }, db).catch(
      (reason: unknown) => reason,
    );

    expect(error).toBeInstanceOf(ExerciseNameConflictError);
    expect((error as ExerciseNameConflictError).existing.id).toBe(builtIn);
  });

  it("allows a near match, which only warns in the picker", async () => {
    const created = await createExercise({ name: "Supino inclinado 45", muscleGroup: "Peito" }, db);
    expect(created.source).toBe("user");
  });
});

describe("renameExercise", () => {
  it("changes the label that resolves for Sets already recorded", async () => {
    const exercise = await createExercise({ name: "Rosca no banco", muscleGroup: "Bíceps" }, db);
    const session: Session = {
      id: "ses_1",
      routineId: null,
      startedAt: 1,
      plan: [],
      sets: [{ exerciseId: exercise.id, weight: 20, reps: 10, confirmedAt: 2 }],
    };
    await db.put("sessions", session);

    await renameExercise(exercise.id, "Rosca sentada", db);

    const exercises = await listExercises(db);
    const label = exercises.find((row) => row.id === session.sets[0]?.exerciseId)?.name;
    expect(label).toBe("Rosca sentada");
  });

  it("refuses to rename a Built-in Exercise", async () => {
    await expect(renameExercise(builtIn, "Supino meu", db)).rejects.toThrow(BuiltInExerciseError);
    expect((await db.get("exercises", builtIn))?.name).toBe(exerciseSeed[0]?.name);
  });

  it("refuses a name another Exercise already answers to", async () => {
    const exercise = await createExercise({ name: "Rosca no banco", muscleGroup: "Bíceps" }, db);
    await expect(renameExercise(exercise.id, "crucifixo", db)).rejects.toThrow(
      ExerciseNameConflictError,
    );
  });

  it("allows a User Exercise to change the case of its own name", async () => {
    const exercise = await createExercise({ name: "Rosca no banco", muscleGroup: "Bíceps" }, db);
    expect((await renameExercise(exercise.id, "rosca NO BANCO", db)).name).toBe("rosca NO BANCO");
  });
});

describe("hideExercise", () => {
  it("removes the Exercise from the picker and keeps it resolvable for history", async () => {
    const exercise = await createExercise({ name: "Rosca no banco", muscleGroup: "Bíceps" }, db);

    await hideExercise(exercise.id, db);

    const selectable = await listSelectableExercises(db);
    expect(selectable.map((row) => row.id)).not.toContain(exercise.id);

    const everything = await listExercises(db);
    expect(everything.find((row) => row.id === exercise.id)?.hiddenAt).toBeTypeOf("number");
  });

  it("refuses to hide a Built-in Exercise", async () => {
    await expect(hideExercise(builtIn, db)).rejects.toThrow(BuiltInExerciseError);
  });
});

describe("listSelectableExercises", () => {
  it("offers every Built-in and every visible User Exercise", async () => {
    const exercise = await createExercise({ name: "Rosca no banco", muscleGroup: "Bíceps" }, db);
    const selectable = await listSelectableExercises(db);

    expect(selectable).toHaveLength(exerciseSeed.length + 1);
    expect(selectable.map((row) => row.id)).toContain(exercise.id);
  });
});
