import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { listExercises } from "@/db/repositories";
import { createRoutine, deleteRoutine, forkName, getRoutine, saveRoutine } from "@/db/routines";
import type { Exercise, Prescription, Routine } from "@/domain";
import { moveItem } from "@/domain/order";
import { ExercisePicker } from "@/ui/components/ExercisePicker";
import { PrescriptionSheet } from "@/ui/components/PrescriptionSheet";
import styles from "./RoutineEditorScreen.module.css";

interface DraftRow {
  /** Stable across reorders, so a row keeps its identity when it moves. */
  key: string;
  prescription: Prescription;
}

interface Draft {
  id: string | null;
  name: string;
  rows: DraftRow[];
  /** Set when the draft began as a Built-in: saving forks instead of writing. */
  forkedFrom: Routine | null;
}

function toRows(prescriptions: readonly Prescription[]): DraftRow[] {
  return prescriptions.map((prescription) => ({
    key: crypto.randomUUID(),
    prescription,
  }));
}

/**
 * Writing a Routine: a name, an ordered list of Exercises with what each
 * prescribes, and one primary action that writes it.
 *
 * A Built-in Routine is never written. Opening one loads a draft marked
 * `forkedFrom`, and Salvar creates a User Routine from it — the seed stays the
 * seed (ADR-0003).
 */
