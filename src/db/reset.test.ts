import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import {
  DATABASE_NAME,
  forgetDatabase,
  openDatabase,
  readyDatabase,
  seedDatabase,
} from "@/db/database";
import { resetDatabase } from "@/db/reset";

afterEach(async () => {
  await forgetDatabase();
});

describe("resetDatabase", () => {
  it("deletes the history and the next open seeds a first-run device", async () => {
    const name = `sets-reset-${crypto.randomUUID()}`;
    const db = await openDatabase(name);
    await seedDatabase(db);
    await db.put("sessions", { id: "ses_1", routineId: null, startedAt: 1, plan: [], sets: [] });
    db.close();

    await resetDatabase(name);

    const reopened = await openDatabase(name);
    await seedDatabase(reopened);
    expect(await reopened.count("sessions")).toBe(0);
    expect(await reopened.count("exercises")).toBe(exerciseSeed.length);
    reopened.close();
  });

  it("closes the app's connection first, so the delete is never left waiting", async () => {
    await readyDatabase();

    await resetDatabase(DATABASE_NAME);

    const reopened = await openDatabase(DATABASE_NAME);
    expect(await reopened.count("exercises")).toBe(0);
    reopened.close();
  });

  it("removes a database the app cannot open, whatever is inside it", async () => {
    const name = `sets-reset-${crypto.randomUUID()}`;
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(name, 7);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("garbage");
      };
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    await resetDatabase(name);

    const reopened = await openDatabase(name);
    await seedDatabase(reopened);
    expect(await reopened.count("exercises")).toBe(exerciseSeed.length);
    reopened.close();
  });
});
