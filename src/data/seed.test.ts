import { describe, expect, it } from "vitest";
import exerciseSeed from "@/data/exercises.json";
import routineSeed from "@/data/routines.json";
import { MUSCLE_GROUPS } from "@/domain";

/**
 * The build-time invariant from ADR-0003: a Built-in Routine that names a slug
 * the Exercise seed does not have must fail here, not at the rack. The same
 * pass guards the muscle groups, so a typo cannot quietly drop an Exercise out
 * of the picker's fixed order.
 */
describe("seed content", () => {
  const slugs = new Set(exerciseSeed.map((exercise) => exercise.slug));

  it("resolves every Exercise referenced by a Built-in Routine", () => {
    const unresolved = routineSeed.flatMap((routine) =>
      routine.exercises
        .filter((item) => !slugs.has(item.exercise))
        .map((item) => `${routine.slug} → ${item.exercise}`),
    );

    expect(unresolved).toEqual([]);
  });

  it("uses only the nine fixed muscle groups", () => {
    const known = new Set<string>(MUSCLE_GROUPS);
    const unknown = exerciseSeed
      .filter((exercise) => !known.has(exercise.muscleGroup))
      .map((exercise) => `${exercise.slug}: ${exercise.muscleGroup}`);

    expect(unknown).toEqual([]);
  });

  it("gives every Exercise a unique slug", () => {
    expect(slugs.size).toBe(exerciseSeed.length);
  });
});
