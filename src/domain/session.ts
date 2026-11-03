import type { PerformedSet, Prescription, Session } from "@/domain";

/** How far back the pre-fill looks for the same Exercise, in Sessions. */
export const PREFILL_WALK_BACK = 5;

/** One slot in the Session's Plan: an Exercise and which Set of it. */
export interface Slot {
  exerciseId: string;
  /** Zero-based, within the Exercise block. */
  index: number;
  prescription: Prescription;
}

/** Where a slot's suggested values came from. */
export type PrefillSource = "history" | "target" | "none";

export interface Prefill {
  /** Kilograms, or null when there is nothing to suggest. */
  weight: number | null;
  /** Never from the prescribed range — only from what was actually done. */
  reps: number | null;
  source: PrefillSource;
}

/**
 * One block per Exercise, keeping the first prescription. A Session keys a Set
 * by `exerciseId` and slot index, so two blocks of the same Exercise would
 * share slots and the second confirmation would overwrite the first. The
 * editor refuses the duplicate; this protects a Session made from a Routine
 * that acquired one another way.
 */
export function uniquePlan(plan: readonly Prescription[]): Prescription[] {
  const seen = new Set<string>();
  return plan.filter((prescription) => {
    if (seen.has(prescription.exerciseId)) return false;
    seen.add(prescription.exerciseId);
    return true;
  });
}

/** Expands a Plan into one slot per prescribed Set, indexed per Exercise. */
export function planSlots(plan: Prescription[]): Slot[] {
  return plan.flatMap((prescription) =>
    Array.from({ length: Math.max(0, prescription.sets) }, (_, index) => ({
      exerciseId: prescription.exerciseId,
      index,
      prescription,
    })),
  );
}

/**
 * A slot's suggestion: the Set at the same index in the most recent finished
 * Session containing that Exercise, walking back at most five Sessions. A
 * Session that logged fewer Sets lends its last Set for the Exercise; one that
 * logged none is skipped. Only when no Session can answer does the Routine's
 * target weight apply, for weight alone.
 */
export function prefillSlot(
  exerciseId: string,
  slotIndex: number,
  history: Session[],
  targetWeight: number | undefined,
): Prefill {
  const candidates = history
    .filter((session) => session.endedAt !== undefined)
    // Only a Session that actually logged this Exercise is a candidate. A
    // merely prescribed one has nothing to lend and would otherwise spend one
    // of the five slots, hiding a real earlier Session.
    .filter((session) => session.sets.some((set) => set.exerciseId === exerciseId))
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, PREFILL_WALK_BACK);

  for (const session of candidates) {
    const sets = session.sets
      .filter((set) => set.exerciseId === exerciseId)
      .sort((a, b) => a.index - b.index);
    if (sets.length === 0) continue;

    const chosen = sets.find((set) => set.index === slotIndex) ?? sets[sets.length - 1];
    if (!chosen) continue;
    return { weight: chosen.weight, reps: chosen.reps, source: "history" };
  }

  if (targetWeight !== undefined) {
    return { weight: targetWeight, reps: null, source: "target" };
  }
  return { weight: null, reps: null, source: "none" };
}

/** A stable key for one slot's confirmed Set. */
export function setKey(exerciseId: string, index: number): string {
  return `${exerciseId}\u0000${index}`;
}

/**
 * The Session as it stands with one Set confirmed. A Set replaces the slot it
 * names and otherwise appends, so the same value can be applied either to a
 * stored document or to the in-memory copy a failed write leaves on screen.
 */
export function applySet(session: Session, set: PerformedSet): Session {
  const sets = [...session.sets];
  const existing = sets.findIndex(
    (row) => row.exerciseId === set.exerciseId && row.index === set.index,
  );
  if (existing >= 0) sets[existing] = set;
  else sets.push(set);
  return { ...session, sets };
}

/** The first slot that has no confirmed Set yet, in Plan order. */
export function activeSlot(plan: Prescription[], sets: PerformedSet[]): Slot | null {
  const confirmed = new Set(sets.map((set) => setKey(set.exerciseId, set.index)));
  return (
    planSlots(plan).find((slot) => !confirmed.has(setKey(slot.exerciseId, slot.index))) ?? null
  );
}

/**
 * When the Session last recorded an effort: the newest Set's timestamp, or the
 * start when nothing was logged. This — never "now" — is where a Session ends,
 * so opening the app again after an overnight gap cannot bill the gap as
 * training time.
 */
export function lastActivityAt(session: Session): number {
  const lastSet = session.sets.reduce(
    (latest, set) => Math.max(set.confirmedAt, latest),
    Number.NEGATIVE_INFINITY,
  );
  return Number.isFinite(lastSet) ? lastSet : session.startedAt;
}

/**
 * Training time, measured to the last recorded effort. A finished Session ends
 * where it was closed; an empty one that was finished honestly measures zero.
 */
export function sessionDuration(session: Session): number {
  const endedAt = session.endedAt ?? lastActivityAt(session);
  return Math.max(0, endedAt - session.startedAt);
}

function sameLocalDay(a: number, b: number): boolean {
  const first = new Date(a);
  const second = new Date(b);
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  );
}

/**
 * A Session left open across a local date boundary is brought back to the
 * Lifter's attention on the next launch instead of being silently closed. The
 * boundary is the device's own day, because that is the day the Lifter trained.
 */
export function isStale(session: Session, now: number): boolean {
  if (session.endedAt !== undefined) return false;
  return !sameLocalDay(lastActivityAt(session), now);
}
