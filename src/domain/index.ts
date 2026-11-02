/**
 * The domain vocabulary the whole app shares.
 *
 * These shapes are the settled data model: a Routine prescribes Sets, a Session
 * snapshots that prescription and records what was actually performed, and an
 * Exercise is referenced by id so a rename or a hide never rewrites history.
 */

export type MuscleGroup =
  | "Peito"
  | "Costas"
  | "Ombros"
  | "Quadríceps"
  | "Posteriores"
  | "Panturrilha"
  | "Bíceps"
  | "Tríceps"
  | "Abdômen";

/** Fixed picker ordering. Never alphabetical. */
export const MUSCLE_GROUPS: readonly MuscleGroup[] = [
  "Peito",
  "Costas",
  "Ombros",
  "Quadríceps",
  "Posteriores",
  "Panturrilha",
  "Bíceps",
  "Tríceps",
  "Abdômen",
];

export type Source = "builtin" | "user";

export interface Exercise {
  /** Seed rows use their slug; user rows use `usr_` + a UUID. */
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  aliases?: string[];
  /** Set when a user row was soft-deleted: gone from the picker, still in history. */
  hiddenAt?: number;
  source: Source;
}

/** One Exercise in a Routine, with what it prescribes. */
export interface Prescription {
  exerciseId: string;
  sets: number;
  /** An exact count, or a range such as "8-12". */
  reps: number | string;
  /** Kilograms. A bare number — there is no unit per Set. */
  weight?: number;
}

export interface Routine {
  id: string;
  name: string;
  prescriptions: Prescription[];
  source: Source;
}

/** One performed effort. */
export interface PerformedSet {
  exerciseId: string;
  /** Position within that Exercise's block, so pre-fill can seed the same slot. */
  index: number;
  weight: number;
  reps: number;
  confirmedAt: number;
}

export interface Session {
  id: string;
  /** Null for an empty Session started without a Routine. */
  routineId: string | null;
  startedAt: number;
  endedAt?: number;
  /** The Routine's prescription, copied at start so later edits cannot rewrite it. */
  plan: Prescription[];
  sets: PerformedSet[];
}
