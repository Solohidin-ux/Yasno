import type { ReactNode } from 'react'
import { FlowCanvas } from '../components/flow/FlowCanvas'
import { Notes } from '../components/Notes'
import { Marketing } from '../components/SiteChrome'
import type { ProcessEdge, ProcessNode } from '../types'

export function SchemeFrame({
  title,
  kicker,
  summary,
  nodes,
  edges,
  actions,
}: {
  title: string
  kicker?: string
  summary?: string
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  actions?: ReactNode
}) {
  return (
    <Marketing>
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            {kicker ? <p className="text-sm font-semibold text-accent">{kicker}</p> : null}
            <h1 className="mt-1 font-display text-4xl">{title}</h1>
            {summary ? <p className="mt-3 text-muted">{summary}</p> : null}
          </div>
          <div className="flex flex-wrap gap-2">{actions}</div>
        </div>
        <div className="mt-6 h-[70vh] min-h-[520px] overflow-hidden rounded-[28px] border border-line bg-surface">
          <FlowCanvas mode="view" nodes={nodes} edges={edges} />
        </div>
        <Notes nodes={nodes} />
      </div>
    </Marketing>
  )
}
