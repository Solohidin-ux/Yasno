import type { NextFunction, Request, Response } from 'express'
import express from 'express'
import {
  countProcesses,
  createGuest,
  createSession,
  deleteGuest,
  deleteSession,
  getAccountByEmail,
  getProcess,
  getSession,
  hashPassword,
  insertProcess,
  limitFor,
  listProcesses,
  moveProcesses,
  removeProcess,
  saveProcess,
  setPlan,
  setSessionUser,
  upgradeGuest,
  verifyPassword,
  type AccountRow,
  type Plan,
  type ProcessRow,
} from './db.ts'

const PORT = Number(process.env.PORT ?? 8787)
const COOKIE = 'yasno_session'
const MONTH = 60 * 60 * 24 * 30
const KINDS = new Set(['start', 'end', 'action', 'decision'])

type Session = { account: AccountRow; token: string }
const sessions = new WeakMap<Request, Session>()

const app = express()
app.use(express.json({ limit: '4mb' }))

app.use((req, res, next) => {
  const token = readCookie(req)
  const existing = token ? getSession(token) : undefined
  if (token && existing) {
    sessions.set(req, { account: existing, token })
    next()
    return
  }
  const account = createGuest()
  const fresh = createSession(account.id)
  res.setHeader('Set-Cookie', sessionCookie(fresh))
  sessions.set(req, { account, token: fresh })
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.get('/api/me', (req, res) => {
  res.json({ account: publicAccount(session(req).account) })
})

app.patch('/api/me', (req, res) => {
  const current = session(req).account
  if (current.email == null) {
    res.status(401).json({ error: 'Сначала войдите в аккаунт.', code: 'auth' })
    return
  }
  const plan = req.body?.plan
  if (plan !== 'free' && plan !== 'pro') {
    res.status(400).json({ error: 'Неизвестный тариф.' })
    return
  }
  const updated = setPlan(current.id, plan as Plan)
  if (!updated) {
    res.status(404).json({ error: 'Аккаунт не найден.' })
    return
  }
  sessions.set(req, { ...session(req), account: updated })
  res.json({ account: publicAccount(updated) })
})

app.post('/api/auth/register', (req, res) => {
  const current = session(req)
  const name = String(req.body?.name ?? '').trim()
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  if (name.length < 2) {
    res.status(400).json({ error: 'Как к вам обращаться? Нужно хотя бы 2 буквы.' })
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Похоже, в почте опечатка.' })
    return
  }
  if (password.length < 6) {
    res.status(400).json({ error: 'Пароль — не короче 6 символов.' })
    return
  }
  if (getAccountByEmail(email)) {
    res.status(409).json({ error: 'Такая почта уже зарегистрирована.' })
    return
  }
  if (current.account.email != null) {
    res.status(400).json({ error: 'Вы уже вошли.' })
    return
  }
  const updated = upgradeGuest(current.account, name, email, hashPassword(password))
  if (!updated) {
    res.status(500).json({ error: 'Не удалось создать аккаунт.' })
    return
  }
  sessions.set(req, { ...current, account: updated })
  res.json({ account: publicAccount(updated), processes: listProcesses(updated.id).map(toProcess), left: 0 })
})

app.post('/api/auth/login', (req, res) => {
  const current = session(req)
  const email = String(req.body?.email ?? '').trim().toLowerCase()
  const password = String(req.body?.password ?? '')
  const account = getAccountByEmail(email)
  if (!account?.password_hash || !verifyPassword(password, account.password_hash)) {
    res.status(401).json({ error: 'Неверная почта или пароль.' })
    return
  }
  if (current.account.id !== account.id) {
    moveProcesses(current.account.id, account.id)
    deleteGuest(current.account.id)
    setSessionUser(current.token, account.id)
  }
  sessions.set(req, { token: current.token, account })
  res.json({ account: publicAccount(account), processes: listProcesses(account.id).map(toProcess), left: 0 })
})

app.post('/api/auth/logout', (req, res) => {
  const current = session(req)
  deleteSession(current.token)
  const account = createGuest()
  const token = createSession(account.id)
  res.setHeader('Set-Cookie', sessionCookie(token))
  sessions.set(req, { account, token })
  res.json({ account: publicAccount(account), processes: [] })
})

app.get('/api/processes', (req, res) => {
  res.json({ processes: listProcesses(session(req).account.id).map(toProcess) })
})

app.post('/api/processes', (req, res) => {
  const account = session(req).account
  if (countProcesses(account.id) >= limitFor(account)) {
    res.status(403).json({ error: 'На бесплатном плане три схемы.', code: 'limit' })
    return
  }
  const graph = sanitizeGraph(req.body?.nodes, req.body?.edges)
  if (!graph) {
    res.status(400).json({ error: 'Схема повреждена.' })
    return
  }
  const now = Date.now()
  const row: ProcessRow = {
    id: crypto.randomUUID(),
    owner_id: account.id,
    title: clip(req.body?.title, 120) || 'Новый процесс',
    summary: clip(req.body?.summary, 8000),
    nodes: JSON.stringify(graph.nodes),
    edges: JSON.stringify(graph.edges),
    is_public: 0,
    template_id: typeof req.body?.templateId === 'string' ? req.body.templateId.slice(0, 40) : null,
    created_at: now,
    updated_at: now,
  }
  insertProcess(row)
  res.status(201).json({ process: toProcess(row) })
})

app.get('/api/processes/:id', (req, res) => {
  const row = getProcess(paramId(req))
  if (!row || (row.owner_id !== session(req).account.id && row.is_public !== 1)) {
    res.status(404).json({ error: 'Схема не найдена.' })
    return
  }
  res.json({ process: toProcess(row) })
})

app.patch('/api/processes/:id', (req, res) => {
  const account = session(req).account
  const row = getProcess(paramId(req))
  if (!row || row.owner_id !== account.id) {
    res.status(404).json({ error: 'Схема не найдена.' })
    return
  }
  const graph = req.body?.nodes || req.body?.edges ? sanitizeGraph(req.body?.nodes ?? JSON.parse(row.nodes), req.body?.edges ?? JSON.parse(row.edges)) : null
  if ((req.body?.nodes || req.body?.edges) && !graph) {
    res.status(400).json({ error: 'Схема повреждена.' })
    return
  }
  let isPublic = row.is_public
  if (typeof req.body?.isPublic === 'boolean') {
    if (req.body.isPublic && account.plan !== 'pro') {
      res.status(403).json({ error: 'Публичные ссылки входят в Pro.', code: 'pro' })
      return
    }
    isPublic = req.body.isPublic ? 1 : 0
  }
  const next: ProcessRow = {
    ...row,
    title: req.body?.title !== undefined ? clip(req.body.title, 120) || 'Без названия' : row.title,
    summary: req.body?.summary !== undefined ? clip(req.body.summary, 8000) : row.summary,
    nodes: graph ? JSON.stringify(graph.nodes) : row.nodes,
    edges: graph ? JSON.stringify(graph.edges) : row.edges,
    is_public: isPublic,
    updated_at: Date.now(),
  }
  saveProcess(next)
  res.json({ process: toProcess(next) })
})

app.delete('/api/processes/:id', (req, res) => {
  const row = getProcess(paramId(req))
  if (!row || row.owner_id !== session(req).account.id) {
    res.status(404).json({ error: 'Схема не найдена.' })
    return
  }
  removeProcess(row.id, row.owner_id)
  res.json({ ok: true })
})

app.post('/api/processes/:id/duplicate', (req, res) => {
  const account = session(req).account
  const row = getProcess(paramId(req))
  if (!row || row.owner_id !== account.id) {
    res.status(404).json({ error: 'Схема не найдена.', code: 'missing' })
    return
  }
  if (countProcesses(account.id) >= limitFor(account)) {
    res.status(403).json({ error: 'На бесплатном плане три схемы.', code: 'limit' })
    return
  }
  const now = Date.now()
  const copy: ProcessRow = {
    ...row,
    id: crypto.randomUUID(),
    title: `Копия — ${row.title}`.slice(0, 120),
    is_public: 0,
    created_at: now,
    updated_at: now,
  }
  insertProcess(copy)
  res.status(201).json({ process: toProcess(copy) })
})

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error)
  if (res.headersSent) return
  res.status(500).json({ error: 'Ошибка сервера' })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Ясно API слушает http://127.0.0.1:${PORT}`)
})

