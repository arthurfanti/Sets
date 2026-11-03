import { readyDatabase, type SetsDb } from "@/db/database";
import type { Exercise, MuscleGroup } from "@/domain";
import { findNameConflict } from "@/domain/naming";

/**
 * Writes for the Exercises the Lifter creates from inside the picker, and the
 * two rules that protect them: a name is unique once normalized, and a
 * Built-in is read-only. Hiding is a soft delete so recorded Sets keep
 * resolving the label they were logged under.
 */

/** A Built-in row was handed to a write that only User Exercises allow. */
export class BuiltInExerciseError extends Error {
  constructor(id: string) {
    super(`Exercício pronto não pode ser alterado: ${id}`);
    this.name = "BuiltInExerciseError";
  }
}

/** An Exercise already answers to the typed name, whatever the spelling. */
export class ExerciseNameConflictError extends Error {
  readonly existing: Exercise;

  constructor(existing: Exercise) {
    super(`Já existe um exercício com esse nome: ${existing.name}`);
    this.name = "ExerciseNameConflictError";
    this.existing = existing;
  }
}

async function allExercises(db: SetsDb): Promise<Exercise[]> {
  return db.getAll("exercises");
}

export async function createExercise(
  input: { name: string; muscleGroup: MuscleGroup },
  database?: SetsDb,
): Promise<Exercise> {
  const db = database ?? (await readyDatabase());
  const name = input.name.trim();
  if (name.length === 0) throw new Error("Um exercício precisa de um nome.");

  const conflict = findNameConflict(await allExercises(db), name);
  if (conflict?.kind === "exact") throw new ExerciseNameConflictError(conflict.exercise);

  const exercise: Exercise = {
    id: `usr_${crypto.randomUUID()}`,
    name,
    muscleGroup: input.muscleGroup,
    source: "user",
  };
  await db.put("exercises", exercise);
  return exercise;
}

/** Sets reference the id, so the new label reaches history without a rewrite. */
export async function renameExercise(
  id: string,
  name: string,
  database?: SetsDb,
): Promise<Exercise> {
  const db = database ?? (await readyDatabase());
  const stored = await db.get("exercises", id);
  if (!stored) throw new Error(`Exercício não encontrado: ${id}`);
  if (stored.source === "builtin") throw new BuiltInExerciseError(id);

  const trimmed = name.trim();
  if (trimmed.length === 0) throw new Error("Um exercício precisa de um nome.");

  const conflict = findNameConflict(await allExercises(db), trimmed, { exceptId: id });
  if (conflict?.kind === "exact") throw new ExerciseNameConflictError(conflict.exercise);

  const renamed: Exercise = { ...stored, name: trimmed };
  await db.put("exercises", renamed);
  return renamed;
}

export async function hideExercise(id: string, database?: SetsDb): Promise<void> {
  const db = database ?? (await readyDatabase());
  const stored = await db.get("exercises", id);
  if (!stored) throw new Error(`Exercício não encontrado: ${id}`);
  if (stored.source === "builtin") throw new BuiltInExerciseError(id);
  if (stored.hiddenAt !== undefined) return;

  await db.put("exercises", { ...stored, hiddenAt: Date.now() });
}

/** What the picker may offer: Built-ins plus the Lifter's visible Exercises. */
export async function listSelectableExercises(database?: SetsDb): Promise<Exercise[]> {
  const db = database ?? (await readyDatabase());
  const all = await db.getAll("exercises");
  return all.filter((exercise) => exercise.hiddenAt === undefined);
}
