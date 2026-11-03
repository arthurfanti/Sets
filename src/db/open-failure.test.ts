import "fake-indexeddb/auto";
import { afterEach, describe, expect, it } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import { DATABASE_NAME, forgetDatabase, readyDatabase } from "@/db/database";
import { DatabaseOpenError, openFailureCause } from "@/db/open-failure";
import { resetDatabase } from "@/db/reset";

afterEach(async () => {
  await forgetDatabase();
  await resetDatabase(DATABASE_NAME).catch(() => undefined);
});

describe("open failure cause", () => {
  it("reads a quota refusal as no disk space", () => {
    const error = new DOMException("The quota has been exceeded.", "QuotaExceededError");

    expect(openFailureCause(error)).toBe("quota");
  });

  it("reads a version mismatch and anything unknown as unknown", () => {
    expect(openFailureCause(new DOMException("Version error", "VersionError"))).toBe("unknown");
    expect(openFailureCause(new Error("???"))).toBe("unknown");
    expect(openFailureCause(undefined)).toBe("unknown");
  });

  it("keeps a cause that was already named, including a blocked open", () => {
    expect(openFailureCause(new DatabaseOpenError("blocked"))).toBe("blocked");
    expect(openFailureCause(new DatabaseOpenError("quota"))).toBe("quota");
  });
});

describe("readyDatabase", () => {
  it("can be retried after a refused open, and seeds on the next attempt", async () => {
    // A newer database at the same name makes the app's version-1 open fail
    // the way a corrupt or mismatched database does.
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, 2);
      request.onupgradeneeded = () => undefined;
      request.onsuccess = () => {
        request.result.close();
        resolve();
      };
      request.onerror = () => reject(request.error);
    });

    await expect(readyDatabase()).rejects.toMatchObject({ reason: "unknown" });

    await resetDatabase();
    const reopened = await readyDatabase();

    expect(await reopened.count("exercises")).toBe(exerciseSeed.length);
  });
});
