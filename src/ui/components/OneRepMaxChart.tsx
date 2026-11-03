import { formatDate } from "@/domain/history";
import type { OneRepMaxPoint } from "@/domain/progress";
import { formatKg } from "@/ui/format";
import { LineChart } from "./LineChart";

/** The estimated 1RM trend: one point per Session, on a real time axis. */
export function OneRepMaxChart({ points }: { points: readonly OneRepMaxPoint[] }) {
  const ticks = uniqueTicks(
    [points[0], points[Math.floor((points.length - 1) / 2)], points.at(-1)]
      .filter((point): point is OneRepMaxPoint => point !== undefined)
      .map((point) => formatDate(point.at)),
  );

  return (
    <LineChart
      label="1RM estimado por sessão"
      summary={summarize(points)}
      points={points.map((point) => ({ x: point.at, y: point.value }))}
      ticks={ticks}
    />
  );
}

function uniqueTicks(labels: string[]): string[] {
  return [...new Set(labels)];
}

function summarize(points: readonly OneRepMaxPoint[]): string {
  const first = points[0];
  const last = points.at(-1);
  if (!first || !last) return "Nenhuma série entre 1 e 10 repetições no período.";
  if (points.length === 1) {
    return `1RM estimado em ${formatDate(first.at)}: ${formatKg(first.value)}.`;
  }
  return `1RM estimado em ${points.length} sessões, de ${formatDate(first.at)} (${formatKg(
    first.value,
  )}) a ${formatDate(last.at)} (${formatKg(last.value)}).`;
}
