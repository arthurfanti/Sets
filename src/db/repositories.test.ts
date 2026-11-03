import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import routineSeed from "@/data/routines.json";
import { openDatabase, seedDatabase } from "@/db/database";
import { listRoutines } from "@/db/repositories";

let dbName: string;

beforeEach(() => {
  dbName = `sets-test-${crypto.randomUUID()}`;
});

describe("seeding", () => {
  it("writes every seeded Exercise and Built-in Routine on first open", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);

    expect(await db.count("exercises")).toBe(exerciseSeed.length);
    expect(await db.count("routines")).toBe(routineSeed.length);
    db.close();
  });

  it("maps the seed onto domain records with the slug as id", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);

    const routine = await db.get("routines", routineSeed[0]?.slug ?? "");
    expect(routine).toMatchObject({
      id: routineSeed[0]?.slug,
      name: routineSeed[0]?.name,
      source: "builtin",
    });
    expect(routine?.prescriptions[0]).toMatchObject({
      exerciseId: routineSeed[0]?.exercises[0]?.exercise,
      sets: routineSeed[0]?.exercises[0]?.sets,
    });
    db.close();
  });

  it("does not duplicate rows when seeding runs again", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);
    await seedDatabase(db, 2);

    expect(await db.count("exercises")).toBe(exerciseSeed.length);
    expect(await db.count("routines")).toBe(routineSeed.length);
    db.close();
  });

  it("never rewrites an existing row", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);

    const slug = routineSeed[0]?.slug ?? "";
    const original = await db.get("routines", slug);
    if (!original) throw new Error("seeded routine missing");
    await db.put("routines", { ...original, name: "Renomeada por mim" });
    await seedDatabase(db, 2);

    expect((await db.get("routines", slug))?.name).toBe("Renomeada por mim");
    db.close();
  });

  it("never resurrects a deleted Built-in", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);

    const slug = routineSeed[0]?.slug ?? "";
    await db.delete("routines", slug);
    await seedDatabase(db, 2);

    expect(await db.get("routines", slug)).toBeUndefined();
    db.close();
  });

  it("does nothing when the bundled version is not newer", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 5);

    const slug = routineSeed[0]?.slug ?? "";
    await db.delete("routines", slug);
    await seedDatabase(db, 5);

    expect(await db.get("routines", slug)).toBeUndefined();
    expect(await db.get("meta", "seedVersion")).toBe(5);
    db.close();
  });
});

describe("listRoutines", () => {
  it("lists Built-in Routines before User Routines", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db, 1);
    await db.put("routines", {
      id: "rot_minha",
      name: "Minha rotina",
      prescriptions: [],
      source: "user",
    });

    const routines = await listRoutines(db);
    const firstUser = routines.findIndex((routine) => routine.source === "user");

    expect(firstUser).toBe(routineSeed.length);
    expect(routines.at(-1)?.name).toBe("Minha rotina");
    db.close();
  });
});
