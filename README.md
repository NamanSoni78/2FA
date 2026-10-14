# 2FA Authenticator

A free, open, web-based two-factor authentication app. Paste any TOTP/HOTP
setup key and get live codes in your browser — no phone needed. Use it
anonymously (credentials stay in your browser) or create an account to sync
securely across devices.

**Full deployment walkthrough: [`SETUP.md`](./SETUP.md)**

## Features

- **All standard 2FA types** — TOTP (SHA-1/256/512, 6–8 digits, 15/30/60s),
  counter-based HOTP, and Steam Guard's 5-character codes
- **Three ways to add** — paste the setup key, scan a QR with your camera, or
  drop in an `otpauth://` link
- **Browser-only mode** — nothing leaves your device until you opt in
- **Encrypted account sync** — secrets are AES-256-GCM encrypted before they
  touch the database; revealing one requires your password again
- **Live codes** with countdown rings; tap any card to copy
- **QR export** to move credentials to any authenticator app, plus JSON
  backup import/export
- **Dark & light themes**, fully responsive, installable (PWA manifest)
- **SEO-ready** — metadata, Open Graph image, sitemap, robots, JSON-LD

## Tech stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui ·
Neon Postgres (serverless driver) · scrypt password hashing ·
AES-256-GCM secret encryption · JWT httpOnly cookie sessions

## Local development

```bash
cp .env.example .env.local   # fill it in — or set DATABASE_URL=mock://local-dev
npm install
npm run dev
```

Run the RFC conformance tests for the OTP engine any time:

```bash
npx tsx scripts/test-totp.ts   # or: bun scripts/test-totp.ts
```

## Security notes

Passwords are stored as salted **scrypt** hashes. 2FA secrets are encrypted
at rest with **AES-256-GCM** and are only decrypted server-side to compute
codes. Sessions are stateless signed **JWTs** in httpOnly cookies. This
platform is provided **as-is, at your own risk** — see the
[Terms of Service](./src/app/terms/page.tsx) and
[Privacy Policy](./src/app/privacy/page.tsx).

## License

MIT © Naman Soni
