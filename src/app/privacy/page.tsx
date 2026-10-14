import type { Metadata } from "next";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "What 2FA Authenticator collects, how credentials are encrypted and stored, and the rights you have over your data.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "October 2026";

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8" aria-labelledby={`p-${n}`}>
      <h2 id={`p-${n}`} className="text-lg font-semibold tracking-tight">
        <span className="mr-2 text-primary">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {UPDATED} · Platform: {SITE.name} ({SITE.url})
      </p>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">
            The short version
          </p>
          <p className="mt-1.5 text-muted-foreground">
            Without an account, nothing about you ever reaches our servers.
            With an account, we store your username, a salted{" "}
            <strong>scrypt hash</strong> of your password, and your 2FA
            secrets <strong>encrypted with AES-256-GCM</strong>. We never sell
            data, run ads, or embed trackers. That said — you use this
            platform <strong>at your own risk</strong>, and it makes no
            promises; see the{" "}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Terms of Service
            </Link>
            .
          </p>
        </div>
      </div>

      <Section n="1" title="Who we are">
        <p>
          {SITE.name} is a small, free, independently operated web project by{" "}
          {SITE.author}. This policy explains what information the platform
          handles, where it lives, and the choices you control. It applies to
          the website at {SITE.url} and its API.
        </p>
      </Section>

      <Section n="2" title="Data we process — browser-only mode">
        <p>
          You can use the entire platform without an account. In that mode,
          your authenticator entries (names, issuers, setup keys, and
          settings) are written to your own browser&apos;s{" "}
          <strong>local storage</strong> and{" "}
          <strong>cache</strong> on your device. Codes are generated locally
          in your browser. No credentials, no identifiers, and no personal
          data are transmitted to our servers in this mode.
        </p>
        <p>
          Clearing your browser data for this site removes those entries
          permanently — that is the trade-off for staying anonymous, and the
          reason the app repeatedly suggests creating an account or exporting
          a backup.
        </p>
      </Section>

      <Section n="3" title="Data we process — account mode">
        <p>
          If you create an account, we store the following, and only the
          following:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Username</strong> — the name you pick. We never ask for an
            email address, phone number, or real name.
          </li>
          <li>
            <strong>Password hash</strong> — a salted scrypt derivation. Your
            plaintext password is never stored or logged.
          </li>
          <li>
            <strong>2FA credentials</strong> — each setup key is encrypted
            with AES-256-GCM using a server-side key before being written to
            the database. Names, issuers, and settings are stored alongside
            them.
          </li>
          <li>
            <strong>Timestamps</strong> — when your account and credentials
            were created or updated.
          </li>
        </ul>
        <p>
          Secrets are decrypted only in memory, server-side, to compute your
          current codes. To see a secret in your browser you must re-confirm
          your account password, and exports of all secrets require the same
          confirmation. There is no password reset — and therefore no
          &quot;account recovery&quot; path that could expose your secrets.
        </p>
      </Section>

      <Section n="4" title="Cookies and similar storage">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Session cookie</strong> — an httpOnly, signed token that
            keeps you signed in for 30 days. It contains your internal user
            id only.
          </li>
          <li>
            <strong>Theme preference</strong> — light/dark choice, stored in
            your browser.
          </li>
          <li>
            <strong>Local-mode credentials</strong> — in browser-only mode,
            stored in local storage as described above.
          </li>
        </ul>
        <p>
          We do not set advertising, analytics, or fingerprinting cookies, and
          no third-party scripts are embedded on this site.
        </p>
      </Section>

      <Section n="5" title="Server logs">
        <p>
          Our hosting providers may automatically log standard technical
          information for every HTTPS request (such as IP address, timestamp,
          and user agent) for security and abuse prevention. These logs are
          short-lived, are not used to profile you, and are governed by the
          providers&apos; own policies (see section 7).
        </p>
      </Section>

      <Section n="6" title="How we protect data">
        <p>
          Security measures include: TLS for all traffic; AES-256-GCM
          authenticated encryption for secrets at rest; salted scrypt
          password hashing; httpOnly session cookies; rate limiting on
          authentication and secret-reveal endpoints; and stateless sessions
          that keep no server-side session tables. Revealing a stored secret
          or exporting a backup always requires re-entering your password.
        </p>
        <p>
          These practices reduce but do not eliminate risk. No encryption,
          hashing, or operational discipline can guarantee that an online
          service will never be breached or lose data. As stated in the Terms,
          the platform is provided at your own risk, without responsibility
          and without promises — keep your own offline backups of setup keys.
        </p>
      </Section>

      <Section n="7" title="Third-party services">
        <p>
          The platform runs on third-party infrastructure (a serverless
          hosting provider and a managed Postgres database provider). Your
          account data lives on that infrastructure and is processed by those
          providers on our behalf. Payment links in the footer lead to an
          external payment service; any donation is processed entirely there
          and we do not receive or store payment details.
        </p>
      </Section>

      <Section n="8" title="Data sharing">
        <p>
          We do not sell, rent, or trade your data. We do not share it with
          advertisers, data brokers, or analytics firms. Data leaves our
          systems only when legally compelled, or as strictly necessary to
          operate on the third-party infrastructure described in section 7.
        </p>
      </Section>

      <Section n="9" title="Retention and deletion">
        <p>
          Browser-only data lives exactly as long as your browser keeps it —
          delete it anytime by clearing site data, or by removing individual
          credentials in the app. Account data is retained until you delete
          it: deleting your account (available in the account menu, password
          confirmation required) immediately and permanently removes your
          username, password hash, and every stored credential.
        </p>
      </Section>

      <Section n="10" title="Your rights">
        <p>
          Because we collect no personal identifiers beyond your chosen
          username, the practical rights that matter here are: access (sign
          in and view everything), portability (export a JSON backup or QR
          codes at any time), and erasure (delete individual credentials or
          the whole account instantly). If you believe any of these are not
          working, contact us via the GitHub account in the footer and it
          will be fixed.
        </p>
      </Section>

      <Section n="11" title="Children">
        <p>
          The platform is not intended for children under 13. We do not
          knowingly collect data from children under 13; if an account was
          created by one, contact us to have it removed.
        </p>
      </Section>

      <Section n="12" title="Changes to this policy">
        <p>
          This policy may be updated as the service evolves. The published
          version at this URL is the one in force. If a change materially
          affects how your data is handled, it will be reflected clearly in
          the &quot;last updated&quot; date and, where practical, in the app
          itself.
        </p>
      </Section>

      <Section n="13" title="Contact">
        <p>
          Reach out through the{" "}
          <a
            href={SITE.authorGithub}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            GitHub account
          </a>{" "}
          listed in the footer for any privacy question or request.
        </p>
      </Section>
    </div>
  );
}
