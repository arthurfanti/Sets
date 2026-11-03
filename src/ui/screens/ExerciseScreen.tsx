import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { listExercises } from "@/db/repositories";
import { listExerciseSessions } from "@/db/sessions";
import type { Exercise, PerformedSet, Session } from "@/domain";
import { formatDate } from "@/domain/history";
import {
  bestSet,
  estimatedOneRepMax,
  heaviestWeight,
  oneRepMaxSeries,
  WINDOW_WEEKS,
  weeklyVolume,
} from "@/domain/progress";
import { OneRepMaxChart } from "@/ui/components/OneRepMaxChart";
import { VolumeChart } from "@/ui/components/VolumeChart";
import { formatKg, formatNumber } from "@/ui/format";
import styles from "./ExerciseScreen.module.css";

/**
 * One Exercise's progress: the Best Set as the headline, then the estimated
 * 1RM trend and weekly volume. The headline is all-time; the toggle only moves
 * the charts. Everything here is read-only — Sets are logged inside a Sessão.
 */

interface ExerciseData {
  exercise: Exercise;
  sessions: Session[];
}

type ScreenState =
  | { kind: "loading" }
  | { kind: "failed" }
  | { kind: "missing" }
  | { kind: "ready"; data: ExerciseData };

/** How many Sets fit in the compact list under the charts. */
const RECENT_SETS = 3;

type RangeChoice = "window" | "all";

export function ExerciseScreen() {
  const { id } = useParams();
  const [state, setState] = useState<ScreenState>({ kind: "loading" });
  const [range, setRange] = useState<RangeChoice>("window");

  useEffect(() => {
    if (!id) {
      setState({ kind: "missing" });
      return;
    }
    let cancelled = false;
    setState({ kind: "loading" });

    void (async () => {
      try {
        const [exercises, sessions] = await Promise.all([
          listExercises(),
          listExerciseSessions(id),
        ]);
        if (cancelled) return;
        const exercise = exercises.find((row) => row.id === id);
        if (!exercise) {
          setState({ kind: "missing" });
          return;
        }
        setState({ kind: "ready", data: { exercise, sessions } });
      } catch {
        if (!cancelled) setState({ kind: "failed" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Link className={styles.back} to="/historico">
          Histórico
        </Link>
        <h1 className={styles.title}>
          {state.kind === "ready" ? state.data.exercise.name : "Exercício"}
        </h1>
      </header>

      <div className={styles.body}>
        {state.kind === "missing" ? (
          <p className={styles.message}>Exercício não encontrado.</p>
        ) : null}

        {state.kind === "failed" ? (
          <p className={styles.message}>Não foi possível abrir o exercício.</p>
        ) : null}

        {state.kind === "ready" ? (
          <Progress data={state.data} range={range} onRange={setRange} />
        ) : null}
      </div>
    </main>
  );
}

interface ProgressProps {
  data: ExerciseData;
  range: RangeChoice;
  onRange: (range: RangeChoice) => void;
}

function Progress({ data, range, onRange }: ProgressProps) {
  const { exercise, sessions } = data;
  const sets = sessions.flatMap((session) =>
    session.sets.filter((set) => set.exerciseId === exercise.id),
  );

  if (sets.length === 0) {
    return <p className={styles.message}>Nenhuma série registrada.</p>;
  }

  const best = bestSet(sets);
  const estimate = best ? estimatedOneRepMax(best.weight, best.reps) : null;
  const heaviest = heaviestWeight(sets);
  const now = Date.now();
  const period = { now, weeks: range === "all" ? ("all" as const) : WINDOW_WEEKS };
  const series = oneRepMaxSeries(sessions, exercise.id, period);
  const buckets = weeklyVolume(sessions, exercise.id, period);
  const recent = [...sets]
    .sort((a, b) => b.confirmedAt - a.confirmedAt || a.index - b.index)
    .slice(0, RECENT_SETS);

  return (
    <>
      <section className={styles.headline}>
        <p className={styles.headlineLabel}>
          <span className={styles.dot} aria-hidden="true" />
          Melhor série
        </p>
        {best && estimate !== null ? (
          <>
            <p className={styles.headlineValue}>
              {formatNumber(best.weight)} <span className={styles.unit}>kg</span>
              <span className={styles.times}> × </span>
              {formatNumber(best.reps)}
            </p>
            <p className={styles.headlineMeta}>
              1RM estimado {formatKg(estimate)}
              {heaviest === null ? null : ` · Carga máxima ${formatKg(heaviest)}`}
            </p>
          </>
        ) : (
          <>
            <p className={styles.headlineEmpty}>Nenhuma série entre 1 e 10 repetições.</p>
            <p className={styles.headlineMeta}>
              {heaviest === null ? null : `Carga máxima ${formatKg(heaviest)}`}
            </p>
          </>
        )}
      </section>

      <fieldset className={styles.toggle} aria-label="Período dos gráficos">
        <button
          type="button"
          className={styles.option}
          data-selected={range === "window"}
          aria-pressed={range === "window"}
          onClick={() => onRange("window")}
        >
          12 semanas
        </button>
        <button
          type="button"
          className={styles.option}
          data-selected={range === "all"}
          aria-pressed={range === "all"}
          onClick={() => onRange("all")}
        >
          Tudo
        </button>
      </fieldset>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>1RM estimado</h2>
        {series.length === 0 ? (
          <p className={styles.message}>Nenhuma série entre 1 e 10 repetições no período.</p>
        ) : (
          <OneRepMaxChart points={series} />
        )}
      </section>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>Volume por semana</h2>
        <VolumeChart buckets={buckets} />
      </section>

      <section className={styles.recent}>
        <h2 className={styles.cardTitle}>Séries recentes</h2>
        <ul className={styles.setList}>
          {recent.map((set) => (
            <SetLine key={`${set.confirmedAt}:${set.index}`} set={set} />
          ))}
        </ul>
      </section>
    </>
  );
}

function SetLine({ set }: { set: PerformedSet }) {
  return (
    <li className={styles.setRow}>
      <span className={styles.setDate}>{formatDate(set.confirmedAt)}</span>
      <span className={styles.setValue}>
        {formatNumber(set.weight)} <span className={styles.unit}>kg</span>
        <span className={styles.times}> × </span>
        {formatNumber(set.reps)}
      </span>
    </li>
  );
}
