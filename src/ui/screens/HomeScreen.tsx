import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { countSessions, listExercises, listRoutines } from "@/db/repositories";
import { findActiveSession } from "@/db/sessions";
import type { Routine, Session } from "@/domain";
import { Placeholder } from "@/ui/Placeholder";
import styles from "./HomeScreen.module.css";

interface HomeData {
  routines: Routine[];
  exerciseNames: Map<string, string>;
  sessionCount: number;
  activeSession: Session | undefined;
}

export function HomeScreen() {
  const [data, setData] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listRoutines(), listExercises(), countSessions(), findActiveSession()])
      .then(([routines, exercises, sessionCount, activeSession]) => {
        if (cancelled) return;
        setData({
          routines,
          exerciseNames: new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
          sessionCount,
          activeSession,
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) {
    return (
      <Placeholder title="Rotinas">
        <p className={styles.empty}>Não foi possível carregar as rotinas.</p>
      </Placeholder>
    );
  }

  if (data === null) {
    return <Placeholder title="Rotinas">{null}</Placeholder>;
  }

  const nameOf = (exerciseId: string) => data.exerciseNames.get(exerciseId);

  return (
    <Placeholder title="Rotinas">
      {data.activeSession ? (
        <Link className={styles.resume} to={`/sessao/${data.activeSession.id}`}>
          <span className={styles.resumeLabel}>Sessão em andamento</span>
          <span className={styles.resumeAction}>Continuar</span>
        </Link>
      ) : null}

      {data.sessionCount === 0 ? (
        <p className={styles.hint}>Nenhuma sessão ainda. Escolha uma rotina para começar.</p>
      ) : null}

      <RoutineGroup
        title="Rotinas prontas"
        routines={data.routines.filter((routine) => routine.source === "builtin")}
        nameOf={nameOf}
      />

      <RoutineGroup
        title="Minhas rotinas"
        routines={data.routines.filter((routine) => routine.source === "user")}
        nameOf={nameOf}
        emptyText="Nenhuma rotina sua ainda."
      />
    </Placeholder>
  );
}

interface RoutineGroupProps {
  title: string;
  routines: Routine[];
  nameOf: (exerciseId: string) => string | undefined;
  emptyText?: string;
}

function RoutineGroup({ title, routines, nameOf, emptyText }: RoutineGroupProps) {
  if (routines.length === 0 && !emptyText) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {routines.length === 0 ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <ul className={styles.list}>
          {routines.map((routine) => {
            // A Routine whose Exercises do not resolve renders no summary line,
            // rather than a dangling separator.
            const summary = routine.prescriptions
              .map((prescription) => nameOf(prescription.exerciseId))
              .filter((name): name is string => Boolean(name))
              .join(" · ");

            return (
              <li key={routine.id}>
                <Link className={styles.row} to={`/sessao/${routine.id}`}>
                  <span className={styles.name}>{routine.name}</span>
                  {summary ? <span className={styles.summary}>{summary}</span> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
