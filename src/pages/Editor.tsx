import {
  applyEdgeChanges,
  applyNodeChanges,
  Panel,
  ReactFlowProvider,
  reconnectEdge,
  useReactFlow,
  type Connection,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import { Copy, Download, Link2, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FlowCanvas } from '../components/flow/FlowCanvas'
import { Inspector } from '../components/flow/Inspector'
import { Onboarding } from '../components/flow/Onboarding'
import { ToolRail } from '../components/flow/ToolRail'
import { LimitDialog } from '../components/LimitDialog'
import { Logo } from '../components/Logo'
import { Marketing } from '../components/SiteChrome'
import { Button, Modal } from '../components/ui'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../context/ToastContext'
import { canEdit, deleteProcess, duplicateProcess, updateProcess } from '../lib/db'
import { getOnboardingSeen, setOnboardingSeen } from '../lib/prefs'
import { exportProcessPng } from '../lib/exportImage'
import { layoutGraph, makeEdge, nextLabel, nextPosition, slimEdge, slimNode, withDirection } from '../lib/graph'
import { useApp } from '../lib/useApp'
import { useTitle } from '../lib/useTitle'
import { cn } from '../lib/utils'
import type { Direction, NodeKind, ProcessDoc, ProcessEdge, ProcessNode, ProcessNodeData } from '../types'

type Snap = { nodes: ProcessNode[]; edges: ProcessEdge[] }

export function EditorPage() {
  const { id } = useParams()
  const { mine } = useApp()
  const doc = mine.find((item) => item.id === id)
  useTitle(doc?.title ?? 'Схема')

  if (!doc) {
    return (
      <Marketing>
        <Missing
          title="Схема не найдена"
          text="Такой схемы нет, или она принадлежит другому аккаунту."
        />
      </Marketing>
    )
  }
  if (!canEdit(doc)) {
    return (
      <Marketing>
        <Missing
          title="Нужен вход"
          text="Эта схема принадлежит другому аккаунту."
          action={{ to: `/login?next=/editor/${doc.id}`, label: 'Войти' }}
        />
      </Marketing>
    )
  }
  return (
    <ReactFlowProvider>
      <Editor key={doc.id} doc={doc} />
    </ReactFlowProvider>
  )
}

function Editor({ doc }: { doc: ProcessDoc }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { resolved } = useTheme()
  const { user, pro, used } = useApp()
  const { fitView, getNodes, getNodesBounds, setViewport } = useReactFlow()
  const [nodes, setNodes] = useState<ProcessNode[]>(() => doc.nodes.map(slimNode))
  const [edges, setEdges] = useState<ProcessEdge[]>(() => doc.edges.map(slimEdge))
  const [title, setTitle] = useState(doc.title)
  const [summary, setSummary] = useState(doc.summary)
  const [help, setHelp] = useState(() => !getOnboardingSeen())
  const [panel, setPanel] = useState(false)
  const [status, setStatus] = useState<'idle' | 'saved'>('idle')
  const [exporting, setExporting] = useState(false)
  const [limitOpen, setLimitOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [proOpen, setProOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pastCount, setPastCount] = useState(0)
  const [futureCount, setFutureCount] = useState(0)
  const canvasRef = useRef<HTMLDivElement>(null)
  const nodesRef = useRef(nodes)
  const edgesRef = useRef(edges)
  const past = useRef<Snap[]>([])
  const future = useRef<Snap[]>([])
  const saved = useRef<string | null>(null)
  const directionRef = useRef<Direction>('LR')

  useEffect(() => {
    nodesRef.current = nodes
    edgesRef.current = edges
  }, [nodes, edges])

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const current = getNodes()
      if (current.length === 0) return
      const bounds = getNodesBounds(current)
      const zoom = window.innerWidth < 900 ? 0.85 : 1
      void setViewport({ x: 40 - bounds.x * zoom, y: 36 - bounds.y * zoom, zoom })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [doc.id, getNodes, setViewport])

  const snapshot = useCallback((): Snap => {
    return { nodes: nodesRef.current.map(slimNode), edges: edgesRef.current.map(slimEdge) }
  }, [])
  const remember = useCallback(() => {
    past.current.push(snapshot())
    if (past.current.length > 50) past.current.shift()
    future.current = []
    setPastCount(past.current.length)
    setFutureCount(0)
  }, [snapshot])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return
    future.current.push(snapshot())
    setNodes(prev.nodes)
    setEdges(prev.edges)
    setPastCount(past.current.length)
    setFutureCount(future.current.length)
  }, [snapshot])

  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return
    past.current.push(snapshot())
    setNodes(next.nodes)
    setEdges(next.edges)
    setPastCount(past.current.length)
    setFutureCount(future.current.length)
  }, [snapshot])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
        return
      }
      const meta = event.ctrlKey || event.metaKey
      if (!meta) return
      const key = event.key.toLowerCase()
      if (key === 'z' && !event.shiftKey) {
        event.preventDefault()
        undo()
      } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
        event.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo])

  useEffect(() => {
    const payload = JSON.stringify({
      title,
      summary,
      nodes: nodes.map(slimNode),
      edges: edges.map(slimEdge),
    })
    if (saved.current === null) {
      saved.current = payload
      return
    }
    if (payload === saved.current) return
    const timer = window.setTimeout(() => {
      void updateProcess(doc.id, { title, summary, nodes, edges }).then((ok) => {
        if (!ok) return
        saved.current = payload
        setStatus('saved')
      })
    }, 400)
    return () => window.clearTimeout(timer)
  }, [title, summary, nodes, edges, doc.id])

  const selectedNode = nodes.find((node) => node.selected)
  const selectedEdge = edges.find((edge) => edge.selected)
  const selectedNodeId = selectedNode?.id
  const selectedEdgeId = selectedEdge?.id
  const selectionKey = selectedNodeId ?? selectedEdgeId ?? ''
  const [trackedSelection, setTrackedSelection] = useState('')
  if (selectionKey !== trackedSelection) {
    setTrackedSelection(selectionKey)
    if (selectionKey && window.innerWidth < 1024) setPanel(true)
  }

  const onNodesChange: OnNodesChange<ProcessNode> = useCallback((changes) => {
    setNodes((current) => applyNodeChanges(changes, current))
  }, [])

  const onEdgesChange: OnEdgesChange<ProcessEdge> = useCallback((changes) => {
    setEdges((current) => applyEdgeChanges(changes, current))
  }, [])

  function addNode(kind: NodeKind) {
    const selected = nodes.find((node) => node.selected)
    const id = crypto.randomUUID()
    const node: ProcessNode = {
      id,
      type: 'process',
      position: nextPosition(nodes, selected),
      selected: true,
      data: { label: nextLabel(kind, nodes), kind },
    }
    remember()
    setNodes((current) => [...current.map((item) => ({ ...item, selected: false })), node])
    if (selected) setEdges((current) => current.concat(makeEdge(selected.id, id, undefined, undefined, directionRef.current)))
    setPanel(true)
  }

  function patchNode(id: string, patch: Partial<ProcessNodeData>) {
    setNodes((current) => current.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...patch } } : node)))
  }

  function patchEdge(id: string, label: string) {
    setEdges((current) => current.map((edge) => (edge.id === id ? { ...edge, label } : edge)))
  }

  function removeNode(id: string) {
    remember()
    setNodes((current) => current.filter((node) => node.id !== id))
    setEdges((current) => current.filter((edge) => edge.source !== id && edge.target !== id))
  }

  function removeEdge(id: string) {
    remember()
    setEdges((current) => current.filter((edge) => edge.id !== id))
  }

  function onConnect(connection: Connection) {
    if (!connection.source || !connection.target || connection.source === connection.target) return
    remember()
    const edge = makeEdge(connection.source, connection.target)
    if (connection.sourceHandle) edge.sourceHandle = connection.sourceHandle
    if (connection.targetHandle) edge.targetHandle = connection.targetHandle
    setEdges((current) => current.concat(edge))
  }

  function arrange(direction: Direction) {
    remember()
    directionRef.current = direction
    const nextEdges = edgesRef.current.map((edge) => withDirection(edge, direction))
    setEdges(nextEdges)
    setNodes(layoutGraph(nodesRef.current, nextEdges, direction))
    window.requestAnimationFrame(() => {
      void fitView({ padding: 0.18 })
    })
  }

  async function copyProcess() {
    const copy = await duplicateProcess(doc.id)
    if (!copy.ok) {
      setLimitOpen(true)
      return
    }
    navigate(`/editor/${copy.process.id}`)
  }

  async function onExport() {
    const viewport = canvasRef.current?.querySelector('.react-flow__viewport')
    if (!(viewport instanceof HTMLElement)) return
    setExporting(true)
    try {
      await exportProcessPng({
        title: title.trim() || 'Схема',
        nodes: getNodes() as ProcessNode[],
        bounds: getNodesBounds(getNodes()),
        viewport,
        theme: resolved,
        watermark: !pro,
      })
      toast(pro ? 'PNG сохранён' : 'PNG сохранён. На бесплатном плане есть отметка Ясно')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось собрать PNG')
    } finally {
      setExporting(false)
    }
  }

  async function onShare() {
    if (!user) {
      setAuthOpen(true)
      return
    }
    if (!pro) {
      setProOpen(true)
      return
    }
    try {
      const saved = await updateProcess(doc.id, { title, summary, nodes, edges, isPublic: true })
      if (!saved) throw new Error('Не удалось опубликовать схему')
      const url = `${window.location.origin}/p/${doc.id}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url)
      toast('Ссылка скопирована')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Не удалось собрать ссылку')
    }
  }

  const bottlenecks = nodes.filter((node) => node.data.bottleneck).length
  const automations = nodes.filter((node) => node.data.automation).length
  const canUndo = pastCount > 0
  const canRedo = futureCount > 0

  return (
    <div className="flex h-dvh flex-col bg-paper text-ink">
      <header className="flex shrink-0 items-center gap-2 border-b border-line bg-surface px-3 py-2 md:gap-3 md:px-4">
        <Link to="/processes" aria-label="К списку процессов" className="text-ink">
          <Logo compact />
        </Link>
        <input
          value={title}
          aria-label="Название процесса"
          onFocus={remember}
          onChange={(event) => setTitle(event.target.value)}
          className="min-w-0 flex-1 bg-transparent font-display text-base outline-none md:text-lg"
        />
        <p className="hidden text-xs text-muted xl:block">
          {status === 'saved' ? 'Сохранено' : 'Черновик'}
          {pro ? '' : ` · ${used} из 3`}
          {bottlenecks ? ` · узких мест ${bottlenecks}` : ''}
          {automations ? ` · автоматизаций ${automations}` : ''}
        </p>
        <Button size="sm" variant="ghost" onClick={copyProcess} aria-label="Дублировать">
          <Copy size={15} />
          <span className="hidden sm:inline">Копия</span>
        </Button>
        <Button size="sm" variant="secondary" onClick={() => void onShare()}>
          <Link2 size={15} />
          <span className="hidden sm:inline">Ссылка</span>
        </Button>
        <Button size="sm" onClick={() => void onExport()} disabled={exporting}>
          <Download size={15} />
          {exporting ? 'Собираем…' : 'PNG'}
        </Button>
        <button
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-paper"
          aria-label="Удалить процесс"
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 size={16} />
        </button>
      </header>

      {!user ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-paper px-4 py-2 text-sm">
          <p className="text-muted">Схема в гостевой сессии. Войдите, чтобы она осталась на вашей почте.</p>
          <Link to={`/register?next=/editor/${doc.id}`} className="font-semibold text-accent">
            Войти и закрепить за собой
          </Link>
        </div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <div className="hidden h-full md:block">
          <ToolRail
            onAdd={addNode}
            onLayout={arrange}
            onFit={() => void fitView({ padding: 0.18 })}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onHelp={() => setHelp(true)}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="md:hidden">
            <ToolRail
              horizontal
              onAdd={addNode}
              onLayout={arrange}
              onFit={() => void fitView({ padding: 0.18 })}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              onHelp={() => setHelp(true)}
            />
          </div>
          <div ref={canvasRef} className="relative min-h-0 flex-1">
            <FlowCanvas
              fitView={false}
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onReconnect={(edge, connection) => {
                remember()
                setEdges((current) => reconnectEdge(edge, connection, current))
              }}
              onNodeDragStart={remember}
              onBeforeDelete={async () => {
                remember()
                return true
              }}
            >
              <Panel position="top-left">
                <div className="flex gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold">
                  <span className="text-danger">Узкое место</span>
                  <span className="text-auto">Автоматизация</span>
                </div>
              </Panel>
              {help ? (
                <Panel position="bottom-center">
                  <Onboarding
                    onDone={() => {
                      setHelp(false)
                      setOnboardingSeen(true)
                    }}
                  />
                </Panel>
              ) : null}
            </FlowCanvas>
          </div>
        </div>
        {panel ? (
          <button className="absolute inset-0 z-30 bg-black/30 lg:hidden" aria-label="Закрыть панель" onClick={() => setPanel(false)} />
        ) : null}
        <aside
          className={cn(
            'w-[min(100%,320px)] shrink-0 border-l border-line bg-surface',
            'max-lg:absolute max-lg:inset-y-0 max-lg:right-0 max-lg:z-40 max-lg:shadow-[var(--shadow)]',
            panel ? 'max-lg:translate-x-0' : 'max-lg:translate-x-full',
            'lg:static lg:z-auto lg:translate-x-0 lg:shadow-none',
          )}
        >
          <Inspector
            summary={summary}
            onSummary={setSummary}
            node={selectedNode}
            edge={selectedNode ? undefined : selectedEdge}
            onPatchNode={patchNode}
            onPatchEdge={patchEdge}
            onDeleteNode={removeNode}
            onDeleteEdge={removeEdge}
            onEditStart={remember}
            onClose={() => setPanel(false)}
          />
        </aside>
      </div>

      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
      <Modal open={authOpen} title="Ссылку может отправить аккаунт Pro" onClose={() => setAuthOpen(false)}>
        <p>Сначала войдите. Гостевая схема уже лежит на сервере и привяжется к аккаунту.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button to={`/register?next=/editor/${doc.id}`}>Создать аккаунт</Button>
          <Button variant="secondary" onClick={() => setAuthOpen(false)}>
            Позже
          </Button>
        </div>
      </Modal>
      <Modal open={proOpen} title="Публичные ссылки — в Pro" onClose={() => setProOpen(false)}>
        <p>На Free схему можно скачать PNG. Ссылку, которая открывается на другом устройстве, включает Pro.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button to="/pricing">Открыть тарифы</Button>
          <Button variant="secondary" onClick={() => setProOpen(false)}>
            Закрыть
          </Button>
        </div>
      </Modal>
      <Modal open={Boolean(shareUrl)} title="Ссылка на схему" onClose={() => setShareUrl(null)}>
        <p>Ссылка открывает схему с сервера. Её увидит каждый, у кого она есть. Пароль на ссылку появится позже.</p>
        <input className="mt-3 w-full rounded-xl border border-line bg-paper px-3 py-2 text-xs" readOnly value={shareUrl ?? ''} />
        <div className="mt-4">
          <Button
            onClick={() => {
              if (!shareUrl) return
              void navigator.clipboard.writeText(shareUrl)
              toast('Ссылка скопирована')
            }}
          >
            Копировать ещё раз
          </Button>
        </div>
      </Modal>
      <Modal open={confirmDelete} title="Удалить этот процесс?" onClose={() => setConfirmDelete(false)}>
        <p>Схема удалится с сервера. Скачанный PNG останется у вас.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="danger"
            onClick={() => {
              void deleteProcess(doc.id).then(() => navigate('/processes'))
            }}
          >
            Удалить
          </Button>
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Оставить
          </Button>
        </div>
      </Modal>
    </div>
  )
}

function Missing({ title, text, action }: { title: string; text: string; action?: { to: string; label: string } }) {
  return (
    <div className="mx-auto max-w-xl px-5 py-24 text-center">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-3 text-muted">{text}</p>
      <div className="mt-6">
        <Button to={action?.to ?? '/create'}>{action?.label ?? 'Создать процесс'}</Button>
      </div>
    </div>
  )
}
