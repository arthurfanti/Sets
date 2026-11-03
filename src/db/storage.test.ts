import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import routineSeed from "@/data/routines.json";
import { openDatabase, seedDatabase } from "@/db/database";
import { deleteEverything, readStorageSummary } from "@/db/storage";
import type { Session } from "@/domain";

let dbName: string;

beforeEach(() => {
  dbName = `sets-test-${crypto.randomUUID()}`;
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function session(id: string, startedAt: number): Session {
  return { id, routineId: null, startedAt, plan: [], sets: [] };
}

describe("readStorageSummary", () => {
  it("counts Sessions and Exercises and dates the earliest Session", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db);
    await db.put("sessions", session("ses_younger", Date.UTC(2026, 7, 20, 12)));
    await db.put("sessions", session("ses_older", Date.UTC(2026, 7, 12, 12)));

    const summary = await readStorageSummary(db);

    expect(summary.sessions).toBe(2);
    expect(summary.exercises).toBe(exerciseSeed.length);
    expect(summary.earliestStartedAt).toBe(Date.UTC(2026, 7, 12, 12));
    db.close();
  });

  it("reports no earliest Session when none was ever trained", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db);

    const summary = await readStorageSummary(db);

    expect(summary.sessions).toBe(0);
    expect(summary.earliestStartedAt).toBeUndefined();
    db.close();
  });
});

describe("deleteEverything", () => {
  it("clears every store, including custom Exercises, User Routines and meta", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db);
    await db.put("exercises", {
      id: "usr_supino",
      name: "Supino inclinado",
      muscleGroup: "Peito",
      source: "user",
    });
    await db.put("routines", {
      id: "rot_minha",
      name: "Minha rotina",
      prescriptions: [],
      source: "user",
    });
    await db.put("sessions", session("ses_1", Date.UTC(2026, 7, 12, 12)));

    await deleteEverything(db);

    expect(await db.count("exercises")).toBe(0);
    expect(await db.count("routines")).toBe(0);
    expect(await db.count("sessions")).toBe(0);
    expect(await db.getAllKeys("meta")).toEqual([]);
    db.close();
  });

  it("returns the app to first-run state so seeds re-apply on the next open", async () => {
    const db = await openDatabase(dbName);
    await seedDatabase(db);
    await db.put("sessions", session("ses_1", Date.UTC(2026, 7, 12, 12)));
    await deleteEverything(db);
    db.close();

    const reopened = await openDatabase(dbName);
    await seedDatabase(reopened);

    expect(await reopened.count("exercises")).toBe(exerciseSeed.length);
    expect(await reopened.count("routines")).toBe(routineSeed.length);
    expect(await reopened.count("sessions")).toBe(0);
    reopened.close();
  });
});

describe("persistent storage", () => {
  it("requests it once at launch and never complains when it is refused", async () => {
    vi.resetModules();
    const persist = vi.fn().mockRejectedValue(new Error("refused"));
    vi.stubGlobal("navigator", { storage: { persist, persisted: vi.fn() } });
    const { requestPersistentStorage } = await import("@/db/storage");

    expect(() => {
      requestPersistentStorage();
      requestPersistentStorage();
    }).not.toThrow();
    await Promise.resolve();
    await Promise.resolve();

    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("reports the persisted state", async () => {
    vi.resetModules();
    vi.stubGlobal("navigator", {
      storage: { persist: vi.fn(), persisted: vi.fn().mockResolvedValue(true) },
    });
    const { isStoragePersisted } = await import("@/db/storage");

    expect(await isStoragePersisted()).toBe(true);
  });

  it("treats an unavailable check as not protected", async () => {
    vi.resetModules();
    vi.stubGlobal("navigator", {});
    const { isStoragePersisted } = await import("@/db/storage");

    expect(await isStoragePersisted()).toBe(false);
  });
});
