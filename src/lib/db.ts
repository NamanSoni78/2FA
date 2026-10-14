/**
 * Database layer.
 *
 * Production: Neon Postgres over the official serverless HTTP driver
 * (`@neondatabase/serverless`) — one HTTPS round-trip per query, no
 * persistent connections, tiny cold-starts. Perfect for the Vercel +
 * Neon free tiers. Use Neon's POOLED connection string.
 *
 * Local development without a database: set DATABASE_URL=mock:// to use an
 * in-memory store persisted to db/mock-db.json. Never active in production
 * unless you literally set that URL.
 */

import { neon } from "@neondatabase/serverless";
import { promises as fs } from "node:fs";
import path from "node:path";
import { encryptSecret, decryptSecret } from "./crypto.server";
import type { CredentialInput } from "./types";

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date | string;
}

export interface CredentialRow {
  id: string;
  user_id: string;
  label: string;
  issuer: string | null;
  secret_enc: string;
  type: "totp" | "hotp";
  algorithm: "SHA-1" | "SHA-256" | "SHA-512";
  digits: number;
  period: number;
  counter: number;
  encoding: "base32" | "steam";
  sort_order: number;
  created_at: Date | string;
  updated_at: Date | string;
}

export interface Db {
  createUser(id: string, username: string, passwordHash: string): Promise<void>;
  getUserByUsername(username: string): Promise<UserRow | null>;
  getUserById(id: string): Promise<UserRow | null>;
  listCredentials(userId: string): Promise<CredentialRow[]>;
  insertCredential(userId: string, id: string, input: CredentialInput): Promise<void>;
  bulkInsertCredentials(userId: string, items: Array<{ id: string; input: CredentialInput }>): Promise<void>;
  updateCredential(
    userId: string,
    id: string,
    patch: Partial<CredentialInput>,
  ): Promise<boolean>;
  deleteCredential(userId: string, id: string): Promise<boolean>;
  /** Atomically increments and returns the new HOTP counter. */
  incrementHotpCounter(userId: string, id: string): Promise<number | null>;
  deleteUserCascade(id: string): Promise<void>;
  health(): Promise<boolean>;
}

/* ==================================================================== */
/* Neon Postgres backend                                                */
/* ==================================================================== */

function neonDb(url: string): Db {
  const sql = neon(url);

  return {
    async createUser(id, username, passwordHash) {
      await sql`INSERT INTO users (id, username, password_hash)
                VALUES (${id}, ${username}, ${passwordHash})`;
    },

    async getUserByUsername(username) {
      const rows = await sql`SELECT id, username, password_hash, created_at
                             FROM users WHERE username = ${username} LIMIT 1`;
      return (rows[0] as UserRow | undefined) ?? null;
    },

    async getUserById(id) {
      const rows = await sql`SELECT id, username, password_hash, created_at
                             FROM users WHERE id = ${id} LIMIT 1`;
      return (rows[0] as UserRow | undefined) ?? null;
    },

    async listCredentials(userId) {
      const rows = await sql`SELECT id, user_id, label, issuer, secret_enc, type,
                                    algorithm, digits, period, counter, encoding,
                                    sort_order, created_at, updated_at
                             FROM credentials WHERE user_id = ${userId}
                             ORDER BY sort_order ASC, created_at ASC`;
      return rows as CredentialRow[];
    },

    async insertCredential(userId, id, input) {
      const secretEnc = encryptSecret(input.secret);
      await sql`INSERT INTO credentials
                  (id, user_id, label, issuer, secret_enc, type, algorithm,
                   digits, period, counter, encoding, sort_order)
                VALUES (${id}, ${userId}, ${input.label}, ${input.issuer},
                        ${secretEnc}, ${input.type}, ${input.algorithm},
                        ${input.digits}, ${input.period}, ${input.counter},
                        ${input.encoding}, ${Date.now()})`;
    },

    async bulkInsertCredentials(userId, items) {
      if (!items.length) return;
      // Single parameterized multi-row INSERT — one round trip.
      const values: unknown[] = [];
      const tuples: string[] = [];
      items.forEach((item, i) => {
        const b = i * 12;
        tuples.push(
          `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12})`,
        );
        values.push(
          item.id,
          userId,
          item.input.label,
          item.input.issuer,
          encryptSecret(item.input.secret),
          item.input.type,
          item.input.algorithm,
          item.input.digits,
          item.input.period,
          item.input.counter,
          item.input.encoding,
          Date.now() + i,
        );
      });
      await sql.query(
        `INSERT INTO credentials
           (id, user_id, label, issuer, secret_enc, type, algorithm, digits, period, counter, encoding, sort_order)
         VALUES ${tuples.join(",")}`,
        values,
      );
    },

    async updateCredential(userId, id, patch) {
      const sets: string[] = [];
      const values: unknown[] = [];
      const add = (column: string, value: unknown) => {
        values.push(value);
        sets.push(`${column} = $${values.length}`);
      };
      if (patch.label !== undefined) add("label", patch.label);
      if (patch.issuer !== undefined) add("issuer", patch.issuer);
      if (patch.secret !== undefined) add("secret_enc", encryptSecret(patch.secret));
      if (patch.type !== undefined) add("type", patch.type);
      if (patch.algorithm !== undefined) add("algorithm", patch.algorithm);
      if (patch.digits !== undefined) add("digits", patch.digits);
      if (patch.period !== undefined) add("period", patch.period);
      if (patch.counter !== undefined) add("counter", patch.counter);
      if (patch.encoding !== undefined) add("encoding", patch.encoding);
      if (!sets.length) return false;
      add("updated_at", new Date());
      values.push(userId, id);
      const rows = await sql.query(
        `UPDATE credentials SET ${sets.join(", ")}
         WHERE user_id = $${values.length - 1} AND id = $${values.length}
         RETURNING id`,
        values,
      );
      return rows.length > 0;
    },

    async deleteCredential(userId, id) {
      const rows = await sql`DELETE FROM credentials
                             WHERE user_id = ${userId} AND id = ${id}
                             RETURNING id`;
      return rows.length > 0;
    },

    async incrementHotpCounter(userId, id) {
      const rows = await sql`UPDATE credentials
                             SET counter = counter + 1, updated_at = now()
                             WHERE user_id = ${userId} AND id = ${id}
                             RETURNING counter`;
      return rows.length ? Number(rows[0].counter) : null;
    },

    async deleteUserCascade(id) {
      await sql`DELETE FROM users WHERE id = ${id}`;
    },

    async health() {
      try {
        await sql`SELECT 1`;
        return true;
      } catch {
        return false;
      }
    },
  };
}

