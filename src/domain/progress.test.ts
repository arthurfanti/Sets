import { describe, expect, it } from "vitest";
import type { PerformedSet, Session } from "@/domain";
import {
  bestSet,
  estimatedOneRepMax,
  heaviestWeight,
  ONE_REP_MAX_REP_WINDOW,
  oneRepMaxSeries,
  totalVolume,
  weeklyVolume,
  weekStart,
} from "@/domain/progress";

/** Local time, because weeks are bucketed in the device's own zone. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function monday(year: number, month: number, day: number): number {
  return local(year, month, day, 0, 0);
}

function set(weight: number, reps: number, confirmedAt: number): PerformedSet {
  return { exerciseId: "supino-reto", index: 0, weight, reps, confirmedAt };
}

function session(startedAt: number, sets: PerformedSet[]): Session {
  return {
    id: `ses_${startedAt}`,
    routineId: null,
    startedAt,
    endedAt: startedAt + 3_600_000,
    plan: [],
    sets,
  };
}

describe("estimatedOneRepMax", () => {
  it("returns the weight itself at one rep, because a true single is the 1RM", () => {
    expect(estimatedOneRepMax(100, 1)).toBe(100);
    expect(estimatedOneRepMax(92.5, 1)).toBe(92.5);
  });

  it("applies Epley at the ten-rep edge of the window", () => {
    // 80 kg × (1 + 10/30)
    expect(estimatedOneRepMax(80, 10)).toBeCloseTo(106.67, 1);
  });

  it("returns nothing outside the 1–10 rep window", () => {
    expect(estimatedOneRepMax(100, 0)).toBeNull();
    expect(estimatedOneRepMax(100, 11)).toBeNull();
    expect(estimatedOneRepMax(100, 12)).toBeNull();
  });

  it("names the window it enforces", () => {
    expect(ONE_REP_MAX_REP_WINDOW).toEqual({ min: 1, max: 10 });
  });
});

describe("bestSet", () => {
  it("chooses the Set with the highest estimate across Sessions", () => {
    const hardFive = set(100, 5, local(2026, 10, 20));
    const lightTen = set(90, 10, local(2026, 10, 27));

    // 100 × 5 → 116.7 kg; 90 × 10 → 120 kg.
    expect(bestSet([hardFive, lightTen])).toEqual(lightTen);
  });

  it("never headlines a Set outside the window, even when it is the heaviest", () => {
    const eight = set(100, 8, local(2026, 10, 20));
    const eleven = set(250, 11, local(2026, 10, 27));

    expect(bestSet([eight, eleven])).toEqual(eight);
  });

  it("yields no Best Set at all when every Set is out of range, never a clamped one", () => {
    expect(bestSet([set(200, 11, local(2026, 10, 27))])).toBeNull();
  });

  it("has no Best Set without Sets", () => {
    expect(bestSet([])).toBeNull();
  });
});

describe("volume", () => {
  it("is Σ weight × reps, counting Sets outside the rep window", () => {
    expect(totalVolume([set(100, 5, 0), set(80, 11, 0)])).toBe(1380);
  });

  it("reports the heaviest weight as a secondary stat", () => {
    expect(heaviestWeight([set(100, 5, 0), set(120, 1, 0)])).toBe(120);
    expect(heaviestWeight([])).toBeNull();
  });
});

describe("weekStart", () => {
  it("is Monday at local midnight", () => {
    const wednesday = local(2026, 11, 4, 15, 30);

    expect(weekStart(wednesday)).toBe(monday(2026, 11, 2));
  });
});

describe("weeklyVolume", () => {
  const now = local(2026, 11, 4, 12);

  it("keeps a Sunday-night Set in the week that has just ended", () => {
    const sundayNight = local(2026, 11, 1, 23, 30);
    const buckets = weeklyVolume(
      [session(sundayNight, [set(100, 5, sundayNight)])],
      "supino-reto",
      {
        now,
        weeks: 12,
      },
    );

    const filled = buckets.filter((bucket) => bucket.volume > 0);

    expect(filled).toHaveLength(1);
    // Sunday 1 Nov belongs to the week that started Monday 26 Oct.
    expect(filled[0]?.start).toBe(monday(2026, 10, 26));
    expect(filled[0]?.volume).toBe(500);
  });

  it("sums every Set in the week, including ones outside the rep window", () => {
    const monday = local(2026, 11, 2, 19);
    const wednesday = local(2026, 11, 4, 7);
    const buckets = weeklyVolume(
      [
        session(monday, [set(100, 5, monday), set(80, 11, monday + 60_000)]),
        session(wednesday, [set(90, 8, wednesday)]),
      ],
      "supino-reto",
      { now, weeks: 12 },
    );

    const filled = buckets.filter((bucket) => bucket.volume > 0);

    expect(filled).toHaveLength(1);
    expect(filled[0]?.volume).toBe(1380 + 720);
  });

  it("starts the 12-week window on a Monday and ends in the current week", () => {
    const buckets = weeklyVolume([], "supino-reto", { now, weeks: 12 });

    expect(buckets).toHaveLength(12);
    // 11 weeks before Monday 2 Nov.
    expect(buckets[0]?.start).toBe(monday(2026, 8, 17));
    expect(buckets.at(-1)?.start).toBe(monday(2026, 11, 2));
  });

  it("excludes a Set from the week before the window and includes one on its first Monday", () => {
    const beforeWindow = local(2026, 8, 16, 23, 55);
    const firstMonday = local(2026, 8, 17, 0, 5);
    const sessions = [
      session(beforeWindow, [set(100, 5, beforeWindow)]),
      session(firstMonday, [set(60, 5, firstMonday)]),
    ];

    const windowed = weeklyVolume(sessions, "supino-reto", { now, weeks: 12 });
    const allTime = weeklyVolume(sessions, "supino-reto", { now, weeks: "all" });

    expect(windowed.filter((bucket) => bucket.volume > 0).map((bucket) => bucket.start)).toEqual([
      monday(2026, 8, 17),
    ]);
    expect(allTime.filter((bucket) => bucket.volume > 0).map((bucket) => bucket.start)).toEqual([
      monday(2026, 8, 10),
      monday(2026, 8, 17),
    ]);
  });

  it("leaves empty weeks in place so the line cannot imply work that did not happen", () => {
    const buckets = weeklyVolume([], "supino-reto", { now, weeks: 12 });

    expect(buckets.every((bucket) => bucket.volume === 0)).toBe(true);
  });
});

describe("oneRepMaxSeries", () => {
  it("renders one point per Session, using that Session's best eligible Set", () => {
    const first = local(2026, 10, 20);
    const second = local(2026, 10, 27);
    const sessions = [
      session(second, [set(90, 10, second)]),
      session(first, [set(100, 5, first), set(100, 6, first + 60_000)]),
    ];

    const points = oneRepMaxSeries(sessions, "supino-reto", { now: local(2026, 11, 4), weeks: 12 });

    expect(points).toHaveLength(2);
    expect(points[0]?.value).toBeCloseTo(120, 5);
    expect(points[1]?.value).toBeCloseTo(120, 5);
    expect(points.map((point) => point.at)).toEqual([first + 60_000, second]);
  });

  it("skips a Session whose Sets all fall outside the rep window", () => {
    const day = local(2026, 10, 27);
    const points = oneRepMaxSeries([session(day, [set(250, 11, day)])], "supino-reto", {
      now: local(2026, 11, 4),
      weeks: "all",
    });

    expect(points).toEqual([]);
  });
});
