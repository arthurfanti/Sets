import { describe, expect, it } from "vitest";
import type { Exercise } from "@/domain";
import { deriveSlug, findNameConflict, matchesQuery, normalizeName } from "@/domain/naming";

const supino: Exercise = {
  id: "supino-reto",
  name: "Supino reto",
  muscleGroup: "Peito",
  aliases: ["supino"],
  source: "builtin",
};

const peckDeck: Exercise = {
  id: "peck-deck",
  name: "Peck deck",
  muscleGroup: "Peito",
  aliases: ["voador"],
  source: "builtin",
};

const rosca: Exercise = {
  id: "rosca-direta",
  name: "Rosca direta",
  muscleGroup: "Bíceps",
  source: "builtin",
};

const custom: Exercise = {
  id: "usr_1",
  name: "Rosca no banco",
  muscleGroup: "Bíceps",
  source: "user",
};

describe("normalizeName", () => {
  it("folds case, accents and runs of whitespace", () => {
    expect(normalizeName("  Flexão   DE braço ")).toBe("flexao de braco");
  });
});

describe("deriveSlug", () => {
  it("turns a name into an ascii kebab slug", () => {
    expect(deriveSlug("Elevação Lateral 45°")).toBe("elevacao-lateral-45");
  });
});

describe("matchesQuery", () => {
  it("matches the name without demanding accents", () => {
    expect(matchesQuery(supino, "supIno r")).toBe(true);
    expect(matchesQuery(rosca, "flexao")).toBe(false);
  });

  it("matches a seeded alias, which is searchable but never displayed", () => {
    expect(matchesQuery(peckDeck, "voador")).toBe(true);
  });

  it("matches everything while the query is empty", () => {
    expect(matchesQuery(rosca, "   ")).toBe(true);
  });
});

describe("findNameConflict", () => {
  it("blocks a name that normalizes to an existing name", () => {
    expect(findNameConflict([supino, rosca], "SUPINO  reto")).toEqual({
      kind: "exact",
      exercise: supino,
    });
  });

  it("blocks a name that normalizes to an existing alias", () => {
    expect(findNameConflict([supino, rosca], "supino")?.exercise).toBe(supino);
  });

  it("only warns for a near match", () => {
    expect(findNameConflict([supino, rosca], "Supino inclinado")).toEqual({
      kind: "near",
      exercise: supino,
    });
  });

  it("warns for a typo one edit away", () => {
    expect(findNameConflict([supino, rosca], "Rosca direto")).toEqual({
      kind: "near",
      exercise: rosca,
    });
  });

  it("ignores the Exercise being renamed", () => {
    expect(findNameConflict([custom, rosca], "Rosca no banco", { exceptId: "usr_1" })).toBe(
      undefined,
    );
  });

  it("finds nothing for an unrelated name", () => {
    expect(findNameConflict([supino, rosca], "Cadeira extensora")).toBe(undefined);
  });
});