function session(req: Request) {
  const current = sessions.get(req)
  if (!current) throw new Error('Сессия не создана')
  return current
}

function paramId(req: Request) {
  const value = req.params.id
  return Array.isArray(value) ? value[0] ?? '' : value ?? ''
}

function readCookie(req: Request) {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === COOKIE) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

function sessionCookie(token: string) {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${MONTH}`
}

function publicAccount(account: AccountRow) {
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    plan: account.plan,
    guest: account.email == null,
    createdAt: account.created_at,
  }
}

function toProcess(row: ProcessRow) {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    nodes: JSON.parse(row.nodes) as unknown[],
    edges: JSON.parse(row.edges) as unknown[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerId: row.owner_id,
    isPublic: row.is_public === 1,
    templateId: row.template_id ?? undefined,
  }
}

function clip(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function sanitizeGraph(nodes: unknown, edges: unknown) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) return null
  const cleanNodes = []
  for (const item of nodes.slice(0, 200)) {
    if (!item || typeof item !== 'object') continue
    const node = item as Record<string, unknown>
    const data = node.data
    const position = node.position
    if (!data || typeof data !== 'object' || !position || typeof position !== 'object') continue
    const fields = data as Record<string, unknown>
    const point = position as Record<string, unknown>
    if (typeof node.id !== 'string' || typeof fields.label !== 'string' || !KINDS.has(String(fields.kind))) continue
    if (typeof point.x !== 'number' || typeof point.y !== 'number') continue
    cleanNodes.push({
      id: node.id.slice(0, 80),
      type: 'process',
      position: { x: point.x, y: point.y },
      data: compactData(fields),
    })
  }
  if (cleanNodes.length === 0) return null
  const ids = new Set(cleanNodes.map((node) => node.id))
  const cleanEdges = []
  for (const item of edges.slice(0, 400)) {
    if (!item || typeof item !== 'object') continue
    const edge = item as Record<string, unknown>
    if (typeof edge.id !== 'string' || typeof edge.source !== 'string' || typeof edge.target !== 'string') continue
    if (!ids.has(edge.source) || !ids.has(edge.target) || edge.source === edge.target) continue
    const next: Record<string, unknown> = {
      id: edge.id.slice(0, 80),
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
    }
    if (typeof edge.label === 'string' && edge.label.trim()) next.label = edge.label.trim().slice(0, 40)
    if (typeof edge.sourceHandle === 'string') next.sourceHandle = edge.sourceHandle.slice(0, 40)
    if (typeof edge.targetHandle === 'string') next.targetHandle = edge.targetHandle.slice(0, 40)
    if (edge.markerEnd && typeof edge.markerEnd === 'object') next.markerEnd = edge.markerEnd
    cleanEdges.push(next)
  }
  return { nodes: cleanNodes, edges: cleanEdges }
}

function compactData(fields: Record<string, unknown>) {
  const data: Record<string, unknown> = {
    label: String(fields.label).slice(0, 200),
    kind: fields.kind,
  }
  if (typeof fields.duration === 'string' && fields.duration.trim()) data.duration = fields.duration.trim().slice(0, 40)
  if (typeof fields.owner === 'string' && fields.owner.trim()) data.owner = fields.owner.trim().slice(0, 80)
  if (fields.bottleneck) data.bottleneck = true
  if (typeof fields.bottleneckNote === 'string' && fields.bottleneckNote.trim()) {
    data.bottleneckNote = fields.bottleneckNote.trim().slice(0, 500)
  }
  if (fields.automation) data.automation = true
  if (typeof fields.automationNote === 'string' && fields.automationNote.trim()) {
    data.automationNote = fields.automationNote.trim().slice(0, 500)
  }
  return data
}
