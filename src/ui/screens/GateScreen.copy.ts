import type { OpenFailureCause } from "@/db/open-failure";

export interface GateCopy {
  /** The cause in the Lifter's words. */
  body: string;
  /** A second line only where it names something the app cannot fix. */
  hint?: string;
}

/**
 * One line per cause the app can actually tell apart, and never a claim it
 * cannot back. A version mismatch, a corrupt database and everything the app
 * has no name for share the unknown row.
 *
 * The reset is offered on every row, not only the unknown one: a generic error
 * is easy to misread as quota, and retry-only would then be a door that cannot
 * be opened. The typed word, not the cause, is what guards the history.
 */
export function gateCopy(cause: OpenFailureCause): GateCopy {
  switch (cause) {
    case "blocked":
      return {
        body: "Feche as outras abas do Sets e tente de novo.",
        hint: "Em janela privada, o Sets não consegue guardar dados: saia dela e tente de novo.",
      };
    case "quota":
      return {
        body: "Sem espaço no aparelho. Libere espaço e tente de novo.",
      };
    case "unknown":
      return {
        body: "Não foi possível abrir o histórico.",
        hint: "Em janela privada, o Sets não consegue guardar dados: saia dela e tente de novo.",
      };
  }
}

export const GATE_TITLE = "Não foi possível abrir o Sets.";

export const RESET_LABEL = "Apagar dados e começar de novo";

export const RESET_HINT = "Digite apagar para confirmar.";

export const RESET_CONSEQUENCE = "Todo o histórico será apagado. Não há como desfazer.";
