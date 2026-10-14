-- ============================================================================
-- 2FA Authenticator — Neon Postgres schema (first-time setup)
-- ============================================================================
-- Run this file to create the tables the app expects. It is idempotent —
-- running it twice is safe (IF NOT EXISTS everywhere).
--
-- How to run it (pick one):
--   1. The Colab notebook  2fa-neon-db-setup.ipynb  (recommended — cells do
--      this for you and generate your secret keys).
--   2. Neon dashboard  →  SQL Editor  →  paste  →  Run.
--   3. psql "YOUR_NEON_URL" -f db/schema.sql
-- ============================================================================

-- Registered accounts. Passwords are stored as salted scrypt hashes.
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per stored 2FA credential.
-- secret_enc = AES-256-GCM encrypted setup key: base64(iv || tag || ciphertext)
CREATE TABLE IF NOT EXISTS credentials (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    issuer      TEXT,
    secret_enc  TEXT NOT NULL,
    type        TEXT NOT NULL DEFAULT 'totp',        -- 'totp' | 'hotp'
    algorithm   TEXT NOT NULL DEFAULT 'SHA-1',       -- 'SHA-1' | 'SHA-256' | 'SHA-512'
    digits      INTEGER NOT NULL DEFAULT 6,
    period      INTEGER NOT NULL DEFAULT 30,         -- seconds (TOTP)
    counter     INTEGER NOT NULL DEFAULT 0,          -- HOTP sequence number
    encoding    TEXT NOT NULL DEFAULT 'base32',      -- 'base32' | 'steam'
    sort_order  BIGINT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- The only index that matters: listing a user's credentials.
CREATE INDEX IF NOT EXISTS idx_credentials_user_id ON credentials (user_id);

-- Sanity check after running:
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public';
-- Expected: users, credentials
