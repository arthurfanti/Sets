import { useEffect, useRef, useState } from "react";
import { type Exercise, MUSCLE_GROUPS } from "@/domain";
import styles from "./AddExerciseSheet.module.css";

interface AddExerciseSheetProps {
  exercises: Exercise[];
  /** Exercises already in the live Plan, which would only be duplicated. */
  exclude: string[];
  onPick: (exerciseId: string) => void;
  onClose: () => void;
}

function fold(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
}

/** The live Session's picker: it adds to the Plan already in progress. */
export function AddExerciseSheet({ exercises, exclude, onPick, onClose }: AddExerciseSheetProps) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  const folded = fold(query);
  const excluded = new Set(exclude);
  const available = exercises.filter(
    (exercise) =>
      !excluded.has(exercise.id) && (folded === "" || fold(exercise.name).includes(folded)),
  );
  const groups = MUSCLE_GROUPS.map((group) => ({
    group,
    rows: available.filter((exercise) => exercise.muscleGroup === group),
  })).filter((entry) => entry.rows.length > 0);

  return (
    <div className={styles.overlay} role="presentation">
      <div
        aria-labelledby="add-exercise-title"
        aria-modal="true"
        className={styles.sheet}
        role="dialog"
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
      >
        <header className={styles.header}>
          <h2 className={styles.title} id="add-exercise-title">
            Adicionar exercício
          </h2>
          <button aria-label="Fechar" className={styles.close} type="button" onClick={onClose}>
            ✕
          </button>
        </header>

        <input
          aria-label="Buscar exercício"
          className={styles.search}
          placeholder="Buscar exercício"
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className={styles.results}>
          {groups.length === 0 ? (
            <p className={styles.empty}>Nenhum exercício encontrado.</p>
          ) : (
            groups.map(({ group, rows }) => (
              <section key={group} className={styles.group}>
                <h3 className={styles.groupTitle}>{group}</h3>
                <ul className={styles.list}>
                  {rows.map((exercise) => (
                    <li key={exercise.id}>
                      <button
                        className={styles.option}
                        type="button"
                        onClick={() => onPick(exercise.id)}
                      >
                        {exercise.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
