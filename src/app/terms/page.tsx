import type { Metadata } from "next";
import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "The terms that govern your use of 2FA Authenticator — including the at-your-own-risk notice, limitation of liability, and account rules.",
  alternates: { canonical: "/terms" },
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
    <section className="mt-8" aria-labelledby={`t-${n}`}>
      <h2 id={`t-${n}`} className="text-lg font-semibold tracking-tight">
        <span className="mr-2 text-primary">{n}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Legal
      </p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated: {UPDATED} · Platform: {SITE.name} ({SITE.url})
      </p>

      <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 sm:p-5">
        <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-500" />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold text-amber-600 dark:text-amber-400">
            Read this before you rely on this platform
          </p>
          <p className="mt-1.5 text-muted-foreground">
            This platform is provided strictly <strong>as-is</strong> and{" "}
            <strong>at your own risk</strong>. You are solely responsible for
            any 2FA secrets you store here and for keeping your own backups.
            The platform accepts <strong>no responsibility</strong> for any
            loss, lockout, or damage, and makes <strong>no promises or
            guarantees</strong> of any kind — including availability,
            accuracy, or fitness for any purpose.
          </p>
        </div>
      </div>

      <Section n="1" title="Acceptance of these terms">
        <p>
          By accessing or using {SITE.name} (the &quot;platform&quot;,
          &quot;service&quot;, or &quot;we&quot;/&quot;us&quot;), you agree to
          be bound by these Terms of Service (&quot;Terms&quot;). If you do
          not agree with any part of the Terms, you must stop using the
          platform and delete any data you have stored with it. The Terms
          apply equally to account-based usage and to anonymous browser-only
          usage.
        </p>
        <p>
          These Terms may be updated from time to time. The version in force
          is the one published at this URL at the time you use the service.
          Material changes, where practical, will be reflected in the
          &quot;last updated&quot; date above.
        </p>
      </Section>

      <Section n="2" title="What the platform is">
        <p>
          {SITE.name} is a free, web-based two-factor authentication (2FA)
          code generator. It lets you store TOTP/HOTP setup keys and displays
          the resulting one-time codes. In browser-only mode, credentials are
          saved in your own browser&apos;s local storage and never leave your
          device. In account mode, credentials are stored — encrypted with
          AES-256-GCM — on our infrastructure so they can sync across your
          devices.
        </p>
        <p>
          The platform is an independent tool. It is not affiliated with, or
          endorsed by, any of the services whose 2FA keys you may store in it.
        </p>
      </Section>

      <Section n="3" title="Use at your own risk — no warranty">
        <p>
          The platform is provided <strong>&quot;as is&quot;</strong> and{" "}
          <strong>&quot;as available&quot;</strong>, without warranties of any
          kind, whether express or implied. To the fullest extent permitted by
          law, we disclaim all implied warranties, including merchantability,
          fitness for a particular purpose, and non-infringement.
        </p>
        <p>
          We do not warrant that the service will be available at any
          particular time, that codes will always be correct or timely, that
          data will never be lost or corrupted, or that the service is free of
          bugs or security flaws. Online services can fail, databases can be
          lost, accounts can be compromised. You use this platform entirely{" "}
          <strong>at your own risk</strong>.
        </p>
        <p>
          You are strongly encouraged to keep your original setup keys and
          recovery codes somewhere safe outside this platform, so that you can
          always regain access to your accounts if this service becomes
          unavailable, if your stored data is lost, or if you lose your
          account password.
        </p>
      </Section>

      <Section n="4" title="No responsibility — limitation of liability">
        <p>
          To the maximum extent permitted by applicable law, the operator of
          this platform shall have <strong>no responsibility or liability</strong>{" "}
          to you or anyone else for any damages arising out of or relating to
          your use of (or inability to use) the platform, including but not
          limited to:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Being locked out of any account whose 2FA secret was stored here;</li>
          <li>Loss, corruption, theft, or disclosure of stored credentials or other data;</li>
          <li>Any direct, indirect, incidental, special, or consequential damages;</li>
          <li>Financial losses, business losses, or loss of data or profits;</li>
          <li>Any harm resulting from your own password choices or sharing of secrets.</li>
        </ul>
        <p>
          Because the service is provided free of charge, we owe no duty of
          data recovery, no duty of backup, and no duty of uninterrupted
          service. If the service terminates, is deleted, or its data is lost
          — for any reason — that loss is yours to bear. Nothing here creates
          any obligation for us to restore anything.
        </p>
      </Section>

      <Section n="5" title="No promises or guarantees">
        <p>
          Nothing about this platform constitutes a promise, guarantee, or
          commitment of any kind. Descriptions of features, security measures,
          or availability are informational statements about the current state
          of the service, not contractual promises. Features may be added,
          changed, suspended, or removed at any time without notice, and the
          entire service may be discontinued at any time.
        </p>
        <p>
          Any statements about security (such as encryption at rest or
          password hashing) describe our practices, not an assurance that the
          platform is or will remain impenetrable. No online service can
          promise perfect security, and we do not.
        </p>
      </Section>

      <Section n="6" title="Your account">
        <p>
          Accounts use only a username and a password you choose. There is no
          email verification and no password recovery. If you forget your
          password, your account data cannot be recovered by us — this is a
          deliberate design choice to minimize the data the platform holds
          about you. You are solely responsible for remembering your
          credentials and for keeping them private.
        </p>
        <p>
          You may delete your account at any time from the account menu.
          Deletion is immediate and removes your username, password hash, and
          every stored credential permanently.
        </p>
      </Section>

      <Section n="7" title="Your content">
        <p>
          The setup keys, names, and settings you store remain yours. You
          grant us only the limited technical right to store and process that
          content for the sole purpose of operating the service for you. We
          do not claim ownership of your credentials, do not read them for any
          purpose other than computing your codes, and do not share them with
          third parties.
        </p>
      </Section>

      <Section n="8" title="Acceptable use">
        <p>
          You agree not to use the platform to break any law, not to attack
          or probe the service or its infrastructure, not to abuse rate
          limits, not to attempt to access other users&apos; data, and not to
          store content you have no right to store. We may block abusive
          traffic or delete accounts that violate these rules.
        </p>
      </Section>

      <Section n="9" title="Free service and donations">
        <p>
          The platform is free. There is no paid tier and no functional limit
          imposed on free usage. Donations are voluntary, do not purchase any
          service or priority, and are non-refundable once processed by the
          payment provider.
        </p>
      </Section>

      <Section n="10" title="Third-party infrastructure">
        <p>
          The platform runs on third-party hosting and database providers.
          Their availability, outages, and data-handling practices are outside
          our control, and their own terms apply to the underlying
          infrastructure. Your use of the platform is also subject to our{" "}
          <Link href="/privacy" className="font-medium text-primary underline-offset-4 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </Section>

      <Section n="11" title="Termination">
        <p>
          You may stop using the platform at any time and delete your account
          and local data. We may suspend or discontinue the service, or block
          specific abusive usage, at any time and for any reason, without
          notice and without liability, as described in sections 3–5.
        </p>
      </Section>

      <Section n="12" title="Age requirement">
        <p>
          The platform is not directed at children under 13. If you are under
          13, do not create an account or store credentials here. If you
          become aware of an account held by a child under 13, contact us so
          it can be removed.
        </p>
      </Section>

      <Section n="13" title="Governing law">
        <p>
          These Terms are governed by the laws of India, and any dispute
          arising from them shall be subject to the exclusive jurisdiction of
          the competent courts of India, without regard to conflict-of-law
          rules.
        </p>
      </Section>

      <Section n="14" title="Contact">
        <p>
          Questions about these Terms can be raised through the{" "}
          <a
            href={SITE.authorGithub}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            GitHub account
          </a>{" "}
          listed in the footer of this site.
        </p>
      </Section>
    </div>
  );
}