/* ==================================================================== */
/* Mock backend (local dev only, DATABASE_URL=mock://…)                 */
/* ==================================================================== */

class MockUniqueViolation extends Error {
  code = "23505";
}

const MOCK_PATH = path.join(process.cwd(), "db", "mock-db.json");

function mockDb(): Db {
  interface MockFile {
    users: UserRow[];
    credentials: CredentialRow[];
  }
  let data: MockFile | null = null;
  let writing: Promise<void> = Promise.resolve();

  async function load(): Promise<MockFile> {
    if (data) return data;
    try {
      const raw = await fs.readFile(MOCK_PATH, "utf8");
      data = JSON.parse(raw) as MockFile;
    } catch {
      data = { users: [], credentials: [] };
    }
    return data;
  }

  function persist(d: MockFile) {
    const snapshot = JSON.stringify(d, null, 2);
    writing = fs
      .mkdir(path.dirname(MOCK_PATH), { recursive: true })
      .then(() => fs.writeFile(MOCK_PATH, snapshot, "utf8"))
      .catch(() => undefined);
  }

  return {
    async createUser(id, username, passwordHash) {
      const d = await load();
      if (d.users.some((u) => u.username === username)) {
        throw new MockUniqueViolation();
      }
      d.users.push({
        id,
        username,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      });
      persist(d);
    },
    async getUserByUsername(username) {
      const d = await load();
      return d.users.find((u) => u.username === username) ?? null;
    },
    async getUserById(id) {
      const d = await load();
      return d.users.find((u) => u.id === id) ?? null;
    },
    async listCredentials(userId) {
      const d = await load();
      return d.credentials
        .filter((c) => c.user_id === userId)
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    },
    async insertCredential(userId, id, input) {
      const d = await load();
      d.credentials.push({
        id,
        user_id: userId,
        label: input.label,
        issuer: input.issuer,
        secret_enc: encryptSecret(input.secret),
        type: input.type,
        algorithm: input.algorithm,
        digits: input.digits,
        period: input.period,
        counter: input.counter,
        encoding: input.encoding,
        sort_order: Date.now(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      persist(d);
    },
    async bulkInsertCredentials(userId, items) {
      for (const item of items) {
        await this.insertCredential(userId, item.id, item.input);
      }
    },
    async updateCredential(userId, id, patch) {
      const d = await load();
      const c = d.credentials.find((x) => x.user_id === userId && x.id === id);
      if (!c) return false;
      if (patch.label !== undefined) c.label = patch.label;
      if (patch.issuer !== undefined) c.issuer = patch.issuer;
      if (patch.secret !== undefined) c.secret_enc = encryptSecret(patch.secret);
      if (patch.type !== undefined) c.type = patch.type;
      if (patch.algorithm !== undefined) c.algorithm = patch.algorithm;
      if (patch.digits !== undefined) c.digits = patch.digits;
      if (patch.period !== undefined) c.period = patch.period;
      if (patch.counter !== undefined) c.counter = patch.counter;
      if (patch.encoding !== undefined) c.encoding = patch.encoding;
      c.updated_at = new Date().toISOString();
      persist(d);
      return true;
    },
    async deleteCredential(userId, id) {
      const d = await load();
      const before = d.credentials.length;
      d.credentials = d.credentials.filter(
        (c) => !(c.user_id === userId && c.id === id),
      );
      persist(d);
      return d.credentials.length < before;
    },
    async incrementHotpCounter(userId, id) {
      const d = await load();
      const c = d.credentials.find((x) => x.user_id === userId && x.id === id);
      if (!c) return null;
      c.counter += 1;
      c.updated_at = new Date().toISOString();
      persist(d);
      return c.counter;
    },
    async deleteUserCascade(id) {
      const d = await load();
      d.users = d.users.filter((u) => u.id !== id);
      d.credentials = d.credentials.filter((c) => c.user_id !== id);
      persist(d);
    },
    async health() {
      await load();
      return true;
    },
  };
}

/* ==================================================================== */
/* Public accessor                                                      */
/* ==================================================================== */

let cached: Db | null = null;

/** Dev-only backends: explicit mock:// or a local file: (SQLite-style) URL. */
export function isDevDatabaseUrl(url: string): boolean {
  return url.startsWith("mock://") || url.startsWith("file:");
}

export function getDb(): Db {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not configured. Add your Neon pooled connection string (see SETUP.md).",
    );
  }
  cached = isDevDatabaseUrl(url) ? mockDb() : neonDb(url);
  return cached;
}

/** Detects Postgres unique-violation (username already taken). */
export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}

export { decryptSecret };
