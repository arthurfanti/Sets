import { useId } from "react";
import styles from "./LineChart.module.css";

/**
 * A small hand-rolled SVG line — no charting dependency, no gridlines, no y
 * axis. The line carries no meaning on its own, so the caller supplies a
 * plain-language summary that assistive technology reads instead of the path.
 */

export interface ChartPoint {
  /** Epoch milliseconds for a time axis, or an index for a week axis. */
  x: number;
  y: number;
}

interface LineChartProps {
  label: string;
  summary: string;
  points: readonly ChartPoint[];
  /** Up to three axis labels, left to right. */
  ticks: readonly string[];
  /** Force a zero floor for quantities where zero is meaningful. */
  baseline?: number;
}

const WIDTH = 320;
const HEIGHT = 116;
const PAD = { top: 10, right: 8, bottom: 10, left: 8 };

export function LineChart({ label, summary, points, ticks, baseline }: LineChartProps) {
  const summaryId = useId();
  const plotWidth = WIDTH - PAD.left - PAD.right;
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;

  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const rawMin = Math.min(...ys);
  const rawMax = Math.max(...ys);

  // A flat series still needs a range to sit inside. Otherwise a zero floor
  // keeps volume honest, and 1RM breathes without wasting the whole height.
  const flat = rawMin === rawMax;
  const flatPad = Math.max(1, Math.abs(rawMax) * 0.1);
  const span = rawMax - rawMin || 1;
  const low = flat ? rawMin - flatPad : (baseline ?? rawMin - span * 0.15);
  const high = flat ? rawMax + flatPad : rawMax + span * 0.15;
  const range = high - low || 1;

  const xOf = (value: number) =>
    minX === maxX
      ? PAD.left + plotWidth / 2
      : PAD.left + ((value - minX) / (maxX - minX)) * plotWidth;
  const yOf = (value: number) => PAD.top + (1 - (value - low) / range) * plotHeight;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${xOf(point.x)} ${yOf(point.y)}`)
    .join(" ");

  return (
    <figure className={styles.chart}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={label}
        aria-describedby={summaryId}
      >
        <path className={styles.line} d={path} />
        {points.map((point) => (
          <circle key={point.x} className={styles.dot} cx={xOf(point.x)} cy={yOf(point.y)} r={3} />
        ))}
      </svg>

      <p id={summaryId} className={styles.summary}>
        {summary}
      </p>

      <div className={styles.ticks} aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} className={styles.tick}>
            {tick}
          </span>
        ))}
      </div>
    </figure>
  );
}
