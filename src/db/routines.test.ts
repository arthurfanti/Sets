import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import routineSeed from "@/data/routines.json";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import {
  BuiltInRoutineError,
  createRoutine,
  deleteRoutine,
  getRoutine,
  saveRoutine,
} from "@/db/routines";

let dbName: string;
let db: SetsDb;

beforeEach(async () => {
  dbName = `sets-test-${crypto.randomUUID()}`;
  db = await openDatabase(dbName);
  await seedDatabase(db, 1);
});

const draft = {
  name: "Minha rotina",
  prescriptions: [
    { exerciseId: "supino-reto", sets: 4, reps: "6-10", weight: 80 },
    { exerciseId: "crucifixo", sets: 3, reps: 12 },
  ],
};

describe("createRoutine", () => {
  it("writes a User Routine that a fresh database handle can read", async () => {
    const created = await createRoutine(draft, db);
    expect(created.id).toMatch(/^rot_/);
    expect(created.source).toBe("user");

    db.close();
    const reopened = await openDatabase(dbName);
    expect(await getRoutine(created.id, reopened)).toEqual(created);
    reopened.close();
  });
});

describe("saveRoutine", () => {
  it("keeps the edited name, order and prescription", async () => {
    const created = await createRoutine(draft, db);
    const reordered = [...created.prescriptions].reverse();

    await saveRoutine({ ...created, name: "Rotina de sexta", prescriptions: reordered }, db);

    const stored = await getRoutine(created.id, db);
    expect(stored?.name).toBe("Rotina de sexta");
    expect(stored?.prescriptions).toEqual(reordered);
    expect(stored?.id).toBe(created.id);
  });

  it("refuses to overwrite a Built-in Routine and leaves it untouched", async () => {
    const builtIn = await getRoutine(routineSeed[0]?.slug ?? "", db);
    if (!builtIn) throw new Error("seeded routine missing");

    await expect(saveRoutine({ ...builtIn, name: "Minha versão" }, db)).rejects.toThrow(
      BuiltInRoutineError,
    );
    expect(await getRoutine(builtIn.id, db)).toEqual(builtIn);
  });
});

describe("deleteRoutine", () => {
  it("removes a User Routine", async () => {
    const created = await createRoutine(draft, db);
    await deleteRoutine(created.id, db);
    expect(await getRoutine(created.id, db)).toBeUndefined();
  });

  it("refuses to remove a Built-in Routine", async () => {
    const id = routineSeed[0]?.slug ?? "";
    await expect(deleteRoutine(id, db)).rejects.toThrow(BuiltInRoutineError);
    expect(await getRoutine(id, db)).toBeDefined();
  });
});
