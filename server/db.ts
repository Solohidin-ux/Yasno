import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'

export type Plan = 'free' | 'pro'

export type AccountRow = {
  id: string
  name: string
  email: string | null
  password_hash: string | null
  plan: Plan
  created_at: number
}

export type ProcessRow = {
  id: string
  owner_id: string
  title: string
  summary: string
  nodes: string
  edges: string
  is_public: number
  template_id: string | null
  created_at: number
  updated_at: number
}

const root = path.resolve(process.cwd(), 'data')
mkdirSync(root, { recursive: true })

export const db = new DatabaseSync(path.join(root, 'yasno.sqlite'))
db.exec('PRAGMA journal_mode = WAL')
db.exec('PRAGMA foreign_keys = ON')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE,
    password_hash TEXT,
    plan TEXT NOT NULL DEFAULT 'free',
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS processes (
    id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    nodes TEXT NOT NULL,
    edges TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0,
    template_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS processes_owner ON processes(owner_id);
`)

const FREE_LIMIT = 3

export function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = scryptSync(password, salt, 32)
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`
}

export function verifyPassword(password: string, stored: string) {
  const [kind, saltHex, hashHex] = stored.split('$')
  if (kind !== 'scrypt' || !saltHex || !hashHex) return false
  const expected = Buffer.from(hashHex, 'hex')
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length)
  if (actual.length !== expected.length) return false
  return timingSafeEqual(actual, expected)
}

export function createGuest() {
  const account: AccountRow = {
    id: crypto.randomUUID(),
    name: '',
    email: null,
    password_hash: null,
    plan: 'free',
    created_at: Date.now(),
  }
  db.prepare(
    'INSERT INTO users (id, name, email, password_hash, plan, created_at) VALUES (?, ?, NULL, NULL, ?, ?)',
  ).run(account.id, account.name, account.plan, account.created_at)
  return account
}

export function getAccount(id: string) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as AccountRow | undefined
}

export function getAccountByEmail(email: string) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as AccountRow | undefined
}

export function createSession(userId: string) {
  const token = randomBytes(32).toString('hex')
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(token, userId, Date.now())
  return token
}

export function getSession(token: string) {
  const row = db.prepare('SELECT user_id FROM sessions WHERE token = ?').get(token) as { user_id: string } | undefined
  if (!row) return undefined
  return getAccount(row.user_id)
}

export function setSessionUser(token: string, userId: string) {
  db.prepare('UPDATE sessions SET user_id = ? WHERE token = ?').run(userId, token)
}

export function deleteSession(token: string) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function countProcesses(ownerId: string) {
  const row = db.prepare('SELECT COUNT(*) AS count FROM processes WHERE owner_id = ?').get(ownerId) as { count: number }
  return row.count
}

export function limitFor(account: AccountRow) {
  return account.plan === 'pro' ? Number.POSITIVE_INFINITY : FREE_LIMIT
}

export function listProcesses(ownerId: string) {
  return db.prepare('SELECT * FROM processes WHERE owner_id = ? ORDER BY updated_at DESC').all(ownerId) as ProcessRow[]
}

export function getProcess(id: string) {
  return db.prepare('SELECT * FROM processes WHERE id = ?').get(id) as ProcessRow | undefined
}

export function insertProcess(row: ProcessRow) {
  db.prepare(
    `INSERT INTO processes (id, owner_id, title, summary, nodes, edges, is_public, template_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.owner_id,
    row.title,
    row.summary,
    row.nodes,
    row.edges,
    row.is_public,
    row.template_id,
    row.created_at,
    row.updated_at,
  )
}

export function saveProcess(row: ProcessRow) {
  db.prepare(
    `UPDATE processes
     SET title = ?, summary = ?, nodes = ?, edges = ?, is_public = ?, updated_at = ?
     WHERE id = ? AND owner_id = ?`,
  ).run(row.title, row.summary, row.nodes, row.edges, row.is_public, row.updated_at, row.id, row.owner_id)
}

export function removeProcess(id: string, ownerId: string) {
  db.prepare('DELETE FROM processes WHERE id = ? AND owner_id = ?').run(id, ownerId)
}

export function moveProcesses(fromId: string, toId: string) {
  db.prepare('UPDATE processes SET owner_id = ? WHERE owner_id = ?').run(toId, fromId)
}

export function deleteGuest(id: string) {
  db.prepare('DELETE FROM users WHERE id = ? AND email IS NULL').run(id)
}

export function upgradeGuest(account: AccountRow, name: string, email: string, passwordHash: string) {
  db.prepare('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?').run(name, email, passwordHash, account.id)
  return getAccount(account.id)
}

export function setPlan(id: string, plan: Plan) {
  db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, id)
  return getAccount(id)
}
