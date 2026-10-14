# SETUP — Deploying 2FA Authenticator to `2fa.namansoni.in`

This guide takes you from zero to a live site on Vercel (free Hobby plan)
with a Neon Postgres free-tier database. Total time: **~15 minutes**.

The whole stack runs on free tiers — no credit card needed anywhere.

```
Browser ──HTTPS──> Vercel (Next.js, free Hobby plan) ──pooled HTTPS──> Neon Postgres (free tier)
                       │                                        (AES-256-GCM encrypted secrets)
                       └─ static assets, SEO, QR generation all happen at the edge
```

## What's in this package

| Path | Purpose |
|---|---|
| `src/` | The complete application (App Router pages, API routes, components, libs) |
| `db/schema.sql` | SQL that creates the two tables the app expects |
| `2fa-neon-db-setup.ipynb` | Colab notebook that sets up the database + generates your keys |
| `.env.example` | Documentation of every environment variable |
| `scripts/test-totp.ts` | RFC 4226/6238 conformance tests for the OTP engine |
| `SETUP.md` | This file |

---

## Step 0 — Prerequisites

- A **GitHub** account (to store the code and let Vercel deploy from it)
- A **Vercel** account — <https://vercel.com/signup> (choose the free Hobby plan)
- A **Neon** account — <https://neon.tech/signup> (free plan)
- That's it. Node.js is only needed if you want to run locally.

---

## Step 1 — Create the Neon database

1. Log in to <https://console.neon.tech>.
2. **Create a project** — name it anything, e.g. `2fa-authenticator`. Pick the
   region closest to your users (for India, try Singapore).
3. When the project opens, you land on the **Dashboard**. Find the
   **Connection string** panel (or click **Connect** in the sidebar).
4. Copy the **pooled** connection string:
   - Click the **"Connection pooling"** / **"Use pooled connection"** toggle —
     the host in the URL changes to include **`-pooler`**:
     ```
     postgresql://USER:PASSWORD@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
     ```
   - ⚠️ Use the **pooled** (`-pooler`) string. The app talks to Neon over
     HTTP through Neon's connection pooler — it's what keeps the free tier
     happy (no idle connections, one round-trip per query).

Save that string somewhere safe — it is `DATABASE_URL`.

## Step 2 — Create the tables (first-time database setup)

Pick whichever you prefer — they run the exact same SQL:

### Option A — the Colab notebook (recommended)

1. Open `2fa-neon-db-setup.ipynb` in Google Colab
   (upload it at <https://colab.research.google.com>).
2. Run the cells top to bottom. When prompted, **paste your Neon pooled
   connection string**.
3. The notebook creates the tables, verifies them, and **generates your
   `ENCRYPTION_KEY` and `SESSION_SECRET`** — copy both when it prints them.

### Option B — Neon's SQL editor

1. In the Neon console, open **SQL Editor**.
2. Paste the entire contents of `db/schema.sql`.
3. Click **Run**. You should see `users`, `credentials` created.

### Option C — psql

```bash
psql "YOUR_NEON_POOLED_URL" -f db/schema.sql
```

## Step 3 — Generate your secret keys

Skip this if the Colab notebook already printed them for you.

Two secrets power the app's cryptography. Generate them with openssl:

```bash
# 1) Secret encryption key — MUST be exactly 32 bytes, base64-encoded
openssl rand -base64 32

# 2) Session signing secret — any random 32+ character string
openssl rand -base64 32
```

> 🔒 **Important:** save these in a password manager. If you lose the
> `ENCRYPTION_KEY`, previously stored 2FA secrets can no longer be decrypted
> (users would have to re-enter them). If you change it later, old secrets
> become unreadable.

## Step 4 — Push the code to GitHub

1. Unzip this package.
2. Create a **new GitHub repository** (e.g. `2fa-authenticator`) — private is
   fine, Vercel works with private repos on the free plan.
3. Push the code:

```bash
cd 2fa-authenticator
git init
git add -A
git commit -m "2FA Authenticator — initial deploy"
git remote add origin https://github.com/YOUR_USERNAME/2fa-authenticator.git
git branch -M main
git push -u origin main
```

## Step 5 — Deploy on Vercel

1. Go to <https://vercel.com/new> and **import** the repository you just pushed.
2. Leave the framework preset as **Next.js** — no build settings to change.
3. Before clicking Deploy, open **Environment Variables** and add:

| Name | Value |
|---|---|
| `DATABASE_URL` | your Neon **pooled** connection string |
| `ENCRYPTION_KEY` | the 32-byte base64 key from Step 3 |
| `SESSION_SECRET` | the 32+ char secret from Step 3 |
| `NEXT_PUBLIC_SITE_URL` | `https://2fa.namansoni.in` |

4. Click **Deploy**. First build takes ~1–2 minutes.

> Whenever you change environment variables later, Vercel requires a
> **redeployment** to pick them up (Deployments → ⋯ → Redeploy).

## Step 6 — Attach the custom domain `2fa.namansoni.in`

1. In Vercel: **Project → Settings → Domains → Add** → enter
   `2fa.namansoni.in`.
2. Vercel will show you the DNS record to create. It is one of:
   - **CNAME** (recommended for subdomains): host `2fa` → value `cname.vercel-dns.com`
   - or **A**: host `2fa` → value `76.76.21.21`
3. Add that record wherever `namansoni.in`'s DNS is managed (your registrar /
   Cloudflare / wherever the zone lives).
