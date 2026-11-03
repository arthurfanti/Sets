import styles from "./Stepper.module.css";

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Unit shown muted beside the number, such as kg. */
  unit?: string;
  /** What zero reads as when zero is not a number, such as "—". */
  zeroLabel?: string;
  hint?: string;
}

/**
 * One number with two 48px controls. The group carries its label for assistive
 * technology and the value is announced as it changes, so the controls work
 * without sight of the screen.
 */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 99,
  step = 1,
  unit,
  zeroLabel,
  hint,
}: StepperProps) {
  const display = value === 0 && zeroLabel ? zeroLabel : String(value);

  return (
    <fieldset className={styles.stepper}>
      <legend className={styles.label}>{label}</legend>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(clamp(value - step, min, max))}
          disabled={value <= min}
          aria-label={`Diminuir ${label}`}
        >
          −
        </button>
        <span className={styles.value} aria-live="polite">
          {display}
          {unit && value !== 0 ? <span className={styles.unit}>{unit}</span> : null}
        </span>
        <button
          type="button"
          className={styles.button}
          onClick={() => onChange(clamp(value + step, min, max))}
          disabled={value >= max}
          aria-label={`Aumentar ${label}`}
        >
          +
        </button>
      </div>
      {hint ? <span className={styles.hint}>{hint}</span> : null}
    </fieldset>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value * 10) / 10));
}
