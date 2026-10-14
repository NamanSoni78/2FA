"use client";

import { KeyRound, Plus, ScanSearch, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <Card className="animate-fade-up border-dashed bg-card/60">
      <CardContent className="flex flex-col items-center gap-5 px-6 py-12 text-center sm:py-16">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound className="size-7" />
        </span>

        <div className="max-w-md space-y-1.5">
          <h3 className="text-lg font-semibold">
            No authenticators yet
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Add your first setup key and its code appears here instantly — no
            account needed. It stays in this browser unless you decide to sync.
          </p>
        </div>

        <Button
          onClick={onAdd}
          size="lg"
          className="h-12 gap-2 rounded-full px-7 text-base font-semibold shadow-md transition-transform hover:-translate-y-0.5 active:scale-[0.99]"
        >
          <Plus className="size-5" />
          Add your first authenticator
        </Button>

        <div className="grid w-full max-w-lg gap-3 pt-4 text-left sm:grid-cols-3">
          {[
            {
              icon: ScanSearch,
              title: "1 · Copy the key",
              text: "In your service's 2FA settings, choose “enter setup key”.",
            },
            {
              icon: KeyRound,
              title: "2 · Paste it here",
              text: "Give it a name — live codes start rotating immediately.",
            },
            {
              icon: ShieldCheck,
              title: "3 · Tap to copy",
              text: "Codes refresh on their own. Tap a card to copy.",
            },
          ].map((step) => (
            <div
              key={step.title}
              className="rounded-xl border border-border/70 bg-muted/30 p-3.5"
            >
              <step.icon className="size-4 text-primary" />
              <p className="mt-2 text-xs font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
