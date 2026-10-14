import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is 2FA Authenticator really free?",
    a: "Yes — completely. No ads, no trackers, no premium tier, no limits on how many credentials you store. The project runs on free-tier infrastructure and is supported by donations.",
  },
  {
    q: "Where are my 2FA secrets stored?",
    a: "If you use the app without an account, your credentials are stored only in your own browser (local storage and cache) — they never leave your device. If you create an account, your secrets are encrypted with AES-256-GCM before being written to the database and are only ever decrypted server-side to compute your next code. Revealing a secret requires re-entering your account password.",
  },
  {
    q: "Which two-factor authentication types are supported?",
    a: "All the standard ones: time-based TOTP codes (SHA-1, SHA-256 and SHA-512 algorithms; 6, 7 or 8 digits; 15, 30 or 60 second periods), counter-based HOTP codes, and Steam Guard's 5-character codes. You can add credentials by pasting the setup key, scanning a QR code with your camera, or pasting an otpauth:// link.",
  },
  {
    q: "Is it safe to keep 2FA secrets in an online platform?",
    a: "We use strong encryption at rest, salted memory-hard password hashing, HTTPS everywhere and password-gated secret reveal — but you should understand that no online service can promise perfect security. Use this platform at your own risk: keep offline backups of your setup keys, and know that we accept no responsibility and make no promises or guarantees about the service.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. The app is fully functional in browser-only mode — codes are generated locally and stored in your browser. An account is optional and only adds encrypted sync across devices, plus survival if you clear your browser data.",
  },
  {
    q: "Can I move my credentials to another device or app?",
    a: "Yes. Every credential can be displayed as a standard otpauth:// QR code that any authenticator app (Google Authenticator, Authy, Aegis, 2FAS and others) can scan. You can also export your whole vault to a JSON backup file and import it back anywhere.",
  },
];

export function Faq() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <section aria-labelledby="faq-heading" className="py-14 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2
            id="faq-heading"
            className="text-2xl font-bold tracking-tight sm:text-3xl"
          >
            Frequently asked questions
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Everything people usually want to know before trusting a web
            authenticator.
          </p>
        </div>

        <Accordion type="single" collapsible className="mt-8">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-semibold sm:text-base">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </div>
    </section>
  );
}
