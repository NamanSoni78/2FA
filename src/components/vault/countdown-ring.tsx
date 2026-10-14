"use client";

import { cn } from "@/lib/utils";

/** Circular countdown ring for TOTP credentials. */
export function CountdownRing({
  remaining,
  period,
  className,
}: {
  remaining: number;
  period: number;
  className?: string;
}) {
  const safePeriod = Math.max(1, period);
  const pct = Math.max(0, Math.min(1, remaining / safePeriod));
  const r = 15.5;
  const c = 2 * Math.PI * r;
  const danger = remaining <= 5;

  return (
    <div
      className={cn("relative size-10 shrink-0", className)}
      role="timer"
      aria-label={`${remaining} seconds until the code refreshes`}
    >
      <svg viewBox="0 0 40 40" className="size-10 -rotate-90">
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="3.5"
          className="text-border"
          stroke="currentColor"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          strokeWidth="3.5"
          strokeLinecap="round"
          stroke="currentColor"
          className={cn(
            "transition-[stroke-dashoffset] duration-1000 ease-linear",
            danger ? "text-amber-500" : "text-primary",
          )}
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <span
        className={cn(
          "code-digits absolute inset-0 flex items-center justify-center font-mono text-[11px] font-semibold",
          danger ? "text-amber-500" : "text-muted-foreground",
        )}
      >
        {remaining}
      </span>
    </div>
  );
}
