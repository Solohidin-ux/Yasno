import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { LimitDialog } from '../components/LimitDialog'
import { Marketing } from '../components/SiteChrome'
import { Button } from '../components/ui'
import { createProcess, fetchProcess } from '../lib/db'
import { formatLongDate } from '../lib/format'
import { decodeShare } from '../lib/share'
import { useTitle } from '../lib/useTitle'
import type { ProcessEdge, ProcessNode } from '../types'
import { SchemeFrame } from './SchemeFrame'

type View = {
  title: string
  summary: string
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  updatedAt: number
}

export function PublicPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const hash = location.hash.startsWith('#') ? location.hash.slice(1) : ''
  const [remote, setRemote] = useState<View | null>(null)
  const [remoteKey, setRemoteKey] = useState('')
  const [failedKey, setFailedKey] = useState('')
  const [limitOpen, setLimitOpen] = useState(false)
  const view: View | null = remoteKey === (hash || id || '') ? remote : null
  const loading = Boolean(hash || id) && remoteKey !== (hash || id) && failedKey !== (hash || id)
  useTitle(view?.title ?? 'Схема')

  useEffect(() => {
    const key = hash || id || ''
    if (!key) return
    let cancelled = false
    const load = hash
      ? decodeShare(hash).then((payload) => payload)
      : fetchProcess(id ?? '').then((doc) => (doc?.isPublic ? doc : null))
    void load.then((payload) => {
      if (cancelled) return
      if (!payload) {
        setFailedKey(key)
        setRemote(null)
        return
      }
      setRemote(payload)
      setRemoteKey(key)
      setFailedKey('')
    })
    return () => {
      cancelled = true
    }
  }, [hash, id])

  function saveCopy() {
    if (!view) return
    void createProcess({
      title: view.title,
      summary: view.summary,
      nodes: view.nodes,
      edges: view.edges,
    }).then((result) => {
      if (!result.ok) {
        setLimitOpen(true)
        return
      }
      navigate(`/editor/${result.process.id}`)
    })
  }

  if (loading) {
    return (
      <Marketing>
        <p className="px-5 py-24 text-center text-muted">Открываем схему…</p>
      </Marketing>
    )
  }

  if (!view) {
    return (
      <Marketing>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Схема не открылась</h1>
          <p className="mt-3 text-muted">Ссылка битая, или эта схема не опубликована.</p>
          <div className="mt-6">
            <Button to="/create">Собрать свою</Button>
          </div>
        </div>
      </Marketing>
    )
  }

  return (
    <>
      <SchemeFrame
        title={view.title}
        kicker={formatLongDate(view.updatedAt)}
        summary={view.summary}
        nodes={view.nodes}
        edges={view.edges}
        actions={
          <Button onClick={saveCopy} variant="accent">
            Сохранить копию себе
          </Button>
        }
      />
      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  )
}
