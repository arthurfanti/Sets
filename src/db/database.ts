import { type DBSchema, type IDBPDatabase, openDB } from "idb";
import exerciseSeed from "@/data/exercises.json";
import routineSeed from "@/data/routines.json";
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

export async function openDatabase(name: string = DATABASE_NAME): Promise<SetsDb> {
  return openDB<SetsDatabase>(name, 1, {
    upgrade(database) {
      database.createObjectStore("exercises", { keyPath: "id" }).createIndex("by-name", "name");
      database.createObjectStore("routines", { keyPath: "id" });
      database
        .createObjectStore("sessions", { keyPath: "id" })
        .createIndex("by-startedAt", "startedAt");
      database.createObjectStore("meta");
    },
  });
}

function toExercise(row: SeedExercise): Exercise {
  return {
    id: row.slug,
    name: row.name,
    muscleGroup: row.muscleGroup as MuscleGroup,
    source: "builtin",
  };
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
