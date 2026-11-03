import routineSeed from "@/data/routines.json";
import { readyDatabase, type SetsDb } from "@/db/database";
import type { Exercise, Routine } from "@/domain";

/** Built-in Routines keep the order the bundle declares them in. */
const builtInOrder = new Map(
  (routineSeed as { slug: string }[]).map((row, index) => [row.slug, index]),
);

/**
 * Built-in Routines first in bundle order, then User Routines by name. A
 * Built-in that is no longer in the bundle still sorts inside its own group
 * rather than landing among the user's Routines.
 */
function compareRoutines(a: Routine, b: Routine): number {
  const groupA = a.source === "builtin" ? 0 : 1;
  const groupB = b.source === "builtin" ? 0 : 1;
  if (groupA !== groupB) return groupA - groupB;

  if (groupA === 0) {
    const orderA = builtInOrder.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const orderB = builtInOrder.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
  }
  return a.name.localeCompare(b.name, "pt-BR");
}

export async function listRoutines(database?: SetsDb): Promise<Routine[]> {
  const db = database ?? (await readyDatabase());
  const all = await db.getAll("routines");
  return all.sort(compareRoutines);
}

export async function listExercises(database?: SetsDb): Promise<Exercise[]> {
  const db = database ?? (await readyDatabase());
  return db.getAll("exercises");
}

/** Zero is the first-run signal: nothing has been trained yet. */
export async function countSessions(database?: SetsDb): Promise<number> {
  const db = database ?? (await readyDatabase());
  return db.count("sessions");
}
