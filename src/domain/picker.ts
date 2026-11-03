import { type Exercise, MUSCLE_GROUPS, type MuscleGroup } from "@/domain";

export interface ExerciseGroup {
  muscleGroup: MuscleGroup;
  exercises: Exercise[];
}

/**
 * The picker's shape: one section per muscle, in the fixed order the Lifter
 * learned, each section alphabetical. Empty groups are dropped rather than
 * rendered as a dead header.
 */
export function groupByMuscle(exercises: readonly Exercise[]): ExerciseGroup[] {
  return MUSCLE_GROUPS.map((muscleGroup) => ({
    muscleGroup,
    exercises: exercises
      .filter((exercise) => exercise.muscleGroup === muscleGroup)
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  })).filter((group) => group.exercises.length > 0);
}
