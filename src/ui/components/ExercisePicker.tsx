import { type ReactNode, useCallback, useEffect, useState } from "react";
import { hideExercise, listSelectableExercises } from "@/db/exercises";
import { listExercises } from "@/db/repositories";
import type { Exercise } from "@/domain";
import { matchesQuery } from "@/domain/naming";
import { groupByMuscle } from "@/domain/picker";
import { ExerciseForm } from "./ExerciseForm";
import styles from "./ExercisePicker.module.css";
import { Sheet } from "./Sheet";

type View =
  | { name: "list" }
  | { name: "create" }
  | { name: "options"; exercise: Exercise }
  | { name: "rename"; exercise: Exercise };

interface ExercisePickerProps {
  onPick: (exercise: Exercise) => void;
  onClose: () => void;
  /** Exercises already used by the plan being edited; they cannot be picked twice. */
  added?: readonly string[];
  /** Fired after a custom Exercise is created, renamed or hidden. */
  onExercisesChanged?: () => void;
}

const TITLES: Record<View["name"], string> = {
  list: "Exercícios",
  create: "Novo exercício",
  options: "Exercício",
  rename: "Renomear exercício",
};

/**
 * The searchable list a Routine is built from: one section per muscle in the
 * fixed order, matching on name and alias, and the Lifter's own Exercises
 * editable in place. Creating is offered only when the search finds nothing,
 * prefilled with what was typed.
 */
export function ExercisePicker({
  onPick,
  onClose,
  added = [],
  onExercisesChanged,
}: ExercisePickerProps) {
  const [selectable, setSelectable] = useState<Exercise[] | null>(null);
  const [every, setEvery] = useState<Exercise[]>([]);
  const [view, setView] = useState<View>({ name: "list" });
  const [query, setQuery] = useState("");

  const refresh = useCallback(async () => {
    const [visible, all] = await Promise.all([listSelectableExercises(), listExercises()]);
    setSelectable(visible);
    setEvery(all);
  }, []);

  useEffect(() => {
    refresh().catch(() => setSelectable([]));
  }, [refresh]);

  const groups = groupByMuscle(
    (selectable ?? []).filter((exercise) => matchesQuery(exercise, query)),
  );
  const addedIds = new Set(added);
  const typed = query.trim();
  const nothingFound = groups.length === 0;

  async function hide(exercise: Exercise) {
    await hideExercise(exercise.id);
    await refresh();
    onExercisesChanged?.();
    // Back to the whole list: the search would otherwise show "create" for the
    // Exercise that was just hidden.
    setQuery("");
    setView({ name: "list" });
  }

  async function renamed() {
    await refresh();
    onExercisesChanged?.();
    setView({ name: "list" });
  }

  let body: ReactNode;
  if (view.name === "create") {
    body = (
      <ExerciseForm
        mode="create"
        initialName={typed}
        exercises={every}
        onCreated={(exercise) => {
          onExercisesChanged?.();
          onPick(exercise);
        }}
        onUseExisting={onPick}
      />
    );
  } else if (view.name === "rename") {
    body = (
      <ExerciseForm
        mode="rename"
        initialName={view.exercise.name}
        exercises={every}
        editing={view.exercise}
        onRenamed={() => void renamed()}
      />
    );
  } else if (view.name === "options") {
    body = (
      <div className={styles.stack}>
        <button
          type="button"
          className={styles.action}
          onClick={() => setView({ name: "rename", exercise: view.exercise })}
        >
          Renomear
        </button>
        <button type="button" className={styles.action} onClick={() => void hide(view.exercise)}>
          Ocultar exercício
        </button>
        <p className={styles.hint}>
          Ocultar tira o exercício do seletor. As séries já registradas continuam iguais.
        </p>
      </div>
    );
  } else {
    body = (
      <div className={styles.stack}>
        <input
          type="search"
          className={styles.search}
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
          placeholder="Buscar exercício"
          aria-label="Buscar exercício"
        />

        {selectable === null ? <p className={styles.hint}>Carregando…</p> : null}

        {typed.length > 0 && nothingFound ? (
          <button
            type="button"
            className={styles.create}
            onClick={() => setView({ name: "create" })}
            aria-label={`Criar exercício «${typed}»`}
          >
            Criar «{typed}»
          </button>
        ) : null}

        {groups.map((group, index) => (
          <section
            key={group.muscleGroup}
            className={styles.group}
            aria-labelledby={`picker-group-${index}`}
          >
            <h3 id={`picker-group-${index}`} className={styles.groupTitle}>
              {group.muscleGroup}
            </h3>
            <ul className={styles.list}>
              {group.exercises.map((exercise) => (
                <li key={exercise.id} className={styles.row}>
                  {addedIds.has(exercise.id) ? (
                    <span className={styles.added}>
                      <span className={styles.pickName}>{exercise.name}</span>
                      <span className={styles.addedNote}>Já adicionado</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={styles.pick}
                      onClick={() => onPick(exercise)}
                      aria-label={`Adicionar ${exercise.name}`}
                    >
                      {exercise.name}
                    </button>
                  )}
                  {exercise.source === "user" && !addedIds.has(exercise.id) ? (
                    <button
                      type="button"
                      className={styles.more}
                      onClick={() => setView({ name: "options", exercise })}
                      aria-label={`Opções de ${exercise.name}`}
                    >
                      ···
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    );
  }

  const title = view.name === "options" ? view.exercise.name : TITLES[view.name];

  return (
    <Sheet
      title={title}
      onClose={onClose}
      {...(view.name === "list" ? {} : { onBack: () => setView({ name: "list" }) })}
    >
      {body}
    </Sheet>
  );
}
