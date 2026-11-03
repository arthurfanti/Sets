import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listExercises, listRoutines } from "@/db/repositories";
import {
  ActiveSessionError,
  addExerciseToSession,
  discardSession,
  findActiveSession,
  getSession,
  listFinishedSessions,
  startSession,
} from "@/db/sessions";
import { getSetWriter } from "@/db/writes";
import type { Exercise, Prescription, Routine, Session } from "@/domain";
import { activeSlot, planSlots, prefillSlot, type Slot, setKey } from "@/domain/session";
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
  | { kind: "live"; data: LiveData };

export function SessionScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [picking, setPicking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /**
   * True while any confirmed Set is only in memory. It clears on the flush a
   * later successful write performs, and is never dismissable: the bar is the
   * only sign that closing the app would lose the Sets above it.
   */
  const [writeFailed, setWriteFailed] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setState({ kind: "loading" });
    setNotice(null);
    setWriteFailed(false);

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
          const writer = getSetWriter();
          setState({
            kind: "live",
            data: {
              // Sets held from a failed write are not in the stored document;
              // re-apply them so a reload never makes a confirmed Set vanish.
              session: writer.applyPending(session),
              exercises,
              routines,
              history,
            },
          });
          // Held Sets survive navigation; the bar returns only for this Session.
          setWriteFailed(writer.pending().some((held) => held.sessionId === session.id));
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

  async function confirmSet(
    data: LiveData,
    slot: Slot,
    exerciseName: string,
    weight: number,
    reps: number,
  ) {
    const result = await getSetWriter().write(data.session, {
      exerciseId: slot.exerciseId,
      index: slot.index,
      weight,
      reps,
    });
    setState((previous) =>
      previous.kind === "live"
        ? { ...previous, data: { ...previous.data, session: result.session } }
        : previous,
    );
    setWriteFailed(result.pending > 0);
    setNotice(result.saved ? `Série ${slot.index + 1} de ${exerciseName} confirmada.` : null);
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
      {writeFailed ? (
        <p className={styles.writeWarning} role="alert">
          Não foi possível salvar. Suas séries continuam aqui.
        </p>
      ) : null}

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

      {picking ? (
        <AddExerciseSheet
          exercises={data.exercises}
          exclude={data.session.plan.map((row) => row.exerciseId)}
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => void pickExercise(data, exerciseId)}
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
