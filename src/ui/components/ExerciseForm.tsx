import { useState } from "react";
import { createExercise, renameExercise } from "@/db/exercises";
import { type Exercise, MUSCLE_GROUPS, type MuscleGroup } from "@/domain";
import { findNameConflict } from "@/domain/naming";
import styles from "./ExerciseForm.module.css";

type ExerciseFormProps = {
  initialName: string;
  /** Every Exercise, hidden ones included, so a conflict cannot slip past. */
  exercises: readonly Exercise[];
} & (
  | {
      mode: "create";
      onCreated: (exercise: Exercise) => void;
      /** Offered instead of creating: the row the typed name already names. */
      onUseExisting: (exercise: Exercise) => void;
    }
  | { mode: "rename"; editing: Exercise; onRenamed: (exercise: Exercise) => void }
);

/**
 * One form for both ways a Lifter names an Exercise: creating one that does
 * not exist, and renaming one they own. The name is checked as it is typed —
 * an exact duplicate is refused and the existing row offered, a near match is
 * only a warning — and the group is never presumed: creating requires a choice.
 */
export function ExerciseForm(props: ExerciseFormProps) {
  const { initialName, exercises } = props;
  const editing = props.mode === "rename" ? props.editing : undefined;
  const [name, setName] = useState(initialName);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const conflict = findNameConflict(exercises, name, editing ? { exceptId: editing.id } : {});
  const needsGroup = props.mode === "create" && muscleGroup === null;
  const canSubmit = name.trim().length > 0 && !needsGroup && conflict?.kind !== "exact" && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setFailed(false);
    try {
      if (props.mode === "create") {
        if (muscleGroup === null) return;
        props.onCreated(await createExercise({ name, muscleGroup }));
      } else {
        props.onRenamed(await renameExercise(props.editing.id, name));
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input
          className={styles.input}
          value={name}
          maxLength={60}
          // biome-ignore lint/a11y/noAutofocus: the sheet exists to name the Exercise
          autoFocus
          onFocus={(event) => event.currentTarget.select()}
          onChange={(event) => setName(event.currentTarget.value)}
          placeholder="Nome do exercício"
        />
      </label>

      {props.mode === "create" ? (
        <fieldset className={styles.groups}>
          <legend className={styles.label}>Grupo muscular</legend>
          {muscleGroup === null ? <p className={styles.hint}>Escolha um grupo.</p> : null}
          <div className={styles.chips}>
            {MUSCLE_GROUPS.map((group) => (
              <button
                key={group}
                type="button"
                className={styles.chip}
                aria-pressed={muscleGroup === group}
                onClick={() => setMuscleGroup(group)}
              >
                {group}
              </button>
            ))}
          </div>
        </fieldset>
      ) : null}

      {conflict?.kind === "exact" ? (
        <div className={styles.blocked} role="status">
          <p className={styles.blockedText}>Já existe «{conflict.exercise.name}».</p>
          {props.mode === "create" ? (
            <button
              type="button"
              className={styles.useExisting}
              onClick={() => props.onUseExisting(conflict.exercise)}
            >
              Usar «{conflict.exercise.name}»
            </button>
          ) : null}
        </div>
      ) : null}

      {conflict?.kind === "near" ? (
        <p className={styles.warning} role="status">
          Parecido com «{conflict.exercise.name}». Pode criar mesmo assim.
        </p>
      ) : null}

      {failed ? (
        <p className={styles.blockedText} role="alert">
          Não foi possível salvar. Tente de novo.
        </p>
      ) : null}

      <button type="submit" className={styles.primary} disabled={!canSubmit}>
        {props.mode === "create" ? "Criar exercício" : "Salvar nome"}
      </button>
    </form>
  );
}
