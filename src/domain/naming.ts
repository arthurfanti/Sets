import type { Exercise } from "@/domain";

/**
 * Exercise names are matched, never trusted as ids. Case, accents and runs of
 * whitespace are the only differences a Lifter can type by accident, so they
 * are the only differences normalization erases. "Supino" and "supino " are
 * the same Exercise, and the app says so before writing a second row.
 */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\s+/g, " ")
    .trim();
}

/** A stable, readable id for anything the Lifter names. */
export function deriveSlug(name: string): string {
  return normalizeName(name)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** The labels an Exercise answers to: its name plus its searchable aliases. */
function labelsOf(exercise: Exercise): string[] {
  return [normalizeName(exercise.name), ...(exercise.aliases ?? []).map(normalizeName)];
}

function isWordOccurrence(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false;
  for (let at = haystack.indexOf(needle); at !== -1; at = haystack.indexOf(needle, at + 1)) {
    const before = haystack[at - 1];
    const after = haystack[at + needle.length];
    if ((before === undefined || before === " ") && (after === undefined || after === " ")) {
      return true;
    }
  }
  return false;
}

function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = (previous[j - 1] ?? 0) + (a[i - 1] === b[j - 1] ? 0 : 1);
      current[j] = Math.min((previous[j] ?? 0) + 1, (current[j - 1] ?? 0) + 1, substitution);
    }
    previous = current;
  }
  return previous[b.length] ?? 0;
}

/** The picker's search: name or alias, accent and case blind. */
export function matchesQuery(exercise: Exercise, query: string): boolean {
  const needle = normalizeName(query);
  if (needle.length === 0) return true;
  return labelsOf(exercise).some((label) => label.includes(needle));
}

export type NameConflict =
  /** The same name already exists: creating it is refused, the row is offered. */
  | { kind: "exact"; exercise: Exercise }
  /** Something close exists: the Lifter is warned but not stopped. */
  | { kind: "near"; exercise: Exercise };

/**
 * What stands between a typed name and a new Exercise. Exact beats near, and
 * among near matches the closest label wins, so the warning names the row the
 * Lifter most likely meant.
 */
export function findNameConflict(
  exercises: readonly Exercise[],
  name: string,
  options: { exceptId?: string } = {},
): NameConflict | undefined {
  const typed = normalizeName(name);
  if (typed.length === 0) return undefined;

  const candidates = exercises.filter((exercise) => exercise.id !== options.exceptId);

  for (const exercise of candidates) {
    if (labelsOf(exercise).includes(typed)) return { kind: "exact", exercise };
  }

  let near: { exercise: Exercise; distance: number } | undefined;
  for (const exercise of candidates) {
    for (const label of labelsOf(exercise)) {
      const distance = editDistance(label, typed);
      const related =
        distance <= 2 || isWordOccurrence(typed, label) || isWordOccurrence(label, typed);
      if (!related) continue;
      if (!near || distance < near.distance) near = { exercise, distance };
    }
  }

  return near ? { kind: "near", exercise: near.exercise } : undefined;
}
