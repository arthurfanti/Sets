import type { PerformedSet, Session } from "@/domain";

/**
 * What an Exercise's history means for progress, in numbers only.
 *
 * A Best Set is the Set with the highest estimated 1RM under Epley, and the
 * estimate is only trustworthy inside the 1–10 rep window: a Set outside it is
 * still recorded and still counts toward volume, but it can never headline and
 * is never clamped into range. Volume is Σ weight × reps. Weeks start on
 * Monday at local midnight, because the Lifter trained on their own calendar.
 */

export const ONE_REP_MAX_REP_WINDOW = { min: 1, max: 10 } as const;

/** The default chart window: the current week plus the eleven before it. */
export const WINDOW_WEEKS = 12;

export interface ProgressRange {
  /** "Now" is passed in so the window boundary is testable and never drifts. */
  now: number;
  weeks: number | "all";
}

export interface WeekBucket {
  /** Monday 00:00 in the device's local zone. */
  start: number;
  /** Σ weight × reps for the Exercise's Sets recorded that week. */
  volume: number;
}

export interface OneRepMaxPoint {
  sessionId: string;
  /** When the Session's best eligible Set was confirmed. */
  at: number;
  /** Epley kilograms. */
  value: number;
  weight: number;
  reps: number;
}

/**
 * Epley: weight × (1 + reps/30), applied unchanged at one rep. A Set outside
 * the window returns null rather than an estimate, so no caller can mistake a
 * clamped value for a real one.
 */
export function estimatedOneRepMax(weight: number, reps: number): number | null {
  if (!Number.isFinite(weight) || !Number.isInteger(reps)) return null;
  if (reps < ONE_REP_MAX_REP_WINDOW.min || reps > ONE_REP_MAX_REP_WINDOW.max) return null;
  return weight * (1 + reps / 30);
}

/** The highest eligible estimate, or null when nothing can be a Best Set. */
export function bestSet(sets: readonly PerformedSet[]): PerformedSet | null {
  let best: PerformedSet | null = null;
  let bestValue = Number.NEGATIVE_INFINITY;

  for (const set of sets) {
    const value = estimatedOneRepMax(set.weight, set.reps);
    if (value !== null && value > bestValue) {
      best = set;
      bestValue = value;
    }
  }

  return best;
}

/** Σ weight × reps, over every recorded Set regardless of the rep window. */
export function totalVolume(sets: readonly PerformedSet[]): number {
  return sets.reduce((sum, set) => sum + set.weight * set.reps, 0);
}

/** The heaviest weight ever recorded, or null without Sets. */
export function heaviestWeight(sets: readonly PerformedSet[]): number | null {
  return sets.reduce<number | null>(
    (heaviest, set) => (heaviest === null || set.weight > heaviest ? set.weight : heaviest),
    null,
  );
}

function addDays(at: number, days: number): number {
  const date = new Date(at);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

/** Monday 00:00 local time for the week that contains `at`. */
export function weekStart(at: number): number {
  const date = new Date(at);
  date.setHours(0, 0, 0, 0);
  // getDay() is Sunday-first; Monday-first weeks make Sunday the last day.
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return date.getTime();
}

interface Effort {
  at: number;
  weight: number;
  reps: number;
}

function efforts(sessions: readonly Session[], exerciseId: string): Effort[] {
  return sessions.flatMap((session) =>
    session.sets
      .filter((set) => set.exerciseId === exerciseId)
      .map((set) => ({ at: set.confirmedAt, weight: set.weight, reps: set.reps })),
  );
}

/** The Monday that opens the range, or null when a window holds no week yet. */
function firstWeek(range: ProgressRange, earliestEffort: number | undefined): number {
  const current = weekStart(range.now);
  if (range.weeks === "all") {
    return earliestEffort === undefined ? current : Math.min(weekStart(earliestEffort), current);
  }
  const weeks = Math.max(1, Math.trunc(range.weeks));
  return addDays(current, (weeks - 1) * -7);
}

function isInRange(at: number, range: ProgressRange, earliestEffort: number | undefined): boolean {
  return weekStart(at) >= firstWeek(range, earliestEffort);
}

/**
 * Weekly volume for one Exercise. Empty weeks are kept as zero so the line
 * cannot imply work between two points that did not happen. A Set logged late
 * on a Sunday belongs to the week that has just ended, because its bucket is
 * the Monday before it.
 */
export function weeklyVolume(
  sessions: readonly Session[],
  exerciseId: string,
  range: ProgressRange,
): WeekBucket[] {
  const recorded = efforts(sessions, exerciseId);
  const earliest = recorded.reduce<number | undefined>(
    (oldest, effort) => (oldest === undefined || effort.at < oldest ? effort.at : oldest),
    undefined,
  );

  const start = firstWeek(range, earliest);
  const current = weekStart(range.now);
  const buckets: WeekBucket[] = [];
  for (let week = start; week <= current; week = addDays(week, 7)) {
    buckets.push({ start: week, volume: 0 });
  }

  const byStart = new Map(buckets.map((bucket) => [bucket.start, bucket]));
  for (const effort of recorded) {
    const bucket = byStart.get(weekStart(effort.at));
    if (bucket) bucket.volume += effort.weight * effort.reps;
  }

  return buckets;
}

/**
 * One point per Session that recorded an eligible Set: that Session's highest
 * estimate, placed when the Set was confirmed. A Session whose Sets all fell
 * outside the rep window contributes no point rather than a clamped one.
 */
export function oneRepMaxSeries(
  sessions: readonly Session[],
  exerciseId: string,
  range: ProgressRange,
): OneRepMaxPoint[] {
  const recorded = efforts(sessions, exerciseId);
  const earliest = recorded.reduce<number | undefined>(
    (oldest, effort) => (oldest === undefined || effort.at < oldest ? effort.at : oldest),
    undefined,
  );

  return sessions
    .map((session): OneRepMaxPoint | null => {
      const sets = session.sets.filter((set) => set.exerciseId === exerciseId);
      const best = bestSet(sets);
      if (!best) return null;
      const value = estimatedOneRepMax(best.weight, best.reps);
      if (value === null) return null;
      return {
        sessionId: session.id,
        at: best.confirmedAt,
        value,
        weight: best.weight,
        reps: best.reps,
      };
    })
    .filter((point): point is OneRepMaxPoint => point !== null)
    .filter((point) => isInRange(point.at, range, earliest))
    .sort((a, b) => a.at - b.at);
}
