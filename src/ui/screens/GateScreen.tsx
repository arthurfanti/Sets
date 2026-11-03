import { useState } from "react";
import type { OpenFailureCause } from "@/db/open-failure";
import { resetDatabase } from "@/db/reset";
import { confirmsDeletion } from "@/ui/confirmation";
import {
  GATE_TITLE,
  gateCopy,
  RESET_CONSEQUENCE,
  RESET_HINT,
  RESET_LABEL,
} from "./GateScreen.copy";
import styles from "./GateScreen.module.css";

interface GateScreenProps {
  cause: OpenFailureCause;
  onRetry: () => void;
}

/**
 * The only screen before the app: shown when `indexedDB.open` refuses, never
 * dismissable, and never a dead end. Retry is always there; the destructive
 * reset is the escape hatch for a database the app cannot read.
 */
export function GateScreen({ cause, onRetry }: GateScreenProps) {
  const copy = gateCopy(cause);
  const [confirming, setConfirming] = useState(false);

  return (
    <main className={styles.screen}>
      <div className={styles.block}>
        <h1 className={styles.title}>{GATE_TITLE}</h1>
        <p className={styles.body}>{copy.body}</p>
        {copy.hint ? <p className={styles.hint}>{copy.hint}</p> : null}

        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={onRetry}>
            Tentar de novo
          </button>
          {copy.canReset ? (
            <button className={styles.danger} type="button" onClick={() => setConfirming(true)}>
              {RESET_LABEL}
            </button>
          ) : null}
        </div>
      </div>

      {confirming ? <ResetDialog onCancel={() => setConfirming(false)} /> : null}
    </main>
  );
}

interface ResetDialogProps {
  onCancel: () => void;
}

function ResetDialog({ onCancel }: ResetDialogProps) {
  const [typed, setTyped] = useState("");
  const [resetting, setResetting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function reset() {
    setResetting(true);
    setFailed(false);
    try {
      await resetDatabase();
      // Deleting the database makes the next open a first run, which seeds the
      // library again. This reload is that next open.
      window.location.reload();
    } catch {
      setResetting(false);
      setFailed(true);
    }
  }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reset-titulo"
        aria-describedby="reset-descricao"
      >
        <h2 id="reset-titulo" className={styles.dialogTitle}>
          Apagar dados?
        </h2>
        <p id="reset-descricao" className={styles.dialogBody}>
          {RESET_CONSEQUENCE}
        </p>

        <label className={styles.field} htmlFor="reset-confirmacao">
          {RESET_HINT}
        </label>
        <input
          id="reset-confirmacao"
          className={styles.input}
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={resetting}
        />

        {failed ? <p className={styles.error}>Não foi possível apagar.</p> : null}

        <div className={styles.actions}>
          <button
            className={styles.danger}
            type="button"
            onClick={() => void reset()}
            disabled={!confirmsDeletion(typed) || resetting}
          >
            {resetting ? "Apagando…" : RESET_LABEL}
          </button>
          <button
            className={styles.secondary}
            type="button"
            onClick={onCancel}
            disabled={resetting}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
