import { formatDate } from "@/domain/history";
import type { WeekBucket } from "@/domain/progress";
import { formatKg } from "@/ui/format";
import { LineChart } from "./LineChart";

/** Weekly volume: Monday-start buckets, zeros kept so gaps stay visible. */
export function VolumeChart({ buckets }: { buckets: readonly WeekBucket[] }) {
  const lastIndex = buckets.length - 1;
  const tickIndexes = [...new Set([0, Math.floor(lastIndex / 2), lastIndex])].filter(
    (index) => index >= 0,
  );

  return (
    <LineChart
      label="Volume por semana"
      summary={summarize(buckets)}
      points={buckets.map((bucket, index) => ({ x: index, y: bucket.volume }))}
      ticks={tickIndexes.map((index) => `Sem ${index + 1}`)}
      baseline={0}
    />
  );
}

function summarize(buckets: readonly WeekBucket[]): string {
  const total = buckets.reduce((sum, bucket) => sum + bucket.volume, 0);
  if (total === 0) return "Sem volume registrado no período.";

  const peak = buckets.reduce((highest, bucket) =>
    bucket.volume > highest.volume ? bucket : highest,
  );
  const weeks = buckets.length === 1 ? "1 semana" : `${buckets.length} semanas`;
  return `Volume por semana em ${weeks}: ${formatKg(total)} no total. Maior semana: ${formatKg(
    peak.volume,
  )}, na semana de ${formatDate(peak.start)}.`;
}