export function RoutineEditorScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "nova";

  const [draft, setDraft] = useState<Draft | null>(null);
  const [exercises, setExercises] = useState<Map<string, Exercise>>(new Map());
  const [missing, setMissing] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [deleteFailed, setDeleteFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [picking, setPicking] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const refreshExercises = useCallback(async () => {
    const rows = await listExercises();
    setExercises(new Map(rows.map((exercise) => [exercise.id, exercise])));
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const rows = await listExercises();
      if (cancelled) return;
      setExercises(new Map(rows.map((exercise) => [exercise.id, exercise])));

      if (isNew) {
        setDraft({ id: null, name: "", rows: [], forkedFrom: null });
        return;
      }

      const routine = await getRoutine(id ?? "");
      if (cancelled) return;
      if (!routine) {
        setMissing(true);
        return;
      }
      setDraft({
        id: routine.id,
        name: routine.name,
        rows: toRows(routine.prescriptions),
        forkedFrom: routine.source === "builtin" ? routine : null,
      });
    })().catch(() => {
      if (!cancelled) setLoadFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  if (loadFailed) {
    return (
      <main className={styles.screen}>
        <p className={styles.message}>Não foi possível abrir a rotina.</p>
        <BackLink />
      </main>
    );
  }

  if (missing) {
    return (
      <main className={styles.screen}>
        <p className={styles.message}>Rotina não encontrada.</p>
        <BackLink />
      </main>
    );
  }

  if (draft === null) {
    return (
      <main className={styles.screen}>
        <p className={styles.message}>Carregando…</p>
      </main>
    );
  }

  const name = draft.name.trim();
  const valid = name.length > 0 && draft.rows.length > 0;
  const canDelete = draft.id !== null && draft.forkedFrom === null;

  function updatePrescription(index: number, next: Prescription) {
    setDraft((current) =>
      current === null
        ? current
        : {
            ...current,
            rows: current.rows.map((row, at) =>
              at === index ? { ...row, prescription: next } : row,
            ),
          },
    );
  }

  function movePrescription(from: number, to: number) {
    setDraft((current) =>
      current === null ? current : { ...current, rows: moveItem(current.rows, from, to) },
    );
  }

  function removePrescription(index: number) {
    setDraft((current) =>
      current === null
        ? current
        : { ...current, rows: current.rows.filter((_, at) => at !== index) },
    );
  }

  function addExercise(exercise: Exercise) {
    setDraft((current) =>
      current === null
        ? current
        : {
            ...current,
            rows: [
              ...current.rows,
              {
                key: crypto.randomUUID(),
                prescription: { exerciseId: exercise.id, sets: 3, reps: 10 },
              },
            ],
          },
    );
    setPicking(false);
  }

  async function save() {
    if (!valid || draft === null) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      if (draft.forkedFrom) {
        await createRoutine({
          name: name === draft.forkedFrom.name ? forkName(name) : name,
          prescriptions: draft.rows.map((row) => row.prescription),
        });
      } else if (draft.id) {
        await saveRoutine({
          id: draft.id,
          name,
          prescriptions: draft.rows.map((row) => row.prescription),
          source: "user",
        });
      } else {
        await createRoutine({ name, prescriptions: draft.rows.map((row) => row.prescription) });
      }
      navigate("/");
    } catch {
      setSaving(false);
      setSaveFailed(true);
    }
  }

  async function remove() {
    if (draft === null || draft.id === null) return;
    setDeleteFailed(false);
    try {
      await deleteRoutine(draft.id);
      navigate("/");
    } catch {
      setDeleteFailed(true);
    }
  }

  return (
    <EditorShell onSave={() => void save()} canSave={valid && !saving}>
      <div className={styles.body}>
        {draft.forkedFrom ? (
          <p className={styles.note}>Rotina pronta. Salvar cria uma rotina sua.</p>
        ) : null}

        <label className={styles.nameField}>
          <span className={styles.label}>Nome</span>
          <input
            className={styles.nameInput}
            value={draft.name}
            maxLength={60}
            placeholder="Nome da rotina"
            aria-label="Nome da rotina"
            onChange={(event) => {
              const typed = event.currentTarget.value;
              setDraft((current) => (current === null ? current : { ...current, name: typed }));
            }}
          />
        </label>

        {draft.rows.length === 0 ? (
          <p className={styles.empty}>Nenhum exercício ainda.</p>
        ) : (
          <ul className={styles.list}>
            {draft.rows.map((row, index) => (
              <PrescriptionRow
                key={row.key}
                prescription={row.prescription}
                exercise={exercises.get(row.prescription.exerciseId)}
                index={index}
                count={draft.rows.length}
                onEdit={() => setEditing(index)}
                onRemove={() => removePrescription(index)}
                onMove={(to) => movePrescription(index, to)}
              />
            ))}
          </ul>
        )}

        <button type="button" className={styles.add} onClick={() => setPicking(true)}>
          + Adicionar exercício
        </button>

        {canDelete ? (
          confirmingDelete ? (
            <div className={styles.confirm}>
              <p className={styles.confirmText}>
                Excluir «{draft.name}»? As sessões já registradas não mudam.
              </p>
              <button type="button" className={styles.danger} onClick={() => void remove()}>
                Excluir
              </button>
              <button
                type="button"
                className={styles.secondary}
                onClick={() => setConfirmingDelete(false)}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              className={styles.delete}
              onClick={() => setConfirmingDelete(true)}
            >
              Excluir rotina
            </button>
          )
        ) : null}

        {saveFailed ? (
          <p className={styles.message} role="alert">
            Não foi possível salvar. Tente de novo.
          </p>
        ) : null}

        {deleteFailed ? (
          <p className={styles.message} role="alert">
            Não foi possível excluir. Tente de novo.
          </p>
        ) : null}
      </div>

      {picking ? (
        <ExercisePicker
          onPick={addExercise}
          onClose={() => setPicking(false)}
          onExercisesChanged={() => void refreshExercises()}
        />
      ) : null}

      {editing !== null && draft.rows[editing] ? (
        <PrescriptionSheet
          exerciseName={
            exercises.get(draft.rows[editing].prescription.exerciseId)?.name ??
            draft.rows[editing].prescription.exerciseId
          }
          prescription={draft.rows[editing].prescription}
          index={editing}
          count={draft.rows.length}
          onChange={(next) => updatePrescription(editing, next)}
          onMove={(to) => {
            movePrescription(editing, to);
            setEditing(to);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </EditorShell>
  );
}

interface PrescriptionRowProps {
  prescription: Prescription;
  exercise: Exercise | undefined;
  index: number;
  count: number;
  onEdit: () => void;
  onRemove: () => void;
  onMove: (to: number) => void;
}

function PrescriptionRow({
  prescription,
  exercise,
  index,
  count,
  onEdit,
  onRemove,
  onMove,
}: PrescriptionRowProps) {
  const drag = useRef<{ index: number; pointerId: number } | null>(null);
  const label = exercise?.name ?? prescription.exerciseId;

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { index, pointerId: event.pointerId };
  }

  function trackDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current) return;
    const over = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-row-index]");
    const target = over ? Number(over.dataset.rowIndex) : Number.NaN;
    if (Number.isNaN(target) || target === current.index) return;
    onMove(target);
    drag.current = { index: target, pointerId: current.pointerId };
  }

  function endDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!drag.current) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  }

  return (
    <li className={styles.row} data-row-index={index}>
      <button
        type="button"
        className={styles.handle}
        aria-label={`Reordenar ${label}`}
        onPointerDown={startDrag}
        onPointerMove={trackDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
          event.preventDefault();
          onMove(index + (event.key === "ArrowUp" ? -1 : 1));
        }}
        disabled={count < 2}
      >
        <span className={styles.handleDots} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </span>
      </button>

      <button
        type="button"
        className={styles.rowBody}
        onClick={onEdit}
        aria-label={`Editar ${label}`}
      >
        <span className={styles.exerciseName}>{label}</span>
        <span className={styles.prescription}>{describe(prescription)}</span>
      </button>

      <button
        type="button"
        className={styles.remove}
        onClick={onRemove}
        aria-label={`Remover ${label}`}
      >
        ×
      </button>
    </li>
  );
}

function describe(prescription: Prescription): string {
  const parts = [`${prescription.sets} séries`, `${prescription.reps} reps`];
  if (prescription.weight !== undefined) parts.push(`${prescription.weight} kg`);
  return parts.join(" · ");
}

function EditorShell({
  children,
  canSave,
  onSave,
}: {
  children: ReactNode;
  canSave: boolean;
  onSave: () => void;
}) {
  return (
    <main className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.cancel}>
          Cancelar
        </Link>
        <h1 className={styles.title}>Rotina</h1>
        <span className={styles.spacer} />
      </header>
      {children}
      <footer className={styles.footer}>
        <button type="button" className={styles.primary} disabled={!canSave} onClick={onSave}>
          Salvar rotina
        </button>
        {canSave ? null : (
          <p className={styles.footerHint}>Dê um nome e adicione ao menos um exercício.</p>
        )}
      </footer>
    </main>
  );
}

function BackLink() {
  return (
    <Link to="/" className={styles.cancel}>
      Voltar para as rotinas
    </Link>
  );
}
