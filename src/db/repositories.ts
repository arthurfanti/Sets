import routineSeed from "@/data/routines.json";
import { openDatabase, type SetsDb, seedDatabase } from "@/db/database";
import type { Exercise, Routine } from "@/domain";

let ready: Promise<SetsDb> | undefined;

/** Opens the database once and seeds it, then reuses the handle for the session. */
function defaultDatabase(): Promise<SetsDb> {
  ready ??= (async () => {
    const database = await openDatabase();
    await seedDatabase(database);
    return database;
  })();
  return ready;
}

const seedOrder = new Map(
  (routineSeed as { slug: string }[]).map((row, index) => [row.slug, index]),
);

/**
 * Built-in Routines first, in the order the bundle declares them; User Routines
 * after, by name. A Built-in that is no longer in the bundle sorts to the end of
 * its own group rather than being dropped.
 */
function rank(routine: Routine): number {
  if (routine.source !== "builtin") return Number.MAX_SAFE_INTEGER;
  return seedOrder.get(routine.id) ?? Number.MAX_SAFE_INTEGER - 1;
}

export async function listRoutines(database?: SetsDb): Promise<Routine[]> {
  const db = database ?? (await defaultDatabase());
  const all = await db.getAll("routines");
  return all.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "pt-BR"));
}

export async function listExercises(database?: SetsDb): Promise<Exercise[]> {
  const db = database ?? (await defaultDatabase());
  return db.getAll("exercises");
}
