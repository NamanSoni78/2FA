import {
  CloudCheck,
  Database,
  KeyRound,
  Layers,
  QrCode,
  Smartphone,
  Timer,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const FEATURES = [
  {
    icon: Layers,
    title: "Every standard 2FA type",
    text: "TOTP with SHA-1, SHA-256 or SHA-512, 6–8 digit codes, 15/30/60 second refresh — plus counter-based HOTP and Steam Guard's 5-character codes.",
  },
  {
    icon: Smartphone,
    title: "Use it without an account",
    text: "Credentials are saved straight into your browser's local storage and cache. Nothing leaves your device until you decide to sync.",
  },
  {
    icon: CloudCheck,
    title: "Encrypted account sync",
    text: "Create an account and your secrets are encrypted with AES-256-GCM before they ever touch the database — then follow you to any browser.",
  },
  {
    icon: Timer,
    title: "Live codes, zero friction",
    text: "Codes rotate automatically with a live countdown ring. Tap any card and the code is on your clipboard — sized for thumbs on mobile.",
  },
  {
    icon: QrCode,
    title: "Move anywhere with QR",
    text: "Show a standard otpauth QR code to transfer a credential to your phone's authenticator — or scan QR codes straight into the vault.",
  },
  {
    icon: Database,
    title: "Backup & restore",
    text: "Export everything to a JSON backup file and import it back anytime. Local mode and account mode both support it.",
  },
];

export function Features() {
  return (
    <section aria-labelledby="features-heading" className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            id="features-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            A complete authenticator, not a toy
          </h2>
          <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything you'd expect from an authenticator app — in a tab you
            already have open.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card
              key={f.title}
              className="group border-border/70 bg-card/70 transition-all duration-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-md"
            >
              <CardContent className="p-5 sm:p-6">
                <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-200 group-hover:scale-105">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="mx-auto mt-8 flex max-w-xl items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <KeyRound className="size-3.5 shrink-0" />
          For security reasons, account secrets are only ever decrypted
          server-side to compute your next code — revealing one requires your
          password again.
        </p>
      </div>
    </section>
  );
}
