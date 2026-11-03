import { deleteDB } from "idb";
import { DATABASE_NAME, forgetDatabase } from "@/db/database";

/**
 * The escape hatch that makes the blocked-database gate safe: whatever state
 * the database is in, deleting it returns the app to a first run, and the next
 * open seeds the library again. It costs the history, which ADR 0001 already
 * accepts as unrecoverable — better a working app with no data than one that
 * cannot open.
 *
 * This app's connection is closed first: a live connection makes the browser
 * hold the delete until the tab closes, which would leave the gate waiting.
 */
export async function resetDatabase(name: string = DATABASE_NAME): Promise<void> {
  await forgetDatabase();
  await new Promise<void>((resolve, reject) => {
    void deleteDB(name, {
      // Another tab is holding the database. Report it instead of hanging.
      blocked: () => reject(new Error(`Deleting ${name} was blocked by another connection.`)),
    }).then(resolve, reject);
  });
}
