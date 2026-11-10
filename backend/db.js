import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const USE_PG = Boolean(process.env.DATABASE_URL);
const root = dirname(fileURLToPath(import.meta.url));

let pool;
let sqlite;

const PG_SCHEMA = `
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS visits (
  id SERIAL PRIMARY KEY,
  day DATE UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
`;

const SQLITE_SCHEMA = `
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  day TEXT UNIQUE NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);
`;

export async function initDb() {
  if (USE_PG) {
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
    await pool.query(PG_SCHEMA);
  } else {
    const dataDir = join(root, 'data');
    mkdirSync(dataDir, { recursive: true });
    sqlite = new DatabaseSync(join(dataDir, 'portfolio.db'));
    sqlite.exec(SQLITE_SCHEMA);
  }
}

export async function closeDb() {
  if (pool) await pool.end();
  if (sqlite) sqlite.close();
}

function toPg(text, params) {
  let i = 0;
  const sql = text.replaceAll('?', () => `$${++i}`);
  return [sql, params];
}

export async function query(sqlString, params = []) {
  if (USE_PG) {
    const [sql, args] = toPg(sqlString, params);
    const { rows } = await pool.query(sql, args);
    return rows;
  }
  const stmt = sqlite.prepare(sqlString);
  const head = sqlString.trimStart().toUpperCase();
  const returnsRows =
    head.startsWith('SELECT') ||
    head.startsWith('WITH') ||
    head.startsWith('PRAGMA') ||
    head.startsWith('EXPLAIN') ||
    sqlString.toUpperCase().includes('RETURNING');
  if (returnsRows) return stmt.all(...params);
  stmt.run(...params);
  return [];
}

export function isPostgres() {
  return USE_PG;
}