import type { PerformedSet, Session } from "@/domain";
import { sessionDuration } from "@/domain/session";

/**
 * How a finished Session reads in history. Times are stored as epoch
 * milliseconds and only ever bucketed here, in the device's own zone: the
 * Lifter trained on their local day, and a Session after midnight belongs to
 * the new month even when UTC still says the old one.
 */

/** pt-BR month names, hardcoded so the grouping never depends on ICU data. */
const MONTHS = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

const SHORT_MONTHS = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export interface MonthGroup {
  /** `YYYY-MM` in the device's local zone. */
  key: string;
  /** Uppercase month, with the year when it is not the current one. */
  label: string;
  sessions: Session[];
}

/** One Exercise's Sets inside an expanded Session. */
export interface SetBlock {
  exerciseId: string;
  sets: PerformedSet[];
}

/** Shown when a Set's Exercise is no longer on the device at all. */
export const UNKNOWN_EXERCISE_NAME = "Exercício";
/** The Session started from no Routine, by design. */
export const FREE_SESSION_NAME = "Sessão livre";
/** The Routine a Session was started from has since been deleted. */
export const REMOVED_ROUTINE_NAME = "Rotina removida";

function monthOf(timestamp: number): { year: number; month: number } {
  const date = new Date(timestamp);
  return { year: date.getFullYear(), month: date.getMonth() };
}

function twoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/** The month header: "NOVEMBRO", or "NOVEMBRO 2025" once the year differs. */
export function monthLabel(timestamp: number, now: number): string {
  const { year, month } = monthOf(timestamp);
  const name = (MONTHS[month] ?? "").toLocaleUpperCase("pt-BR");
  return year === monthOf(now).year ? name : `${name} ${year}`;
}

/**
 * The history list: finished Sessions newest first, split under one header per
 * local month, months also newest first. A Session never moves between groups
 * because `startedAt` is immutable.
 */
export function groupSessionsByMonth(sessions: readonly Session[], now: number): MonthGroup[] {
  const ordered = [...sessions].sort((a, b) => b.startedAt - a.startedAt);
  const groups: MonthGroup[] = [];

  for (const session of ordered) {
    const { year, month } = monthOf(session.startedAt);
    const key = `${year}-${twoDigits(month + 1)}`;
    const last = groups.at(-1);
    if (last?.key === key) {
      last.sessions.push(session);
      continue;
    }
    groups.push({ key, label: monthLabel(session.startedAt, now), sessions: [session] });
  }

  return groups;
}

/** The row's date: "14 nov". Day first, because that is how the month reads. */
export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${twoDigits(date.getDate())} ${SHORT_MONTHS[date.getMonth()] ?? ""}`;
}

/** Training time: "45 min", or "1 h 05" once it passes the hour. */
export function formatDuration(durationMs: number): string {
  const minutes = Math.max(0, Math.round(durationMs / 60_000));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${twoDigits(minutes % 60)}`;
}

/** "18 séries", "1 série" — the count the Lifter actually logged. */
export function formatSetCount(count: number): string {
  return `${count} ${count === 1 ? "série" : "séries"}`;
}

/** The muted line under a Session's name. */
export function describeSession(session: Session): string {
  return [
    formatDate(session.startedAt),
    formatDuration(sessionDuration(session)),
    formatSetCount(session.sets.length),
  ].join(" · ");
}

/**
 * The expanded Session, one block per Exercise in Plan order, then anything
 * logged outside the Plan. Exercises with no recorded Set are left out: the
 * panel is a record of what was done, not of what was prescribed.
 */
export function sessionBlocks(session: Session): SetBlock[] {
  const ordered: string[] = [];
  const add = (exerciseId: string) => {
    if (!ordered.includes(exerciseId)) ordered.push(exerciseId);
  };
  for (const row of session.plan) add(row.exerciseId);
  for (const set of session.sets) add(set.exerciseId);

  return ordered
    .map((exerciseId) => ({
      exerciseId,
      sets: session.sets
        .filter((set) => set.exerciseId === exerciseId)
        .sort((a, b) => a.index - b.index),
    }))
    .filter((block) => block.sets.length > 0);
}

/** The Session's headline: the Routine's name, or the free Session's. */
export function sessionTitle(
  routineId: string | null,
  routineNames: ReadonlyMap<string, string>,
): string {
  if (routineId === null) return FREE_SESSION_NAME;
  return routineNames.get(routineId) ?? REMOVED_ROUTINE_NAME;
}

/**
 * A Set names its Exercise by id, and a hidden or renamed Exercise still owns
 * that id. Resolving here — never from the picker's filtered list — is what
 * keeps an expanded Session readable after the Exercise leaves the picker.
 */
export function resolveExerciseName(
  exerciseNames: ReadonlyMap<string, string>,
  exerciseId: string,
): string {
  return exerciseNames.get(exerciseId) ?? UNKNOWN_EXERCISE_NAME;
}
