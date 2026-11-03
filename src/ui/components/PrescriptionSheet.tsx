import type { Prescription } from "@/domain";
import styles from "./PrescriptionSheet.module.css";
import { Sheet } from "./Sheet";
import { Stepper } from "./Stepper";

interface PrescriptionSheetProps {
  exerciseName: string;
  prescription: Prescription;
  index: number;
  count: number;
  onChange: (prescription: Prescription) => void;
  onMove: (to: number) => void;
  onClose: () => void;
}

/**
 * What one Exercise prescribes inside a Routine. Every change lands in the
 * editor's draft immediately, so "Pronto" only closes the sheet; the routine
 * itself is written by the editor's Salvar.
 */
export function PrescriptionSheet({
  exerciseName,
  prescription,
  index,
  count,
  onChange,
  onMove,
  onClose,
}: PrescriptionSheetProps) {
  // A forked Built-in may prescribe a range such as "6-10". The stepper starts
  // at its lower bound, and any adjustment turns the range into one number.
  const reps =
    typeof prescription.reps === "number" ? prescription.reps : parseStart(prescription.reps);
  const weight = prescription.weight ?? 0;

  return (
    <Sheet
      title={exerciseName}
      onClose={onClose}
      footer={
        <button type="button" className={styles.primary} onClick={onClose}>
          Pronto
        </button>
      }
    >
      <div className={styles.stack}>
        <Stepper
          label="Séries"
          value={prescription.sets}
          min={1}
          max={20}
          onChange={(sets) => onChange({ ...prescription, sets })}
        />
        <Stepper
          label="Reps"
          value={reps}
          min={1}
          max={50}
          onChange={(value) => onChange({ ...prescription, reps: value })}
          hint={typeof prescription.reps === "string" ? `faixa atual: ${prescription.reps}` : ""}
        />
        <Stepper
          label="Carga"
          value={weight}
          min={0}
          max={500}
          step={2.5}
          unit="kg"
          zeroLabel="—"
          onChange={(value) => onChange(withWeight(prescription, value))}
          hint="Opcional"
        />

        <div className={styles.move}>
          <button
            type="button"
            className={styles.moveButton}
            disabled={index === 0}
            onClick={() => onMove(index - 1)}
          >
            Mover para cima
          </button>
          <button
            type="button"
            className={styles.moveButton}
            disabled={index === count - 1}
            onClick={() => onMove(index + 1)}
          >
            Mover para baixo
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function parseStart(reps: string): number {
  const start = Number.parseInt(reps, 10);
  return Number.isFinite(start) ? start : 1;
}

/** Zero carga is "no target", which is the absence of the field, not a 0. */
function withWeight(prescription: Prescription, weight: number): Prescription {
  const next: Prescription = {
    exerciseId: prescription.exerciseId,
    sets: prescription.sets,
    reps: prescription.reps,
  };
  if (weight > 0) next.weight = weight;
  return next;
}
