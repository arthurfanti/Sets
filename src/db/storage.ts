import type { SetsDb } from "@/db/database";
import { readyDatabase } from "@/db/database";

let persistenceRequest: Promise<boolean> | undefined;

/**
 * Asked once per launch, before any Session can exist, and never surfaced: a
 * refusal is a fact About discloses, not a prompt, nag or banner. The promise
 * is kept so About reports the answer instead of racing it.
 */
export function requestPersistentStorage(): void {
  persistenceRequest ??= (async () => {
    try {
      return (await navigator.storage?.persist?.()) ?? false;
    } catch {
      return false;
    }
  })();
}

/** The state About shows. Unknown, unavailable or failing all read as not protected. */
export async function isStoragePersisted(): Promise<boolean> {
  const granted = await persistenceRequest;
  try {
    return (await navigator.storage?.persisted?.()) ?? granted ?? false;
  } catch {
    return granted ?? false;
  }
}

/** What storage actually holds — counts and a date, never bytes. */
export interface StorageSummary {
  sessions: number;
  exercises: number;
  /** `undefined` until the first Session exists. */
  earliestStartedAt: number | undefined;
}

/**
 * Storage goes through the seeded session handle, so About never reads a
 * connection that skipped the seed on a cold deep link. Tests supply their own.
 */
async function withDatabase<T>(
  database: SetsDb | undefined,
  work: (db: SetsDb) => Promise<T>,
): Promise<T> {
  if (database) return work(database);
  return work(await readyDatabase());
}

export async function readStorageSummary(database?: SetsDb): Promise<StorageSummary> {
  return withDatabase(database, async (db) => {
    const [sessions, exercises, cursor] = await Promise.all([
      db.count("sessions"),
      db.count("exercises"),
      db.transaction("sessions").store.index("by-startedAt").openCursor(),
    ]);

    return {
      sessions,
      exercises,
      earliestStartedAt: cursor ? Number(cursor.key) : undefined,
    };
  });
}

/**
 * The one irreversible action: every store, including `meta`, so the next open
 * finds a first-run device and seeds the library again. Custom Exercises and
 * User Routines go with the Sessions — a half-clear would leave ornaments
 * pointing at nothing.
 */
export async function deleteEverything(database?: SetsDb): Promise<void> {
  await withDatabase(database, async (db) => {
    const tx = db.transaction(["exercises", "routines", "sessions", "meta"], "readwrite");
    await Promise.all([
      tx.objectStore("exercises").clear(),
      tx.objectStore("routines").clear(),
      tx.objectStore("sessions").clear(),
      tx.objectStore("meta").clear(),
      tx.done,
    ]);
  });
}