4. Back in Vercel, the domain shows a spinner while DNS propagates — usually
   a few minutes, occasionally up to an hour. Vercel automatically issues the
   HTTPS certificate once it verifies.
5. Visit **https://2fa.namansoni.in** — your platform is live.

## Step 7 — Verify the deployment

Open <https://2fa.namansoni.in/api/health>. You should get:

```json
{ "ok": true, "databaseUrl": true, "encryptionKey": true,
  "sessionSecret": true, "database": true, "mode": "neon" }
```

Then do a quick end-to-end pass:

1. Add a test credential with any setup key → a live rotating code appears.
2. Create an account → sign out → sign in → the credential is still there.
3. Open its menu → **Show QR & secret** → confirm your account password
   reveals it.

If everything passes, delete the test credential and you're done. 🎉

---

## Running locally

```bash
cp .env.example .env.local
```

- **With Neon**: put your real values in `.env.local`.
- **Without any database**: set `DATABASE_URL=mock://local-dev` — the app
  then uses a built-in in-memory store (persisted to `db/mock-db.json`) so
  you can try everything with zero setup. Never enable this in production.

```bash
npm install
npm run dev          # http://localhost:3000
```

Verify the OTP engine any time:

```bash
npx tsx scripts/test-totp.ts    # RFC 4226 + RFC 6238 conformance
```

---

## How this app stays inside the free tiers

- **Neon serverless driver** (`@neondatabase/serverless`): every query is a
  single HTTPS round-trip through Neon's pooler. No connections held open,
  so nothing counts against you while idle, and Neon's auto-suspend works
  exactly as designed.
- **Stateless sessions**: sign-in state is a signed JWT in an httpOnly
  cookie — no session table, zero database reads for auth checks.
- **No polling**: codes refresh from the server only right after the
  earliest code would have expired (roughly once per 30s per active tab),
  and never while the tab is hidden. Local-mode codes are computed entirely
  in the browser.
- **Two tables, one index**: the schema is deliberately minimal; listing a
  user's vault is a single indexed query.
- **Tiny bundle**: no ORM engine, no analytics, no tracking scripts.

## Security model (short version)

| Asset | Protection |
|---|---|
| Passwords | salted **scrypt** (N=16384) hashes, `timingSafeEqual` comparison |
| 2FA secrets at rest | **AES-256-GCM** (random 96-bit IV per credential) |
| 2FA secrets in transit | HTTPS everywhere; never returned to the browser unless the account password is re-confirmed |
| Sessions | HS256 **JWT** in httpOnly + Secure + SameSite=Lax cookie (30 days) |
| Auth endpoints | per-IP + per-username rate limiting, timing-equalized login |
| Account deletion | password-confirmed, cascades to all credentials |

Use of the platform is at your own risk — keep offline backups of your setup
keys. See the Terms of Service linked in the site footer.

## Troubleshooting

| Symptom | Cause → Fix |
|---|---|
| `/api/health` says `"databaseUrl": false` | `DATABASE_URL` missing in Vercel env vars → add it, then **redeploy** |
| `"encryptionKey": false` | Key isn't 32-byte base64 → regenerate: `openssl rand -base64 32` |
| Health `"database": false` or `Wrong URL scheme` error | You pasted a non-pooled/malformed URL → use the **pooled** Neon string (`-pooler` in the host, `?sslmode=require`) |
| Sign-in says invalid credentials right after signup | Env vars changed after deploy → redeploy |
| First request after idle is slow (~0.5s) | Neon waking from auto-suspend — normal on the free tier |
| Domain stuck on "Pending" in Vercel | DNS record not propagated yet, or another record (e.g. a conflicting A/AAAA) exists on `2fa` — remove duplicates |
| Build fails on Vercel | Ensure the repo contains `package.json` + `bun.lock`; Node 20+ is used automatically |
