import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listExercises, listRoutines } from "@/db/repositories";
import {
  ActiveSessionError,
  addExerciseToSession,
  appendSet,
  discardSession,
  findActiveSession,
  finishSession,
  getSession,
  listFinishedSessions,
  startSession,
} from "@/db/sessions";
import type { Exercise, Prescription, Routine, Session } from "@/domain";
import {
  activeSlot,
  isStale,
  lastActivityAt,
  planSlots,
  prefillSlot,
  type Slot,
  setKey,
} from "@/domain/session";
import { AddExerciseSheet } from "@/ui/components/AddExerciseSheet";
import { SetRow } from "@/ui/components/SetRow";
import styles from "./SessionScreen.module.css";

interface LiveData {
  session: Session;
  exercises: Exercise[];
  routines: Routine[];
  history: Session[];
}

type ScreenState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "missing" }
  | { kind: "finished"; session: Session }
  | { kind: "conflict"; active: Session; routineId: string }
  | { kind: "stale"; data: LiveData }
  | { kind: "live"; data: LiveData };

export function SessionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [picking, setPicking] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ kind: "loading" });
    setNotice(null);

    void (async () => {
      try {
        // A `ses_` id is an existing Session; anything else is a Routine the
        // Lifter just tapped, and the Session starts here.
        if (id.startsWith("ses_")) {
          const session = await getSession(id);
          if (cancelled) return;
          if (!session) {
            setState({ kind: "missing" });
            return;
          }
          if (session.endedAt !== undefined) {
            setState({ kind: "finished", session });
            return;
          }
          const [exercises, routines, history] = await Promise.all([
            listExercises(),
            listRoutines(),
            listFinishedSessions(),
          ]);
          if (cancelled) return;
          const data: LiveData = { session, exercises, routines, history };
          setState(isStale(session, Date.now()) ? { kind: "stale", data } : { kind: "live", data });
          return;
        }

        const active = await findActiveSession();
        if (cancelled) return;
        if (active) {
          setState({ kind: "conflict", active, routineId: id });
          return;
        }
        const started = await startSession(id);
        if (!cancelled) navigate(`/sessao/${started.id}`, { replace: true });
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ActiveSessionError) {
          navigate(`/sessao/${error.session.id}`, { replace: true });
          return;
        }
        setState({ kind: "failed" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  async function resume(sessionId: string) {
    navigate(`/sessao/${sessionId}`, { replace: true });
  }

  async function discardAndStart(activeId: string, routineId: string) {
    setBusy(true);
    try {
      await discardSession(activeId);
      const started = await startSession(routineId);
      navigate(`/sessao/${started.id}`, { replace: true });
    } catch {
      setBusy(false);
      setNotice("Não foi possível descartar a sessão.");
    }
  }

  /** Finish ends the Session at its last logged Set, then returns Home. */
  async function finish(sessionId: string) {
    setBusy(true);
    try {
      await finishSession(sessionId);
      navigate("/", { replace: true });
    } catch {
      setBusy(false);
      setNotice("Não foi possível finalizar a sessão.");
    }
  }

  /** Discard deletes the draft, after the confirmation, and returns Home. */
  async function discard(sessionId: string) {
    setBusy(true);
    try {
      await discardSession(sessionId);
      navigate("/", { replace: true });
    } catch {
      setBusy(false);
      setDiscarding(false);
      setNotice("Não foi possível descartar a sessão.");
    }
  }

  async function confirmSet(
    data: LiveData,
    slot: Slot,
    exerciseName: string,
    weight: number,
    reps: number,
  ) {
    try {
      const updated = await appendSet(data.session.id, {
        exerciseId: slot.exerciseId,
        index: slot.index,
        weight,
        reps,
      });
      setState((previous) =>
        previous.kind === "live"
          ? { ...previous, data: { ...previous.data, session: updated } }
          : previous,
      );
      setNotice(`Série ${slot.index + 1} de ${exerciseName} confirmada.`);
    } catch {
      setNotice("Não foi possível salvar a série. Tente de novo.");
    }
  }

  async function pickExercise(data: LiveData, exerciseId: string) {
    setPicking(false);
    try {
      const updated = await addExerciseToSession(data.session.id, exerciseId);
      setState((previous) =>
        previous.kind === "live"
          ? { ...previous, data: { ...previous.data, session: updated } }
          : previous,
      );
    } catch {
      setNotice("Não foi possível adicionar o exercício.");
    }
  }

  if (state.kind === "loading") {
    return <Shell title="Sessão">{null}</Shell>;
  }

  if (state.kind === "missing") {
    return (
      <Shell title="Sessão">
        <p className={styles.message}>Sessão não encontrada.</p>
        <Link className={styles.back} to="/">
          Voltar para as rotinas
        </Link>
      </Shell>
    );
  }

  if (state.kind === "failed") {
    return (
      <Shell title="Sessão">
        <p className={styles.message}>Não foi possível abrir a sessão.</p>
      </Shell>
    );
  }

  if (state.kind === "finished") {
    return (
      <Shell title="Sessão">
        <p className={styles.message}>Esta sessão já foi encerrada.</p>
        <Link className={styles.back} to="/">
          Voltar para as rotinas
        </Link>
      </Shell>
    );
  }

  if (state.kind === "conflict") {
    return (
      <Shell title="Sessão em andamento" back>
        <p className={styles.message}>
          Você já tem uma sessão aberta. Retome de onde parou ou descarte para começar outra.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.primary}
            disabled={busy}
            type="button"
            onClick={() => void resume(state.active.id)}
          >
            Continuar sessão
          </button>
          <button
            className={styles.secondary}
            disabled={busy}
            type="button"
            onClick={() => void discardAndStart(state.active.id, state.routineId)}
          >
            Descartar e começar
          </button>
        </div>
        {notice ? <p className={styles.notice}>{notice}</p> : null}
      </Shell>
    );
  }

  if (state.kind === "stale") {
    const day = new Date(lastActivityAt(state.data.session)).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
    return (
      <Shell title="Sessão em aberto" back>
        <p className={styles.message}>
          Esta sessão ficou aberta desde {day}. Continue de onde parou ou finalize no último
          registro — o tempo parado não conta.
        </p>
        <div className={styles.actions}>
          <button
            className={styles.primary}
            disabled={busy}
            type="button"
            onClick={() => setState({ kind: "live", data: state.data })}
          >
            Continuar sessão
          </button>
          <button
            className={styles.secondary}
            disabled={busy}
            type="button"
            onClick={() => void finish(state.data.session.id)}
          >
            Finalizar sessão
          </button>
        </div>
        {notice ? <p className={styles.notice}>{notice}</p> : null}
      </Shell>
    );
  }

  const { data } = state;
  const routine = data.routines.find((row) => row.id === data.session.routineId);
  const exerciseById = new Map(data.exercises.map((exercise) => [exercise.id, exercise]));
  const active = activeSlot(data.session.plan, data.session.sets);
  const activeKey = active ? setKey(active.exerciseId, active.index) : null;
  const confirmed = new Map(
    data.session.sets.map((set) => [setKey(set.exerciseId, set.index), set]),
  );

  return (
    <Shell title={routine?.name ?? "Sessão livre"} back>
      <p className={styles.meta}>
        {data.session.plan.length === 0
          ? "Nenhum exercício no Plano."
          : "Séries pré-preenchidas com o que você fez da última vez."}
      </p>

      <div className={styles.blocks}>
        {data.session.plan.map((prescription: Prescription) => {
          const exercise = exerciseById.get(prescription.exerciseId);
          const name = exercise?.name ?? "Exercício";
          const slots = planSlots([prescription]);
          return (
            <section key={prescription.exerciseId} className={styles.block}>
              <header className={styles.blockHeader}>
                <h2 className={styles.exerciseName}>{name}</h2>
                <p className={styles.prescription}>{describe(prescription)}</p>
              </header>
              <ul className={styles.rows}>
                {slots.map((slot) => {
                  const key = setKey(slot.exerciseId, slot.index);
                  const done = confirmed.get(key);
                  const suggestion: { weight: number | null; reps: number | null } = done
                    ? { weight: done.weight, reps: done.reps }
                    : prefillSlot(slot.exerciseId, slot.index, data.history, prescription.weight);
                  return (
                    <SetRow
                      key={key}
                      active={key === activeKey}
                      confirmed={done !== undefined}
                      exerciseName={name}
                      position={slot.index + 1}
                      prefilled={done === undefined && suggestion.weight !== null}
                      reps={suggestion.reps}
                      weight={suggestion.weight}
                      onConfirm={(weight, reps) => confirmSet(data, slot, name, weight, reps)}
                    />
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <button className={styles.add} type="button" onClick={() => setPicking(true)}>
        Adicionar exercício
      </button>

      <p className={styles.notice} aria-live="polite">
        {notice}
      </p>

      <footer className={styles.footer}>
        <button
          className={styles.primary}
          type="button"
          disabled={busy}
          onClick={() => void finish(data.session.id)}
        >
          Finalizar
        </button>
        <button
          className={styles.discard}
          type="button"
          disabled={busy}
          onClick={() => setDiscarding(true)}
        >
          Descartar
        </button>
      </footer>

      {picking ? (
        <AddExerciseSheet
          exercises={data.exercises}
          exclude={data.session.plan.map((row) => row.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => void pickExercise(data, exerciseId)}
        />
      ) : null}

      {discarding ? (
        <DiscardDialog
          busy={busy}
          onCancel={() => setDiscarding(false)}
          onConfirm={() => void discard(data.session.id)}
        />
      ) : null}
    </Shell>
  );
}

function describe(prescription: Prescription): string {
  const parts = [`${prescription.sets} ${prescription.sets === 1 ? "série" : "séries"}`];
  if (prescription.reps !== "") parts.push(`${prescription.reps} reps`);
  if (prescription.weight !== undefined) parts.push(`${prescription.weight} kg`);
  return parts.join(" · ");
}

interface ShellProps {
  title: string;
  back?: boolean;
  children: ReactNode;
}

function Shell({ title, back = false, children }: ShellProps) {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        {back ? (
          <Link className={styles.back} to="/">
            Rotinas
          </Link>
        ) : null}
        <h1 className={styles.title}>{title}</h1>
      </header>
      <div className={styles.body}>{children}</div>
    </main>
  );
}

interface DiscardDialogProps {
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Discarding is irreversible — the draft never reaches history — so it asks
 * first. Same dialog shape as the delete-all confirmation in About.
 */
function DiscardDialog({ busy, onCancel, onConfirm }: DiscardDialogProps) {
  return (
    <div className={styles.overlay}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="descartar-titulo"
        aria-describedby="descartar-descricao"
      >
        <h2 id="descartar-titulo" className={styles.dialogTitle}>
          Descartar sessão?
        </h2>
        <p id="descartar-descricao" className={styles.dialogBody}>
          As séries registradas serão apagadas e a sessão não vai para o histórico.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.confirm} onClick={onConfirm} disabled={busy}>
            {busy ? "Descartando…" : "Descartar sessão"}
          </button>
          <button type="button" className={styles.secondary} onClick={onCancel} disabled={busy}>
            Manter sessão
          </button>
        </div>
      </div>
    </div>
  );
}
