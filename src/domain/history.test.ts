import { describe, expect, it } from "vitest";
import type { Session } from "@/domain";
import {
  describeSession,
  formatDate,
  formatDuration,
  formatSetCount,
  groupSessionsByMonth,
  resolveExerciseName,
  sessionBlocks,
  sessionTitle,
} from "@/domain/history";

/** Local time, because history buckets by the device's own month. */
function local(year: number, month: number, day: number, hour = 12, minute = 0): number {
  return new Date(year, month - 1, day, hour, minute).getTime();
}

function session(startedAt: number, endedAt: number, sets = 0): Session {
  return {
    id: `ses_${startedAt}`,
    routineId: null,
    startedAt,
    endedAt,
    plan: [],
    sets: Array.from({ length: sets }, (_, index) => ({
      exerciseId: "supino-reto",
      index,
      weight: 100,
      reps: 5,
      confirmedAt: startedAt + 1_000,
    })),
  };
}

describe("groupSessionsByMonth", () => {
  const now = local(2026, 11, 3);

  it("returns nothing for no Sessions", () => {
    expect(groupSessionsByMonth([], now)).toEqual([]);
  });

  it("groups by the device's local month and keeps the newest month first", () => {
    const november = session(local(2026, 11, 14), local(2026, 11, 14, 13));
    const october = session(local(2026, 10, 28), local(2026, 10, 28, 13));

    const groups = groupSessionsByMonth([october, november], now);

    expect(groups.map((group) => group.label)).toEqual(["NOVEMBRO", "OUTUBRO"]);
    expect(groups[0]?.sessions).toEqual([november]);
    expect(groups[1]?.sessions).toEqual([october]);
  });

  it("orders the Sessions inside a month newest first", () => {
    const early = session(local(2026, 11, 5), local(2026, 11, 5, 13));
    const late = session(local(2026, 11, 14), local(2026, 11, 14, 13));

    const [group] = groupSessionsByMonth([early, late], now);

    expect(group?.sessions).toEqual([late, early]);
    expect(group?.key).toBe("2026-11");
  });

  it("buckets by the local day, so a Session after midnight belongs to the new month", () => {
    const afterMidnight = session(local(2026, 11, 1, 0, 30), local(2026, 11, 1, 1, 15));
    const beforeMidnight = session(local(2026, 10, 31, 23, 30), local(2026, 10, 31, 23, 59));

    const groups = groupSessionsByMonth([beforeMidnight, afterMidnight], now);

    expect(groups.map((group) => group.label)).toEqual(["NOVEMBRO", "OUTUBRO"]);
  });

  it("keeps two years' worth of the same month apart", () => {
    const thisYear = session(local(2026, 11, 14), local(2026, 11, 14, 13));
    const lastYear = session(local(2025, 11, 14), local(2025, 11, 14, 13));

    const groups = groupSessionsByMonth([lastYear, thisYear], now);

    expect(groups.map((group) => [group.key, group.label])).toEqual([
      ["2026-11", "NOVEMBRO"],
      ["2025-11", "NOVEMBRO 2025"],
    ]);
  });

  it("does not reorder the list it was given", () => {
    const sessions = [
      session(local(2026, 10, 2), local(2026, 10, 2, 13)),
      session(local(2026, 11, 2), local(2026, 11, 2, 13)),
    ];
    const before = [...sessions];

    groupSessionsByMonth(sessions, now);

    expect(sessions).toEqual(before);
  });
});

describe("formatDate", () => {
  it("uses a two-digit local day and the pt-BR short month", () => {
    expect(formatDate(local(2026, 11, 14))).toBe("14 nov");
    expect(formatDate(local(2026, 11, 9))).toBe("09 nov");
    expect(formatDate(local(2026, 3, 1))).toBe("01 mar");
  });
});

