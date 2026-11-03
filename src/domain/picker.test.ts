import { describe, expect, it } from "vitest";
import type { Exercise } from "@/domain";
import { groupByMuscle } from "@/domain/picker";

function exercise(name: string, muscleGroup: Exercise["muscleGroup"]): Exercise {
  return { id: name.toLowerCase().replace(/\s+/g, "-"), name, muscleGroup, source: "builtin" };
}

describe("groupByMuscle", () => {
  it("orders groups by the fixed muscle order, whatever the input order", () => {
    const groups = groupByMuscle([
      exercise("Rosca direta", "Bíceps"),
      exercise("Supino reto", "Peito"),
      exercise("Agachamento livre", "Quadríceps"),
    ]);

    expect(groups.map((group) => group.muscleGroup)).toEqual(["Peito", "Quadríceps", "Bíceps"]);
  });

  it("omits a group with no Exercise, so the picker shows no empty header", () => {
    const groups = groupByMuscle([exercise("Rosca direta", "Bíceps")]);
    expect(groups.map((group) => group.muscleGroup)).toEqual(["Bíceps"]);
  });

  it("sorts each group by name in pt-BR, ignoring the seed order", () => {
    const groups = groupByMuscle([
      exercise("Supino reto", "Peito"),
      exercise("Crucifixo", "Peito"),
      exercise("Flexão de braço", "Peito"),
    ]);

    expect(groups[0]?.exercises.map((row) => row.name)).toEqual([
      "Crucifixo",
      "Flexão de braço",
      "Supino reto",
    ]);
  });
});
