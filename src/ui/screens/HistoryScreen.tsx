import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listExercises, listRoutines } from "@/db/repositories";
import { deleteFinishedSession, listFinishedSessions, updateSet } from "@/db/sessions";
import type { PerformedSet, Session } from "@/domain";
import {
  describeSession,
  formatDate,
  groupSessionsByMonth,
  resolveExerciseName,
  sessionBlocks,
  sessionTitle,
} from "@/domain/history";
import { parseReps, parseWeight } from "@/ui/components/SetRow";
import styles from "./HistoryScreen.module.css";

/**
 * History: what the Lifter actually did, newest first. A Session expands in
 * place — there is no separate detail screen — so one tap answers "what did I
 * lift" and a correction stays one row away from the number it fixes.
 */

interface HistoryData {
  sessions: Session[];
  routineNames: Map<string, string>;
  exerciseNames: Map<string, string>;
}

type ScreenState = { kind: "loading" } | { kind: "failed" } | { kind: "ready"; data: HistoryData };

function panelId(sessionId: string): string {
  return `historico-painel-${sessionId}`;
}

export function HistoryScreen() {
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Session | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const triggers = useRef(new Map<string, HTMLButtonElement>());
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listFinishedSessions(), listRoutines(), listExercises()])
      .then(([sessions, routines, exercises]) => {
        if (cancelled) return;
        setState({
          kind: "ready",
          data: {
            sessions,
            routineNames: new Map(routines.map((routine) => [routine.id, routine.name])),
            exerciseNames: new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
          },
        });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function toggle(sessionId: string) {
    setExpandedId((current) => (current === sessionId ? null : sessionId));
  }

  /** Escape inside the panel closes it and puts focus back on its row. */
  function collapse(sessionId: string) {
    setExpandedId(null);
    triggers.current.get(sessionId)?.focus();
  }

  /** A correction rewrites the Session in place, so the next reload agrees. */
  async function correct(
    session: Session,
    set: PerformedSet,
    weight: number,
    reps: number,
  ): Promise<boolean> {
    try {
      const updated = await updateSet(session.id, {
        exerciseId: set.exerciseId,
        index: set.index,
        weight,
        reps,
      });
      setState((previous) => {
        if (previous.kind !== "ready") return previous;
        return {
          ...previous,
          data: {
            ...previous.data,
            sessions: previous.data.sessions.map((row) => (row.id === updated.id ? updated : row)),
          },
        };
      });
      setNotice(`Série ${set.index + 1} corrigida.`);
      return true;
    } catch {
      setNotice("Não foi possível salvar a correção.");
      return false;
    }
  }

  /** Deleting removes the Session and every Set it contributed to volume. */
  async function confirmDelete(session: Session) {
    setBusy(true);
    try {
      await deleteFinishedSession(session.id);
      setState((previous) => {
        if (previous.kind !== "ready") return previous;
        return {
          ...previous,
          data: {
            ...previous.data,
            sessions: previous.data.sessions.filter((row) => row.id !== session.id),
          },
        };
      });
      setDeleting(null);
      setExpandedId(null);
      setNotice("Sessão apagada.");
      titleRef.current?.focus();
    } catch {
      setNotice("Não foi possível apagar a sessão.");
    } finally {
      setBusy(false);
    }
  }

  const data = state.kind === "ready" ? state.data : null;
  const groups = data ? groupSessionsByMonth(data.sessions, Date.now()) : [];
  const routineNames = data?.routineNames ?? new Map<string, string>();
  const exerciseNames = data?.exerciseNames ?? new Map<string, string>();

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Link className={styles.back} to="/">
          Rotinas
        </Link>
        <h1 className={styles.title} ref={titleRef} tabIndex={-1}>
          Histórico
        </h1>
      </header>

      <div className={styles.body}>
        {state.kind === "failed" ? (
          <p className={styles.message}>Não foi possível carregar o histórico.</p>
        ) : null}

        {data && data.sessions.length === 0 ? (
          <p className={styles.message}>Nenhuma sessão ainda.</p>
        ) : null}

        {groups.map((group) => (
          <section key={group.key} className={styles.month}>
            <h2 className={styles.monthLabel}>{group.label}</h2>
            <ul className={styles.list}>
              {group.sessions.map((session) => {
                const title = sessionTitle(session.routineId, routineNames);
                const open = expandedId === session.id;
                return (
                  <li key={session.id} className={styles.card}>
                    <button
                      type="button"
                      className={styles.row}
                      aria-expanded={open}
                      aria-controls={panelId(session.id)}
                      onClick={() => toggle(session.id)}
                      ref={(node) => {
                        if (node) triggers.current.set(session.id, node);
                        else triggers.current.delete(session.id);
                      }}
                    >
                      <span className={styles.rowText}>
                        <span className={styles.name}>{title}</span>
                        <span className={styles.summary}>{describeSession(session)}</span>
                      </span>
                      <span className={styles.chevron} aria-hidden="true">
                        ▾
                      </span>
                    </button>

                    {open ? (
                      <ExpandedSession
                        session={session}
                        title={title}
                        exerciseNames={exerciseNames}
                        onCorrect={correct}
                        onCollapse={() => collapse(session.id)}
                        onDelete={() => setDeleting(session)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <p className={styles.notice} aria-live="polite">
          {notice}
        </p>
      </div>

      {deleting ? (
        <DeleteDialog
          busy={busy}
          title={sessionTitle(deleting.routineId, routineNames)}
          date={formatDate(deleting.startedAt)}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void confirmDelete(deleting)}
        />
      ) : null}
    </main>
  );
}

interface ExpandedSessionProps {
  session: Session;
  title: string;
  exerciseNames: ReadonlyMap<string, string>;
  onCorrect: (
    session: Session,
    set: PerformedSet,
    weight: number,
    reps: number,
  ) => Promise<boolean>;
  onCollapse: () => void;
  onDelete: () => void;
}

/**
 * The Session's Sets, grouped by Exercise. A real button opens it, so it is
 * reachable by touch, by Enter/Space and by assistive technology; Escape
 * closes it and returns focus to that button.
 */
function ExpandedSession({
  session,
  title,
  exerciseNames,
  onCorrect,
  onCollapse,
  onDelete,
}: ExpandedSessionProps) {
  const blocks = sessionBlocks(session);

  return (
    <section
      id={panelId(session.id)}
      className={styles.panel}
      aria-label={`Séries de ${title}`}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.stopPropagation();
          onCollapse();
        }
      }}
    >
      {blocks.length === 0 ? (
        <p className={styles.empty}>Nenhuma série registrada.</p>
      ) : (
        blocks.map((block) => {
          const exerciseName = resolveExerciseName(exerciseNames, block.exerciseId);
          return (
            <section key={block.exerciseId} className={styles.block}>
              <h3 className={styles.blockTitle}>{exerciseName}</h3>
              <ul className={styles.sets}>
                {block.sets.map((set) => (
                  <SetCorrectionRow
                    key={`${set.exerciseId}:${set.index}`}
                    exerciseName={exerciseName}
                    set={set}
                    onSave={(weight, reps) => onCorrect(session, set, weight, reps)}
                  />
                ))}
              </ul>
            </section>
          );
        })
      )}

      <button type="button" className={styles.delete} onClick={onDelete}>
        Apagar sessão
      </button>
    </section>
  );
}

interface SetCorrectionRowProps {
  exerciseName: string;
  set: PerformedSet;
  onSave: (weight: number, reps: number) => Promise<boolean>;
}

function toText(value: number): string {
  return String(value).replace(".", ",");
}

/**
 * One recorded Set, correctable. The values persist on Save, not on every
 * keystroke: a half-typed number must never reach the log. The row's slot and
 * timestamp do not move.
 */
function SetCorrectionRow({ exerciseName, set, onSave }: SetCorrectionRowProps) {
  const [weightText, setWeightText] = useState(() => toText(set.weight));
  const [repsText, setRepsText] = useState(() => toText(set.reps));
  const [saving, setSaving] = useState(false);

  const weight = parseWeight(weightText);
  const reps = parseReps(repsText);
  const changed = weight !== null && reps !== null && (weight !== set.weight || reps !== set.reps);
  const canSave = changed && !saving;

  async function save() {
    if (weight === null || reps === null) return;
    setSaving(true);
    try {
      await onSave(weight, reps);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className={styles.setRow}>
      <span className={styles.setPosition} aria-hidden="true">
        {set.index + 1}
      </span>
      <input
        aria-label={`Carga da série ${set.index + 1} de ${exerciseName}`}
        className={styles.weight}
        inputMode="decimal"
        readOnly={saving}
        type="text"
        value={weightText}
        onChange={(event) => setWeightText(event.target.value)}
      />
      <span className={styles.unit} aria-hidden="true">
        kg
      </span>
      <span className={styles.times} aria-hidden="true">
        ×
      </span>
      <input
        aria-label={`Repetições da série ${set.index + 1} de ${exerciseName}`}
        className={styles.reps}
        inputMode="numeric"
        readOnly={saving}
        type="text"
        value={repsText}
        onChange={(event) => setRepsText(event.target.value)}
      />
      <button
        type="button"
        className={styles.save}
        aria-label={`Salvar série ${set.index + 1} de ${exerciseName}`}
        disabled={!canSave}
        onClick={() => void save()}
      >
        {saving ? "Salvando…" : "Salvar"}
      </button>
    </li>
  );
}

interface DeleteDialogProps {
  busy: boolean;
  title: string;
  date: string;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Deleting is irreversible, so the dialog names what disappears. */
function DeleteDialog({ busy, title, date, onCancel, onConfirm }: DeleteDialogProps) {
  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="apagar-sessao-titulo"
        aria-describedby="apagar-sessao-descricao"
        onKeyDown={(event) => {
          if (event.key === "Escape" && !busy) onCancel();
        }}
      >
        <h2 id="apagar-sessao-titulo" className={styles.dialogTitle}>
          Apagar sessão?
        </h2>
        <p id="apagar-sessao-descricao" className={styles.dialogBody}>
          {title} · {date}. As séries desta sessão serão apagadas e não contarão mais no volume.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onConfirm} disabled={busy}>
            {busy ? "Apagando…" : "Apagar sessão"}
          </button>
          <button type="button" className={styles.secondary} onClick={onCancel} disabled={busy}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
