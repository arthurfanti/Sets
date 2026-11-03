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
    .filter(
      (session) =>
        session.plan.some((row) => row.exerciseId === exerciseId) ||
        session.sets.some((set) => set.exerciseId === exerciseId),
    )
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

/** The first slot that has no confirmed Set yet, in Plan order. */
export function activeSlot(plan: Prescription[], sets: PerformedSet[]): Slot | null {
  const confirmed = new Set(sets.map((set) => setKey(set.exerciseId, set.index)));
  return (
    planSlots(plan).find((slot) => !confirmed.has(setKey(slot.exerciseId, slot.index))) ?? null
  );
}
