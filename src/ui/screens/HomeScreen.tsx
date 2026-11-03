import { useEffect, useState } from "react";
import { listExercises, listRoutines } from "@/db/repositories";
import type { Exercise, Routine } from "@/domain";
import { Placeholder } from "@/ui/Placeholder";
import styles from "./HomeScreen.module.css";

interface HomeData {
  routines: Routine[];
  exerciseNames: Map<string, string>;
}

export function HomeScreen() {
  const [data, setData] = useState<HomeData | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listRoutines(), listExercises()])
      .then(([routines, exercises]: [Routine[], Exercise[]]) => {
        if (cancelled) return;
        setData({
          routines,
          exerciseNames: new Map(exercises.map((exercise) => [exercise.id, exercise.name])),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const builtIn = data?.routines.filter((routine) => routine.source === "builtin") ?? [];
  const mine = data?.routines.filter((routine) => routine.source === "user") ?? [];

  const summaryFor = (routine: Routine): string =>
    routine.prescriptions
      .map((prescription) => data?.exerciseNames.get(prescription.exerciseId))
      .filter((name): name is string => Boolean(name))
      .join(" · ");

  return (
    <Placeholder title="Rotinas">
      {failed ? <p className={styles.empty}>Não foi possível carregar as rotinas.</p> : null}

      {builtIn.length > 0 ? (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rotinas prontas</h2>
          <ul className={styles.list}>
            {builtIn.map((routine) => (
              <li key={routine.id} className={styles.row}>
                <span className={styles.name}>{routine.name}</span>
                <Summary text={summaryFor(routine)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Minhas rotinas</h2>
        {mine.length === 0 ? (
          <p className={styles.empty}>Nenhuma rotina sua ainda.</p>
        ) : (
          <ul className={styles.list}>
            {mine.map((routine) => (
              <li key={routine.id} className={styles.row}>
                <span className={styles.name}>{routine.name}</span>
                <Summary text={summaryFor(routine)} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </Placeholder>
  );
}

/** A Routine whose Exercises all failed to resolve renders no summary line
 *  rather than a dangling separator. */
function Summary({ text }: { text: string }) {
  return text ? <span className={styles.summary}>{text}</span> : null;
}
