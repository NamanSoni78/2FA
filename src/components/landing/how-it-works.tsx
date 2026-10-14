import { ClipboardPaste, KeyRound, MousePointerClick } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardPaste,
    title: "Copy your setup key",
    text: "When enabling 2FA on any website, look for “enter key manually” or “can't scan” — copy the setup key it shows you.",
  },
  {
    icon: KeyRound,
    title: "Paste it into the vault",
    text: "Press Add authenticator, paste the key, give it a name. A live preview shows the code immediately so you can verify it matches.",
  },
  {
    icon: MousePointerClick,
    title: "Tap to copy, forever",
    text: "Codes rotate on their own with a countdown ring. Tap a card whenever a login asks for your code — it's copied.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-heading" className="scroll-mt-20 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="how-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Three steps, thirty seconds
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            From setup key to working code faster than pulling out your phone.
          </p>
        </div>

        <ol className="relative mt-10 grid gap-6 sm:grid-cols-3 sm:gap-5">
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative">
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/70 bg-card/60 p-6 text-center transition-colors hover:border-primary/30 sm:p-7">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <step.icon className="size-5" />
                </span>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                    Step {i + 1}
                  </p>
                  <h3 className="mt-1 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.text}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
