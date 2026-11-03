import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import exerciseSeed from "@/data/exercises.json";
import routineSeed from "@/data/routines.json";
import { DatabaseOpenError, toOpenFailure } from "@/db/open-failure";
import type { Exercise, MuscleGroup, Prescription, Routine, Session } from "@/domain";

/** Bump when the bundled seed changes and the new rows should reach devices. */
export const SEED_VERSION = 1;

export const DATABASE_NAME = "sets";

export interface SetsDatabase extends DBSchema {
  exercises: { key: string; value: Exercise; indexes: { "by-name": string } };
  routines: { key: string; value: Routine };
  sessions: { key: string; value: Session; indexes: { "by-startedAt": number } };
  meta: { key: string; value: number | string[] };
}

export type SetsDb = IDBPDatabase<SetsDatabase>;

let ready: Promise<SetsDb> | undefined;

/**
 * The one connection the app uses: opened and seeded on first call, then
 * reused. Tests bypass this and pass their own database into the repositories.
 */
export function readyDatabase(): Promise<SetsDb> {
  ready ??= openReadyDatabase().catch((error: unknown) => {
    // A refused open must be retryable: "Tentar de novo" on the gate opens
    // again instead of replaying the stored rejection.
    ready = undefined;
    throw toOpenFailure(error);
  });
  return ready;
}

async function openReadyDatabase(): Promise<SetsDb> {
  const database = await openDatabase();
  try {
    await seedDatabase(database);
  } catch (error) {
    database.close();
    throw error;
  }
  return database;
}

/**
 * Drops the cached connection so the next `readyDatabase` opens again. The
 * destructive reset calls this before deleting: a live connection makes the
 * delete block until the tab closes.
 */
export async function forgetDatabase(): Promise<void> {
  const pending = ready;
  ready = undefined;
  if (!pending) return;
  try {
    (await pending).close();
  } catch {
    // An open that never succeeded holds nothing to close.
  }
}

interface SeedExercise {
  slug: string;
  name: string;
  muscleGroup: string;
  aliases?: string[];
}

interface SeedRoutineItem {
  exercise: string;
  sets: number;
  reps: number | string;
  weight?: number;
}

interface SeedRoutine {
  slug: string;
  name: string;
  exercises: SeedRoutineItem[];
}

const exercises = exerciseSeed as SeedExercise[];
const routines = routineSeed as SeedRoutine[];

export function openDatabase(name: string = DATABASE_NAME): Promise<SetsDb> {
  return new Promise((resolve, reject) => {
    let abandoned = false;
    const request = openDB<SetsDatabase>(name, 1, {
      upgrade(database) {
        database.createObjectStore("exercises", { keyPath: "id" }).createIndex("by-name", "name");
        database.createObjectStore("routines", { keyPath: "id" });
        database
          .createObjectStore("sessions", { keyPath: "id" })
          .createIndex("by-startedAt", "startedAt");
        database.createObjectStore("meta");
      },
      // Another tab holds an older connection, so the version change cannot
      // proceed. The gate names that cause and asks the Lifter to close it.
      blocked() {
        abandoned = true;
        reject(new DatabaseOpenError("blocked"));
      },
    });
    request.then(
      (database) => {
        // A blocked open can still finish after we gave up. Close it rather
        // than leave a connection in the way of the next retry.
        if (abandoned) database.close();
        else resolve(database);
      },
      (error: unknown) => reject(toOpenFailure(error)),
    );
  });
}

function toExercise(row: SeedExercise): Exercise {
  const exercise: Exercise = {
    id: row.slug,
    name: row.name,
    muscleGroup: row.muscleGroup as MuscleGroup,
    source: "builtin",
  };
  if (row.aliases && row.aliases.length > 0) exercise.aliases = row.aliases;
  return exercise;
}

function toRoutine(row: SeedRoutine): Routine {
  return {
    id: row.slug,
    name: row.name,
    source: "builtin",
    prescriptions: row.exercises.map((item): Prescription => {
      const prescription: Prescription = {
        exerciseId: item.exercise,
        sets: item.sets,
        reps: item.reps,
      };
      if (item.weight !== undefined) prescription.weight = item.weight;
      return prescription;
    }),
  };
}

/**
 * Insert-if-absent, and only when the bundled version is newer than the one
 * already applied.
 *
 * The list of ids the seed has already delivered is what makes deleted rows
 * stay deleted: without it, a version bump cannot tell "this Built-in was never
 * seeded" from "the Lifter deleted it", and the second case would resurrect it.
 * An existing row is never rewritten either.
 */
export async function seedDatabase(
  database: SetsDb,
  version: number = SEED_VERSION,
): Promise<void> {
  const applied = await database.get("meta", "seedVersion");
  if (typeof applied === "number" && applied >= version) return;

  const [deliveredExercises, deliveredRoutines] = await Promise.all([
    database.get("meta", "seededExercises"),
    database.get("meta", "seededRoutines"),
  ]);
  const deliveredExerciseIds = new Set(Array.isArray(deliveredExercises) ? deliveredExercises : []);
  const deliveredRoutineIds = new Set(Array.isArray(deliveredRoutines) ? deliveredRoutines : []);

  // Rows already on the device count as delivered even if the bookkeeping is
  // missing, so an upgrade never re-inserts what is already there.
  for (const id of await database.getAllKeys("exercises")) deliveredExerciseIds.add(id);
  for (const id of await database.getAllKeys("routines")) deliveredRoutineIds.add(id);

  const tx = database.transaction(["exercises", "routines", "meta"], "readwrite");
  for (const row of exercises) {
    if (deliveredExerciseIds.has(row.slug)) continue;
    void tx.objectStore("exercises").put(toExercise(row));
    deliveredExerciseIds.add(row.slug);
  }
  for (const row of routines) {
    if (deliveredRoutineIds.has(row.slug)) continue;
    void tx.objectStore("routines").put(toRoutine(row));
    deliveredRoutineIds.add(row.slug);
  }
  void tx.objectStore("meta").put([...deliveredExerciseIds], "seededExercises");
  void tx.objectStore("meta").put([...deliveredRoutineIds], "seededRoutines");
  void tx.objectStore("meta").put(version, "seedVersion");
  await tx.done;
}
