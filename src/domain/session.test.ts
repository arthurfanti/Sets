import { describe, expect, it } from "vitest";
import type { PerformedSet, Prescription, Session } from "@/domain";
import { activeSlot, PREFILL_WALK_BACK, planSlots, prefillSlot } from "@/domain/session";

const SUPINO = "supino-reto";
const AGACHAMENTO = "agachamento";

function prescription(
  exerciseId: string,
  sets: number,
  reps: number | string = 8,
  weight?: number,
): Prescription {
  const row: Prescription = { exerciseId, sets, reps };
  if (weight !== undefined) row.weight = weight;
  return row;
}

function performed(
  exerciseId: string,
  index: number,
  weight: number,
  reps: number,
  confirmedAt = 1,
): PerformedSet {
  return { exerciseId, index, weight, reps, confirmedAt };
}

function finished(startedAt: number, plan: Prescription[], sets: PerformedSet[]): Session {
  return {
    id: `ses_${startedAt}`,
    routineId: "rotina",
    startedAt,
    endedAt: startedAt + 1000,
    plan,
    sets,
  };
}

function open(startedAt: number, plan: Prescription[], sets: PerformedSet[]): Session {
  return { id: `ses_open_${startedAt}`, routineId: "rotina", startedAt, plan, sets };
}

describe("planSlots", () => {
  it("expands each prescription into one slot per prescribed Set, indexed per Exercise", () => {
    const slots = planSlots([prescription(SUPINO, 3), prescription(AGACHAMENTO, 2, "8-12", 60)]);

    expect(slots.map((slot) => [slot.exerciseId, slot.index])).toEqual([
      [SUPINO, 0],
      [SUPINO, 1],
      [SUPINO, 2],
      [AGACHAMENTO, 0],
      [AGACHAMENTO, 1],
    ]);
  });
});

describe("prefillSlot", () => {
  it("takes the Set at the same index from the most recent finished Session", () => {
    const history = [
      finished(1, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 95, 10)]),
      finished(
        2,
        [prescription(SUPINO, 3)],
        [performed(SUPINO, 0, 105, 9), performed(SUPINO, 1, 100, 8)],
      ),
    ];

    expect(prefillSlot(SUPINO, 1, history, 80)).toEqual({
      weight: 100,
      reps: 8,
      source: "history",
    });
  });

  it("uses history rather than the Routine's target weight", () => {
    const history = [finished(1, [prescription(SUPINO, 3, 8, 80)], [performed(SUPINO, 0, 105, 6)])];

    expect(prefillSlot(SUPINO, 0, history, 80)).toEqual({
      weight: 105,
      reps: 6,
      source: "history",
    });
  });

  it("takes that Session's last Set for the Exercise when it logged fewer Sets", () => {
    const history = [
      finished(
        1,
        [prescription(SUPINO, 3)],
        [performed(SUPINO, 0, 100, 10), performed(SUPINO, 1, 95, 8)],
      ),
    ];

    expect(prefillSlot(SUPINO, 2, history, 80)).toEqual({
      weight: 95,
      reps: 8,
      source: "history",
    });
  });

  it("walks back a Session that contains the Exercise but logged none of it", () => {
    const history = [
      finished(2, [prescription(SUPINO, 3), prescription(AGACHAMENTO, 3)], []),
      finished(1, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 90, 12)]),
    ];

    expect(prefillSlot(SUPINO, 0, history, 80)).toEqual({
      weight: 90,
      reps: 12,
      source: "history",
    });
  });

  it("stops walking back after five Sessions", () => {
    const history: Session[] = [];
    for (let offset = 0; offset < PREFILL_WALK_BACK; offset++) {
      history.push(finished(100 - offset, [prescription(SUPINO, 3)], []));
    }
    history.push(finished(1, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 90, 12)]));

    expect(prefillSlot(SUPINO, 0, history, 70)).toEqual({
      weight: 70,
      reps: null,
      source: "target",
    });
  });

  it("still finds history when fewer than five Sessions stand in between", () => {
    const history: Session[] = [];
    for (let offset = 0; offset < PREFILL_WALK_BACK - 1; offset++) {
      history.push(finished(100 - offset, [prescription(SUPINO, 3)], []));
    }
    history.push(finished(1, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 90, 12)]));

    expect(prefillSlot(SUPINO, 0, history, 70)).toEqual({
      weight: 90,
      reps: 12,
      source: "history",
    });
  });

  it("ignores a Session that is still open", () => {
    const history = [
      open(2, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 110, 5)]),
      finished(1, [prescription(SUPINO, 3)], [performed(SUPINO, 0, 90, 12)]),
    ];

    expect(prefillSlot(SUPINO, 0, history, 70)).toEqual({
      weight: 90,
      reps: 12,
      source: "history",
    });
  });

  it("does not borrow another Exercise's Set", () => {
    const history = [finished(1, [prescription(SUPINO, 3)], [performed(AGACHAMENTO, 0, 120, 5)])];

    expect(prefillSlot(SUPINO, 0, history, 70)).toEqual({
      weight: 70,
      reps: null,
      source: "target",
    });
  });

  it("falls back to the Routine's target weight and leaves reps empty", () => {
    expect(prefillSlot(SUPINO, 0, [], 82.5)).toEqual({
      weight: 82.5,
      reps: null,
      source: "target",
    });
  });

  it("leaves both values empty when there is neither history nor a target", () => {
    expect(prefillSlot(SUPINO, 0, [], undefined)).toEqual({
      weight: null,
      reps: null,
      source: "none",
    });
  });

  it("pre-fills reps from what was done, never from the prescribed range", () => {
    const history = [
      finished(1, [prescription(SUPINO, 3, "8-12")], [performed(SUPINO, 0, 100, 11)]),
    ];

    expect(prefillSlot(SUPINO, 0, history, undefined).reps).toBe(11);
  });
});

describe("activeSlot", () => {
  const plan = [prescription(SUPINO, 3), prescription(AGACHAMENTO, 2)];

  it("is the first unconfirmed slot in Plan order", () => {
    const sets = [performed(SUPINO, 0, 100, 8)];

    expect(activeSlot(plan, sets)?.exerciseId).toBe(SUPINO);
    expect(activeSlot(plan, sets)?.index).toBe(1);
  });

  it("advances as the current slot is confirmed", () => {
    const sets = [
      performed(SUPINO, 0, 100, 8),
      performed(SUPINO, 1, 100, 8),
      performed(SUPINO, 2, 100, 8),
    ];

    expect(activeSlot(plan, sets)?.exerciseId).toBe(AGACHAMENTO);
    expect(activeSlot(plan, sets)?.index).toBe(0);
  });

  it("has no active slot once every slot is confirmed", () => {
    const sets = [
      performed(SUPINO, 0, 100, 8),
      performed(SUPINO, 1, 100, 8),
      performed(SUPINO, 2, 100, 8),
      performed(AGACHAMENTO, 0, 120, 5),
      performed(AGACHAMENTO, 1, 120, 5),
    ];

    expect(activeSlot(plan, sets)).toBeNull();
  });

  it("stays on a skipped slot rather than jumping ahead", () => {
    const sets = [performed(SUPINO, 1, 100, 8)];

    expect(activeSlot(plan, sets)?.index).toBe(0);
  });
});
