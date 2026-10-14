"use client";

import { useEffect, useState } from "react";
import { ArrowDown, Check, Copy, MousePointerClick, Sparkles, Timer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CountdownRing } from "@/components/vault/countdown-ring";
import { DEMO_SECRET } from "@/lib/constants";
import { generateCode, secondsRemaining, splitCodeForDisplay } from "@/lib/totp";

export function Hero() {
  const [code, setCode] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const tick = async () => {
      const g = await generateCode({ secret: DEMO_SECRET });
      if (mounted) setCode(g.code);
    };
    void tick();
    const t1 = setInterval(() => void tick(), 1000);
    const t2 = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      mounted = false;
      clearInterval(t1);
      clearInterval(t2);
    };
  }, []);

  const remaining = secondsRemaining(now, 30);

  async function copyDemo() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
      toast.success("That's the experience — one tap, code copied.");
    } catch {
      /* clipboard may be blocked — ignore */
    }
  }

  return (
    <section className="relative overflow-hidden pb-12 pt-12 sm:pb-16 sm:pt-20">
      <div className="hero-backdrop pointer-events-none absolute inset-0" aria-hidden="true" />

      <div className="relative mx-auto max-w-3xl px-1 text-center">
        <Badge
          variant="secondary"
          className="mx-auto gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-3.5 py-1.5 text-xs font-semibold text-primary"
        >
          <Sparkles className="size-3.5" />
          Free · No ads · No tracking
        </Badge>

        <h1 className="mt-6 text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
          Your two-factor codes,{" "}
          <span className="text-gradient">right in your browser.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          Paste any TOTP or HOTP setup key and watch live codes appear instantly
          — no phone needed. Keep everything on your device, or create an
          account to sync it securely everywhere.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            size="lg"
            onClick={() =>
              document.getElementById("vault")?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-12 w-full max-w-xs gap-2 rounded-full px-8 text-base font-semibold shadow-md transition-transform hover:-translate-y-0.5 active:scale-[0.99] sm:w-auto"
          >
            Start using it — free
            <ArrowDown className="size-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() =>
              document.getElementById("how")?.scrollIntoView({ behavior: "smooth" })
            }
            className="h-12 w-full max-w-xs rounded-full px-8 text-base font-medium sm:w-auto"
          >
            How it works
          </Button>
        </div>

        {/* Live rotating demo card */}
        <div className="mx-auto mt-10 max-w-sm">
          <button
            type="button"
            onClick={() => void copyDemo()}
            aria-label="Copy the live demo code"
            className="glow-ring group mx-auto flex w-full items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-card px-5 py-4 text-left outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Timer className="size-3" />
                Live demo — tap to copy
              </span>
              <span className="code-digits mt-1 block font-mono text-3xl font-semibold leading-none tracking-[0.08em]">
                {code ? splitCodeForDisplay(code) : "· · ·  · · ·"}
              </span>
            </span>
            <span className="flex items-center gap-2.5">
              {copied ? (
                <Check className="size-4 text-primary" aria-hidden="true" />
              ) : (
                <Copy
                  className="size-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground"
                  aria-hidden="true"
                />
              )}
              <CountdownRing remaining={remaining} period={30} />
            </span>
          </button>
          <p className="mt-2.5 text-center text-xs text-muted-foreground">
            A real code rotating every 30 seconds — yours will look exactly
            like this.
          </p>
        </div>

        <ul className="mx-auto mt-8 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          {[
            "AES-256-GCM encrypted at rest",
            "scrypt-hashed passwords",
            "Zero third-party trackers",
          ].map((t) => (
            <li key={t} className="flex items-center gap-1.5">
              <Check className="size-3.5 text-primary" aria-hidden="true" />
              {t}
            </li>
          ))}
        </ul>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <MousePointerClick className="size-3.5" aria-hidden="true" />
          Works on desktop and mobile — install it as your web authenticator.
        </p>
      </div>
    </section>
  );
}
