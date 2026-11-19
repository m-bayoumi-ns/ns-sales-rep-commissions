import { ChartColumnIncreasingIcon, GlobeIcon, XIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * "Odoo is not connected" diagram: Odoo ─── globe (✕) ─ ─ dashboard.
 * Data packets leave Odoo and break at the globe (they turn red and fade); the globe carries a red ✕
 * with a slow ripple; on the far side the line is dashed and dim, a faint attempt dies halfway, and
 * the dashboard waits, desaturated, with an amber "stale" dot. CSS only (no JS), smooth eased loops,
 * still when the user prefers less motion. Logical properties, so the flow runs right → left in Arabic.
 */
export function OdooOfflineDiagram({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const tile = { sm: "size-10 rounded-xl", md: "size-12 rounded-2xl", lg: "size-16 rounded-2xl sm:size-20 sm:rounded-3xl" }[size];
  const icon = { sm: "size-5", md: "size-6", lg: "size-8 sm:size-10" }[size];
  const logo = { sm: "size-6", md: "size-8", lg: "size-10 sm:size-12" }[size];
  const badge = size === "lg" ? "size-6 sm:size-7" : "size-5";
  return (
    <div aria-hidden className={cn("odoo-off flex w-full items-center", size === "lg" ? "max-w-xl" : "max-w-md", className)}>
      <style>{CSS}</style>

      {/* Odoo */}
      <span className={cn("odoo-off-node relative flex shrink-0 items-center justify-center border bg-white shadow-sm dark:bg-white/95", tile)}>
        <Image src="/brand/odoo.webp" alt="" width={64} height={64} className={cn("object-contain", logo)} />
        <span className="odoo-off-beacon absolute inset-0 rounded-[inherit]" />
      </span>

      {/* Odoo → globe: packets travel and break at the globe. */}
      <span className="relative mx-1.5 h-0.5 min-w-10 flex-1 overflow-visible rounded-full bg-gradient-to-r from-violet-400/60 to-rose-400/60 rtl:bg-gradient-to-l dark:from-violet-400/50 dark:to-rose-400/50">
        <span className="odoo-off-packet" style={{ animationDelay: "0s" }} />
        <span className="odoo-off-packet" style={{ animationDelay: "-1.1s" }} />
        <span className="odoo-off-packet" style={{ animationDelay: "-2.2s" }} />
      </span>

      {/* Globe with the ✕ */}
      <span className={cn("odoo-off-node relative flex shrink-0 items-center justify-center border bg-card text-muted-foreground shadow-sm", tile)} style={{ animationDelay: "0.08s" }}>
        <GlobeIcon className={cn("odoo-off-globe", icon)} strokeWidth={1.6} />
        <span className={cn("absolute -end-1.5 -top-1.5 flex items-center justify-center", badge)}>
          <span className="odoo-off-ripple absolute inset-0 rounded-full bg-rose-500/40" />
          <span className={cn("odoo-off-x relative flex items-center justify-center rounded-full bg-rose-600 text-white shadow-[0_0_0_2px_var(--card)]", badge)}>
            <XIcon className={size === "lg" ? "size-4" : "size-3"} strokeWidth={3} />
          </span>
        </span>
      </span>

      {/* Globe → dashboard: dashed and dim; an attempt fades out halfway. */}
      <span className="relative mx-1.5 h-0.5 min-w-10 flex-1">
        <span className="odoo-off-dash absolute inset-0" />
        <span className="odoo-off-attempt" />
      </span>

      {/* Dashboard, waiting */}
      <span className={cn("odoo-off-node relative flex shrink-0 items-center justify-center border bg-card text-primary shadow-sm", tile)} style={{ animationDelay: "0.16s" }}>
        <ChartColumnIncreasingIcon className={cn("odoo-off-dashboard", icon)} strokeWidth={1.8} />
        <span className="absolute -end-1 -top-1 flex size-3">
          <span className="odoo-off-stale absolute inset-0 rounded-full bg-amber-400/60" />
          <span className="relative size-3 rounded-full bg-amber-500 shadow-[0_0_0_2px_var(--card)]" />
        </span>
      </span>
    </div>
  );
}

/**
 * The "Odoo is not connected" screen: the animated diagram and the message, centred, alone.
 * Shown on /odoo-offline (users are sent there while the switch is on) and, smaller, as the
 * preview in Settings | General.
 */
export function OdooOfflineScreen({ title, body, badge, preview = false }: { title: string; body: string; badge: string; preview?: boolean }) {
  return (
    <section
      role="status"
      aria-labelledby={preview ? undefined : "odoo-offline-title"}
      className={cn("flex items-center justify-center px-4", preview ? "rounded-xl border bg-muted/30 py-8" : "min-h-[calc(100dvh-10rem)] py-10")}
    >
      <div className="flex w-full max-w-xl flex-col items-center gap-6 text-center">
        <OdooOfflineDiagram size={preview ? "md" : "lg"} />
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold tracking-wide text-rose-700 uppercase dark:text-rose-300">
            <span className="relative flex size-2">
              <span className="absolute inset-0 animate-ping rounded-full bg-rose-500/60 motion-reduce:animate-none" />
              <span className="relative size-2 rounded-full bg-rose-500" />
            </span>
            {badge}
          </span>
          <h1 id={preview ? undefined : "odoo-offline-title"} className={cn("font-bold", preview ? "text-lg" : "text-2xl sm:text-3xl")}>
            {title}
          </h1>
          <p className={cn("max-w-md text-muted-foreground", preview ? "text-xs" : "text-sm")}>{body}</p>
        </div>
      </div>
    </section>
  );
}

const CSS = `
.odoo-off-node { animation: odoo-off-rise .7s cubic-bezier(.2,.8,.2,1) both; }
@keyframes odoo-off-rise { from { opacity: 0; transform: translateY(6px) scale(.96); } to { opacity: 1; transform: none; } }

/* Odoo keeps sending: a soft violet glow breathing out of its tile. */
.odoo-off-beacon { box-shadow: 0 0 0 0 rgba(124, 58, 237, .35); animation: odoo-off-beacon 3.3s cubic-bezier(.4,0,.2,1) infinite; }
@keyframes odoo-off-beacon { 0% { box-shadow: 0 0 0 0 rgba(124,58,237,.35); } 70%,100% { box-shadow: 0 0 0 10px rgba(124,58,237,0); } }

/* Packets: leave Odoo violet, turn red near the globe, burst and vanish. */
.odoo-off-packet {
  position: absolute; top: 50%; inset-inline-start: 0; width: 7px; height: 7px; margin-top: -3.5px; margin-inline-start: -3.5px;
  border-radius: 9999px; background: #8b5cf6; box-shadow: 0 0 8px 1px rgba(139,92,246,.6); opacity: 0;
  animation: odoo-off-packet 3.3s cubic-bezier(.45,.05,.55,.95) infinite;
}
@keyframes odoo-off-packet {
  0%   { inset-inline-start: 0%;  opacity: 0; transform: scale(.6); }
  10%  { opacity: 1; transform: scale(1); }
  62%  { background: #8b5cf6; box-shadow: 0 0 8px 1px rgba(139,92,246,.6); }
  78%  { inset-inline-start: 88%; opacity: 1; background: #e11d48; box-shadow: 0 0 10px 2px rgba(225,29,72,.6); transform: scale(1); }
  88%  { inset-inline-start: 92%; opacity: 0; background: #e11d48; box-shadow: 0 0 14px 6px rgba(225,29,72,0); transform: scale(1.9); }
  100% { inset-inline-start: 92%; opacity: 0; }
}

/* The globe: a gentle sway; the ✕ ripples slowly. */
.odoo-off-globe { animation: odoo-off-sway 6s ease-in-out infinite; transform-origin: 50% 50%; }
@keyframes odoo-off-sway { 0%,100% { transform: rotate(-6deg); } 50% { transform: rotate(6deg); } }
.odoo-off-x { animation: odoo-off-pop .5s .35s cubic-bezier(.3,1.6,.5,1) both, odoo-off-throb 3.3s 1s ease-in-out infinite; }
@keyframes odoo-off-pop { from { transform: scale(0); } to { transform: scale(1); } }
@keyframes odoo-off-throb { 0%,72%,100% { transform: scale(1); } 80% { transform: scale(1.14); } 88% { transform: scale(.96); } }
.odoo-off-ripple { animation: odoo-off-ripple 3.3s 1s cubic-bezier(0,0,.2,1) infinite; }
@keyframes odoo-off-ripple { 0%,70% { transform: scale(1); opacity: 0; } 76% { opacity: .9; } 100% { transform: scale(2.6); opacity: 0; } }

/* Globe → dashboard: a dim dashed line drifting, and a faint attempt that never arrives. */
.odoo-off-dash {
  background-image: linear-gradient(to right, color-mix(in oklab, var(--muted-foreground) 45%, transparent) 55%, transparent 0);
  background-size: 9px 2px; background-repeat: repeat-x; border-radius: 9999px; opacity: .7;
  animation: odoo-off-dash 2.4s linear infinite;
}
@keyframes odoo-off-dash { from { background-position: 0 0; } to { background-position: 18px 0; } }
[dir="rtl"] .odoo-off-dash { animation-direction: reverse; }
.odoo-off-attempt {
  position: absolute; top: 50%; inset-inline-start: 0; width: 6px; height: 6px; margin-top: -3px; margin-inline-start: -3px;
  border-radius: 9999px; background: var(--muted-foreground); opacity: 0;
  animation: odoo-off-attempt 3.3s 1.6s ease-out infinite;
}
@keyframes odoo-off-attempt { 0% { inset-inline-start: 0%; opacity: 0; } 12% { opacity: .55; } 45% { inset-inline-start: 42%; opacity: 0; } 100% { inset-inline-start: 42%; opacity: 0; } }

/* The dashboard waits: desaturated, breathing; the amber dot pulses. */
.odoo-off-dashboard { animation: odoo-off-wait 3.3s ease-in-out infinite; }
@keyframes odoo-off-wait { 0%,100% { opacity: .45; filter: grayscale(1); } 50% { opacity: .75; filter: grayscale(.6); } }
.odoo-off-stale { animation: odoo-off-stale 2.2s cubic-bezier(0,0,.2,1) infinite; }
@keyframes odoo-off-stale { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(2.4); opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .odoo-off *, .odoo-off { animation: none !important; }
  .odoo-off-packet, .odoo-off-attempt { display: none; }
  .odoo-off-dashboard { opacity: .55; filter: grayscale(1); }
}
`;
