"use client";

import { useMemo } from "react";

export function scorePassword(pw: string): 0 | 1 | 2 | 3 | 4 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

const LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"] as const;
const BAR_CLASSES = [
  "bg-border",
  "bg-rose-500",
  "bg-amber-500",
  "bg-lime-500",
  "bg-emerald-500",
] as const;
const TEXT_CLASSES = [
  "text-muted-foreground",
  "text-rose-500",
  "text-amber-500",
  "text-lime-600",
  "text-emerald-600",
] as const;

export function PasswordStrength({ password }: { password: string }) {
  const score = useMemo(() => scorePassword(password), [password]);
  if (!password) return null;

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i <= score ? BAR_CLASSES[score] : "bg-border"
            }`}
          />
        ))}
      </div>
      <p className={`mt-1.5 text-xs ${TEXT_CLASSES[score]}`}>
        {LABELS[score]}
        {score < 3 && " — mix letters, numbers and symbols"}
      </p>
    </div>
  );
}
