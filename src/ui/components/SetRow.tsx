import { useState } from "react";
import styles from "./SetRow.module.css";

export interface SetRowProps {
  /** One-based position of the Set within its Exercise block. */
  position: number;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  /** True while the values are a suggestion, not something the Lifter typed. */
  prefilled: boolean;
  active: boolean;
  confirmed: boolean;
  onConfirm?: (weight: number, reps: number) => void | Promise<void>;
}

/** Accepts a comma or a dot as the decimal separator. */
export function parseWeight(text: string): number | null {
  const normalized = text.trim().replace(",", ".");
  if (normalized === "") return null;
  const value = Number(normalized);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseReps(text: string): number | null {
  const value = Number(text.trim());
  return Number.isInteger(value) && value > 0 ? value : null;
}

function toText(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

/**
 * One Set slot. A suggestion renders muted and becomes full contrast as soon
 * as the Lifter types into it; a confirmed Set is read-only and carries the
 * check. The row is a plain control — the parent decides which slot is live.
 */
export function SetRow({
  position,
  exerciseName,
  weight,
  reps,
  prefilled,
  active,
  confirmed,
  onConfirm,
}: SetRowProps) {
  const [weightText, setWeightText] = useState(() => toText(weight));
  const [repsText, setRepsText] = useState(() => toText(reps));
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);

  const weightLabel = `Carga da série ${position} de ${exerciseName}`;
  const repsLabel = `Repetições da série ${position} de ${exerciseName}`;
  const confirmLabel = `Confirmar série ${position} de ${exerciseName}`;

  const muted = prefilled && !edited && !confirmed;
  const parsedWeight = parseWeight(weightText);
  const parsedReps = parseReps(repsText);
  const canConfirm =
    !confirmed &&
    !saving &&
    parsedWeight !== null &&
    parsedReps !== null &&
    onConfirm !== undefined;

  async function confirm() {
    if (!canConfirm || parsedWeight === null || parsedReps === null) return;
    setSaving(true);
    try {
      await onConfirm?.(parsedWeight, parsedReps);
    } finally {
      setSaving(false);
    }
  }

  return (
    <li className={styles.row} data-active={active} data-confirmed={confirmed}>
      <span className={styles.index} aria-hidden="true">
        {position}
      </span>

      <div className={styles.values}>
        <input
          aria-label={weightLabel}
          className={styles.weight}
          data-muted={muted}
          inputMode="decimal"
          readOnly={confirmed || saving}
          type="text"
          value={weightText}
          onChange={(event) => {
            setWeightText(event.target.value);
            setEdited(true);
          }}
        />
        <span className={styles.unit} aria-hidden="true">
          kg
        </span>
        <span className={styles.times} aria-hidden="true">
          ×
        </span>
        <input
          aria-label={repsLabel}
          className={styles.reps}
          data-muted={muted}
          inputMode="numeric"
          readOnly={confirmed || saving}
          type="text"
          value={repsText}
          onChange={(event) => {
            setRepsText(event.target.value);
            setEdited(true);
          }}
        />
      </div>

      <button
        aria-label={confirmLabel}
        aria-pressed={confirmed}
        className={styles.confirm}
        disabled={!canConfirm}
        type="button"
        onClick={confirm}
      >
        <span aria-hidden="true">✓</span>
      </button>
    </li>
  );
}
