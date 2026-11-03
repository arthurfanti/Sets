import type { StorageSummary } from "@/db/storage";

/** The one sentence the About view must never soften. */
export const NO_BACKUP_SENTENCE =
  "Não há backup: se você apagar o Sets da tela de início, o histórico vai junto.";

/** The typed word that enables the only irreversible action. */
export const DELETE_WORD = "apagar";

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

/** "12 ago" — the app's own date, never a timezone-shifted ISO string. */
export function formatShortDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}`;
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/** Counts, never bytes: "38 sessões · 55 exercícios · desde 12 ago". */
export function describeCounts(summary: StorageSummary): string {
  const parts = [
    summary.sessions === 0 ? "Nenhuma sessão" : plural(summary.sessions, "sessão", "sessões"),
    plural(summary.exercises, "exercício", "exercícios"),
  ];
  if (summary.sessions > 0 && summary.earliestStartedAt !== undefined) {
    parts.push(`desde ${formatShortDate(summary.earliestStartedAt)}`);
  }
  return parts.join(" · ");
}

/** Names exactly what delete-all destroys, and says it cannot be undone. */
export function describeDeletion(summary: StorageSummary): string {
  const undo = "Não há como desfazer.";
  if (summary.sessions === 0) return `Nenhuma sessão será apagada. ${undo}`;

  const when =
    summary.earliestStartedAt === undefined
      ? ""
      : `, desde ${formatShortDate(summary.earliestStartedAt)},`;
  const verb = summary.sessions === 1 ? "será apagada" : "serão apagadas";
  return `${plural(summary.sessions, "sessão", "sessões")}${when} ${verb}. ${undo}`;
}

export function storageLabel(persisted: boolean): string {
  return `Armazenamento: ${persisted ? "Protegido" : "Não protegido"}`;
}

/** Case and stray spaces are forgiven; the word itself is not. */
export function confirmsDeletion(typed: string): boolean {
  return typed.trim().toLowerCase() === DELETE_WORD;
}
