import type { ProcessNode } from '../types'

export function Notes({ nodes }: { nodes: ProcessNode[] }) {
  const bottlenecks = nodes.filter((node) => node.data.bottleneck)
  const automations = nodes.filter((node) => node.data.automation)
  if (bottlenecks.length === 0 && automations.length === 0) return null

  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <NoteColumn
        title="Узкие места"
        tone="danger"
        items={bottlenecks.map((node) => ({
          title: node.data.label,
          text: node.data.bottleneckNote || 'Без комментария',
        }))}
      />
      <NoteColumn
        title="Точки автоматизации"
        tone="auto"
        items={automations.map((node) => ({
          title: node.data.label,
          text: node.data.automationNote || 'Без комментария',
        }))}
      />
    </div>
  )
}

function NoteColumn({
  title,
  tone,
  items,
}: {
  title: string
  tone: 'danger' | 'auto'
  items: { title: string; text: string }[]
}) {
  if (items.length === 0) return null
  return (
    <section className="rounded-3xl border border-line bg-surface p-5">
      <h2 className={`text-sm font-semibold ${tone === 'danger' ? 'text-danger' : 'text-auto'}`}>{title}</h2>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={`${item.title}-${item.text}`}>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm leading-6 text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
