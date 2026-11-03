import { useEffect, useState } from "react";
import {
  deleteEverything,
  isStoragePersisted,
  readStorageSummary,
  type StorageSummary,
} from "@/db/repositories";
import { confirmsDeletion } from "@/ui/confirmation";
import { Placeholder } from "@/ui/Placeholder";
import packageJson from "../../../package.json";
import {
  describeCounts,
  describeDeletion,
  NO_BACKUP_SENTENCE,
  storageLabel,
} from "./AboutScreen.copy";
import styles from "./AboutScreen.module.css";

/**
 * Web Storage's persistence state, the counts it protects, and the one
 * irreversible action. Reached from the muted "Sobre" link on Home.
 */
export function AboutScreen() {
  const [summary, setSummary] = useState<StorageSummary | null>(null);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([readStorageSummary(), isStoragePersisted()])
      .then(([nextSummary, nextPersisted]) => {
        if (cancelled) return;
        setSummary(nextSummary);
        setPersisted(nextPersisted);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Placeholder title="Sobre">
      <section className={styles.identity}>
        <p className={styles.appName}>Sets</p>
        <p className={styles.version}>versão {packageJson.version}</p>
      </section>

      {failed ? <p className={styles.muted}>Não foi possível ler o armazenamento.</p> : null}

      {persisted !== null ? <p className={styles.state}>{storageLabel(persisted)}</p> : null}

      {summary ? <p className={styles.counts}>{describeCounts(summary)}</p> : null}

      <p className={styles.warning}>{NO_BACKUP_SENTENCE}</p>

      <button
        type="button"
        className={styles.danger}
        onClick={() => setConfirming(true)}
        disabled={summary === null}
      >
        Apagar tudo
      </button>

      {confirming && summary ? (
        <DeleteDialog summary={summary} onCancel={() => setConfirming(false)} />
      ) : null}
    </Placeholder>
  );
}

interface DeleteDialogProps {
  summary: StorageSummary;
  onCancel: () => void;
}

function DeleteDialog({ summary, onCancel }: DeleteDialogProps) {
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [failed, setFailed] = useState(false);

  async function confirm() {
    setDeleting(true);
    setFailed(false);
    try {
      await deleteEverything();
      // Clearing `meta` makes the next open a first run, which seeds the
      // library again. This reload is that next open.
      window.location.reload();
    } catch {
      setDeleting(false);
      setFailed(true);
    }
  }

  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apagar-titulo"
        aria-describedby="apagar-descricao"
      >
        <h2 id="apagar-titulo" className={styles.dialogTitle}>
          Apagar tudo?
        </h2>
        <p id="apagar-descricao" className={styles.dialogBody}>
          {describeDeletion(summary)}
        </p>

        <label className={styles.field} htmlFor="apagar-confirmacao">
          Digite <strong>apagar</strong> para confirmar.
        </label>
        <input
          id="apagar-confirmacao"
          className={styles.input}
          type="text"
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={deleting}
        />

        {failed ? <p className={styles.error}>Não foi possível apagar.</p> : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.confirm}
            onClick={() => void confirm()}
            disabled={!confirmsDeletion(typed) || deleting}
          >
            {deleting ? "Apagando…" : "Apagar tudo"}
          </button>
          <button type="button" className={styles.cancel} onClick={onCancel} disabled={deleting}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
