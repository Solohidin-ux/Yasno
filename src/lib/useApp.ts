import { useSyncExternalStore } from 'react'
import { FREE_LIMIT } from '../types'
import type { User } from '../types'
import { getSnapshot, subscribe, type Account } from './db'

export function accountUser(account: Account | null): User | null {
  if (!account || account.guest || !account.email) return null
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    plan: account.plan,
    createdAt: account.createdAt,
  }
}

export function useApp() {
  const db = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const user = accountUser(db.account)
  const mine = db.processes.slice().sort((a, b) => b.updatedAt - a.updatedAt)
  const pro = db.account?.plan === 'pro'
  return {
    ready: db.ready,
    user,
    mine,
    drafts: mine.slice(0, 0),
    pro,
    atLimit: !pro && mine.length >= FREE_LIMIT,
    used: mine.length,
  }
}
