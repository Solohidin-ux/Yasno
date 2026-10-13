import { FREE_LIMIT } from '../types'
import type { Plan, ProcessDoc, ProcessEdge, ProcessNode } from '../types'

export type Account = {
  id: string
  name: string
  email: string | null
  plan: Plan
  guest: boolean
  createdAt: number
}

type State = {
  ready: boolean
  account: Account | null
  processes: ProcessDoc[]
}

type ApiError = Error & { status?: number; code?: string }

export type CreateInput = {
  title: string
  summary?: string
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  templateId?: string
}

let state: State = { ready: false, account: null, processes: [] }
const listeners = new Set<() => void>()
let hydrating: Promise<void> | null = null

function emit() {
  listeners.forEach((listener) => listener())
}

function replace(next: State) {
  state = next
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot() {
  return state
}

export function canEdit(doc: ProcessDoc) {
  return state.account?.id === doc.ownerId
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const data = (await response.json().catch(() => ({}))) as T & { error?: string; code?: string }
  if (!response.ok) {
    const error = new Error(data.error || 'Сервер не ответил') as ApiError
    error.status = response.status
    error.code = data.code
    throw error
  }
  return data
}

export function hydrate() {
  if (!hydrating) {
    hydrating = load().catch((error: unknown) => {
      hydrating = null
      throw error
    })
  }
  return hydrating
}

async function load() {
  const [me, list] = await Promise.all([
    request<{ account: Account }>('/api/me'),
    request<{ processes: ProcessDoc[] }>('/api/processes'),
  ])
  replace({ ready: true, account: me.account, processes: list.processes })
}

function applyAccount(account: Account, processes: ProcessDoc[]) {
  replace({ ready: true, account, processes })
}

export async function register(name: string, email: string, password: string) {
  try {
    const data = await request<{ account: Account; processes: ProcessDoc[]; left: number }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    })
    applyAccount(data.account, data.processes)
    return { ok: true as const, left: data.left }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Не удалось создать аккаунт.' }
  }
}

export async function login(email: string, password: string) {
  try {
    const data = await request<{ account: Account; processes: ProcessDoc[]; left: number }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    applyAccount(data.account, data.processes)
    return { ok: true as const, left: data.left }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : 'Не удалось войти.' }
  }
}

export async function logout() {
  const data = await request<{ account: Account; processes: ProcessDoc[] }>('/api/auth/logout', { method: 'POST' })
  applyAccount(data.account, data.processes)
}

export async function setPlan(plan: Plan) {
  const data = await request<{ account: Account }>('/api/me', {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  })
  replace({ ...state, account: data.account })
  return 0
}

export async function createProcess(input: CreateInput) {
  try {
    const data = await request<{ process: ProcessDoc }>('/api/processes', {
      method: 'POST',
      body: JSON.stringify(input),
    })
    replace({ ...state, processes: [data.process, ...state.processes.filter((item) => item.id !== data.process.id)] })
    return { ok: true as const, process: data.process }
  } catch (error) {
    const code = error instanceof Error ? (error as ApiError).code : undefined
    if (code === 'limit') return { ok: false as const, error: 'limit' as const }
    return { ok: false as const, error: 'error' as const }
  }
}

export async function updateProcess(
  id: string,
  patch: Partial<Pick<ProcessDoc, 'title' | 'summary' | 'nodes' | 'edges' | 'isPublic'>>,
) {
  try {
    const data = await request<{ process: ProcessDoc }>(`/api/processes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    replace({ ...state, processes: state.processes.map((item) => (item.id === id ? data.process : item)) })
    return true
  } catch {
    return false
  }
}

export async function deleteProcess(id: string) {
  const previous = state.processes
  replace({ ...state, processes: previous.filter((item) => item.id !== id) })
  try {
    await request(`/api/processes/${id}`, { method: 'DELETE' })
  } catch {
    replace({ ...state, processes: previous })
  }
}

export async function duplicateProcess(id: string) {
  try {
    const data = await request<{ process: ProcessDoc }>(`/api/processes/${id}/duplicate`, { method: 'POST' })
    replace({ ...state, processes: [data.process, ...state.processes] })
    return { ok: true as const, process: data.process }
  } catch (error) {
    const code = error instanceof Error ? (error as ApiError).code : undefined
    if (code === 'limit') return { ok: false as const, error: 'limit' as const }
    return { ok: false as const, error: 'missing' as const }
  }
}

export async function fetchProcess(id: string) {
  try {
    const data = await request<{ process: ProcessDoc }>(`/api/processes/${id}`)
    return data.process
  } catch {
    return null
  }
}

export function ownedCount() {
  const pro = state.account?.plan === 'pro'
  return { used: state.processes.length, atLimit: !pro && state.processes.length >= FREE_LIMIT }
}
