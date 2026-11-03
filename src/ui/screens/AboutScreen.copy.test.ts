import { describe, expect, it } from "vitest";
import {
  confirmsDeletion,
  describeCounts,
  describeDeletion,
  NO_BACKUP_SENTENCE,
  storageLabel,
} from "@/ui/screens/AboutScreen.copy";

/** Local noon so the day cannot drift across a timezone. */
const august12 = new Date(2026, 7, 12, 12).getTime();
const september3 = new Date(2026, 8, 3, 12).getTime();

describe("About copy", () => {
  it("shows counts and the earliest Session date, never bytes", () => {
    expect(describeCounts({ sessions: 38, exercises: 55, earliestStartedAt: august12 })).toBe(
      "38 sessões · 55 exercícios · desde 12 ago",
    );
  });

  it("uses singular nouns for a single Session and Exercise", () => {
    expect(describeCounts({ sessions: 1, exercises: 1, earliestStartedAt: september3 })).toBe(
      "1 sessão · 1 exercício · desde 3 set",
    );
  });

  it("says plainly that nothing has been trained yet", () => {
    expect(describeCounts({ sessions: 0, exercises: 55, earliestStartedAt: undefined })).toBe(
      "Nenhuma sessão · 55 exercícios",
    );
  });

  it("names the Session count and date range delete-all destroys", () => {
    expect(describeDeletion({ sessions: 38, exercises: 55, earliestStartedAt: august12 })).toBe(
      "38 sessões, desde 12 ago, serão apagadas. Não há como desfazer.",
    );
  });

  it("keeps the one Session case grammatical", () => {
    expect(describeDeletion({ sessions: 1, exercises: 55, earliestStartedAt: august12 })).toBe(
      "1 sessão, desde 12 ago, será apagada. Não há como desfazer.",
    );
  });

  it("does not pretend Sessions exist when there are none", () => {
    expect(describeDeletion({ sessions: 0, exercises: 55, earliestStartedAt: undefined })).toBe(
      "Nenhuma sessão será apagada. Não há como desfazer.",
    );
  });

  it("states the no-backup risk, including the home-screen icon", () => {
    expect(NO_BACKUP_SENTENCE).toBe(
      "Não há backup: se você apagar o Sets da tela de início, o histórico vai junto.",
    );
  });

  it("labels the persistence state in plain words", () => {
    expect(storageLabel(true)).toBe("Armazenamento: Protegido");
    expect(storageLabel(false)).toBe("Armazenamento: Não protegido");
  });

  it("enables delete only for the typed word, ignoring case and stray spaces", () => {
    expect(confirmsDeletion("apagar")).toBe(true);
    expect(confirmsDeletion(" Apagar ")).toBe(true);
    expect(confirmsDeletion("apaga")).toBe(false);
    expect(confirmsDeletion("apagar tudo")).toBe(false);
    expect(confirmsDeletion("")).toBe(false);
  });
});
