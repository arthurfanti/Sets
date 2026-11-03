/**
 * The domain vocabulary the whole app shares.
 *
 * A Routine prescribes Sets, and a Session snapshots that prescription then
 * records what was actually performed. Exercises are referenced by id, so a
 * rename or a hide never rewrites history.
 *
 * Fields are added by the ticket that first needs them — this file is the
 * vocabulary, not a wish list.
 */

export const MUSCLE_GROUPS = [
  "Peito",
  "Costas",
  "Ombros",
  "Quadríceps",
  "Posteriores",
  "Panturrilha",
  "Bíceps",
  "Tríceps",
  "Abdômen",
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export type Source = "builtin" | "user";

export interface Exercise {
  /** Seed rows use their slug; user rows use `usr_` + a UUID. */
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Seeded short forms, matched by search and never displayed. */
  aliases?: string[];
  source: Source;
  /**
   * When the Lifter hid this Exercise. Hidden rows leave the picker but stay
   * resolvable, because the Sets that named them still have to render.
   */
  hiddenAt?: number;
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
  weight: number;
  reps: number;
  confirmedAt: number;
}

export interface Session {
  id: string;
  /** Null for an empty Session, started from no Routine. */
  routineId: string | null;
  startedAt: number;
  endedAt?: number;
  /** The Routine's prescription, copied at start so later edits cannot rewrite it. */
  plan: Prescription[];
  sets: PerformedSet[];
}
