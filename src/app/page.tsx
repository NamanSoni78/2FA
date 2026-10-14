import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { Faq } from "@/components/landing/faq";
import { Vault } from "@/components/vault/vault";
import { SITE } from "@/lib/constants";

const webAppJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE.name,
  url: SITE.url,
  applicationCategory: "SecurityApplication",
  operatingSystem: "Any (web browser)",
  description: SITE.description,
  isAccessibleForFree: true,
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: SITE.author,
    url: SITE.authorGithub,
  },
  featureList: [
    "TOTP code generation (SHA-1, SHA-256, SHA-512)",
    "HOTP counter-based codes",
    "Steam Guard 5-character codes",
    "Browser-only mode with no account",
    "Encrypted account sync (AES-256-GCM)",
    "QR code import and export",
    "JSON backup and restore",
    "Dark and light themes",
  ],
};

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <Hero />
      <Vault />
      <HowItWorks />
      <Features />
      <Faq />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
    </div>
  );
}
