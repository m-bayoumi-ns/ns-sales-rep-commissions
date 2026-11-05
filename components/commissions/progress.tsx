import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/format";

/** Colour of an achievement: green from 100 %, amber from 70 %, red below (status colours only). */
export function achievementTone(value: number | null | undefined): "success" | "warning" | "destructive" | "muted" {
  if (value == null) return "muted";
  if (value >= 100) return "success";
  if (value >= 70) return "warning";
  return "destructive";
}

const STROKE: Record<ReturnType<typeof achievementTone>, string> = {
  success: "var(--success)",
  warning: "var(--warning)",
  destructive: "var(--destructive)",
  muted: "var(--muted-foreground)",
};

/**
 * Achievement ring: the solid arc is achieved so far, the faint arc the month-end projection
 * (straight line from the days elapsed). Above 100 % the ring is full.
 */
export function ProgressRing({
  value,
  projected,
  size = 112,
  stroke = 10,
  label,
  center,
  sub,
}: {
  value: number | null;
  projected?: number | null;
  size?: number;
  stroke?: number;
  label: string;
  center?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamp = (v: number | null | undefined) => Math.max(0, Math.min(100, v ?? 0));
  const tone = achievementTone(value);
  const color = STROKE[tone];
  return (
    <figure className="flex flex-col items-center gap-2" aria-label={`${label}: ${formatPercent(value)}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
          {projected != null && projected > (value ?? 0) ? (
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeOpacity={0.22}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={`${(clamp(projected) / 100) * circumference} ${circumference}`}
            />
          ) : null}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={`${(clamp(value) / 100) * circumference} ${circumference}`}
            style={{ transition: "stroke-dasharray 900ms cubic-bezier(.2,.8,.2,1)" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {center ?? (
            <span dir="ltr" className="text-xl font-bold tabular-nums">
              {formatPercent(value)}
            </span>
          )}
        </div>
      </div>
      <figcaption className="flex flex-col items-center text-center">
        <span className="text-sm font-semibold">{label}</span>
        {sub ? <span className="text-xs text-muted-foreground">{sub}</span> : null}
      </figcaption>
    </figure>
  );
}

/** Thin horizontal progress bar with an optional projection tick and a 100 % mark. */
export function ProgressBar({ value, projected, className }: { value: number | null; projected?: number | null; className?: string }) {
  const tone = achievementTone(value);
  const max = Math.max(100, value ?? 0, projected ?? 0);
  const width = (v: number | null | undefined) => `${(100 * Math.max(0, v ?? 0)) / max}%`;
  return (
    <div className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)} dir="ltr">
      {projected != null ? <div className="absolute inset-y-0 start-0 rounded-full opacity-25" style={{ width: width(projected), background: STROKE[tone] }} /> : null}
      <div className="absolute inset-y-0 start-0 rounded-full transition-[width] duration-700" style={{ width: width(value), background: STROKE[tone] }} />
      {max > 100 ? <div className="absolute inset-y-0 w-px bg-foreground/40" style={{ left: `${10000 / max}%` }} /> : null}
    </div>
  );
}
