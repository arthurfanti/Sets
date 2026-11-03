import { readyDatabase, type SetsDb } from "@/db/database";
import type { Prescription, Routine } from "@/domain";

/**
 * Writes for the Routine editor, kept apart from the read repository so the
 * editor's rules have one home: a Built-in Routine is never mutated, only
 * forked, and a Lifter's own Routine can be created, saved and removed.
 */

/** A Built-in row was handed to a write that only User Routines allow. */
export class BuiltInRoutineError extends Error {
  constructor(id: string) {
    super(`Rotina pronta não pode ser alterada: ${id}`);
    this.name = "BuiltInRoutineError";
  }
}

export async function getRoutine(id: string, database?: SetsDb): Promise<Routine | undefined> {
  const db = database ?? (await readyDatabase());
  return db.get("routines", id);
}

/**
 * A fork keeps the Built-in's name under a marker that says who owns the copy.
 * The suffix is the only difference, so the Lifter still recognizes the plan.
 */
export function forkName(builtInName: string): string {
  return `${builtInName} (minha)`;
}

export async function createRoutine(
  input: { name: string; prescriptions: Prescription[] },
  database?: SetsDb,
): Promise<Routine> {
  const db = database ?? (await readyDatabase());
  const routine: Routine = {
    id: `rot_${crypto.randomUUID()}`,
    name: input.name.trim(),
    prescriptions: input.prescriptions,
    source: "user",
  };
  await db.put("routines", routine);
  return routine;
}

/**
 * Upserts a User Routine. Reading the stored row first is what makes the
 * Built-in rule enforceable: saving is the moment a fork must happen instead.
 */
export async function saveRoutine(routine: Routine, database?: SetsDb): Promise<Routine> {
  const db = database ?? (await readyDatabase());
  const stored = await db.get("routines", routine.id);
  if (routine.source === "builtin" || stored?.source === "builtin") {
    throw new BuiltInRoutineError(routine.id);
  }

  const saved: Routine = { ...routine, name: routine.name.trim(), source: "user" };
  await db.put("routines", saved);
  return saved;
}

export async function deleteRoutine(id: string, database?: SetsDb): Promise<void> {
  const db = database ?? (await readyDatabase());
  const stored = await db.get("routines", id);
  if (stored?.source === "builtin") throw new BuiltInRoutineError(id);
  await db.delete("routines", id);
}