describe("formatDuration", () => {
  it("reads in whole minutes below an hour", () => {
    expect(formatDuration(45 * 60_000)).toBe("45 min");
    expect(formatDuration(58 * 60_000 + 20_000)).toBe("58 min");
  });

  it("reads hours and padded minutes above an hour", () => {
    expect(formatDuration(65 * 60_000)).toBe("1 h 05");
    expect(formatDuration(2 * 60 * 60_000)).toBe("2 h 00");
  });

  it("records an empty Session as zero and never a negative duration", () => {
    expect(formatDuration(0)).toBe("0 min");
    expect(formatDuration(-5_000)).toBe("0 min");
  });
});

describe("formatSetCount", () => {
  it("agrees in number with the count", () => {
    expect(formatSetCount(0)).toBe("0 séries");
    expect(formatSetCount(1)).toBe("1 série");
    expect(formatSetCount(18)).toBe("18 séries");
  });
});

describe("describeSession", () => {
  it("joins date, duration and Set count with the design's separator", () => {
    const finished = session(local(2026, 11, 14), local(2026, 11, 14, 12, 58), 18);

    expect(describeSession(finished)).toBe("14 nov · 58 min · 18 séries");
  });
});

describe("sessionBlocks", () => {
  function logged(exerciseId: string, index: number) {
    return { exerciseId, index, weight: 100, reps: 8, confirmedAt: 1_000 };
  }

  it("keeps Plan order, then whatever was logged outside the Plan", () => {
    const session: Session = {
      id: "ses_1",
      routineId: "rotina-a",
      startedAt: 1_000,
      endedAt: 2_000,
      plan: [
        { exerciseId: "supino-reto", sets: 2, reps: 8 },
        { exerciseId: "remada-curvada", sets: 2, reps: 10 },
      ],
      sets: [logged("agachamento", 0), logged("remada-curvada", 0), logged("supino-reto", 0)],
    };

    expect(sessionBlocks(session).map((block) => block.exerciseId)).toEqual([
      "supino-reto",
      "remada-curvada",
      "agachamento",
    ]);
  });

  it("orders each Exercise's Sets by their slot", () => {
    const session: Session = {
      id: "ses_1",
      routineId: null,
      startedAt: 1_000,
      endedAt: 2_000,
      plan: [{ exerciseId: "supino-reto", sets: 2, reps: 8 }],
      sets: [logged("supino-reto", 1), logged("supino-reto", 0)],
    };

    const [block] = sessionBlocks(session);
    expect(block?.sets.map((set) => set.index)).toEqual([0, 1]);
  });

  it("leaves out an Exercise that was prescribed but never logged", () => {
    const session: Session = {
      id: "ses_1",
      routineId: null,
      startedAt: 1_000,
      endedAt: 2_000,
      plan: [
        { exerciseId: "supino-reto", sets: 2, reps: 8 },
        { exerciseId: "agachamento", sets: 3, reps: 5 },
      ],
      sets: [logged("agachamento", 0)],
    };

    expect(sessionBlocks(session).map((block) => block.exerciseId)).toEqual(["agachamento"]);
  });

  it("has nothing to show for an empty finished Session", () => {
    expect(sessionBlocks(session(1_000, 1_000))).toEqual([]);
  });
});

describe("sessionTitle", () => {
  const routines = new Map([["rotina-a", "Rotina A — Peito e tríceps"]]);

  it("names the Routine the Session was started from", () => {
    expect(sessionTitle("rotina-a", routines)).toBe("Rotina A — Peito e tríceps");
  });

  it("calls a Session started from no Routine a free Session", () => {
    expect(sessionTitle(null, routines)).toBe("Sessão livre");
  });

  it("says the Routine was removed rather than naming it blank", () => {
    expect(sessionTitle("rotina-apagada", routines)).toBe("Rotina removida");
  });
});

describe("resolveExerciseName", () => {
  const exercises = new Map([["usr_1", "Rosca Scott unilateral"]]);

  it("renders the name a hidden Exercise still owns", () => {
    expect(resolveExerciseName(exercises, "usr_1")).toBe("Rosca Scott unilateral");
  });

  it("never renders a blank when the Exercise is gone entirely", () => {
    expect(resolveExerciseName(exercises, "usr_ausente")).toBe("Exercício");
  });
});
