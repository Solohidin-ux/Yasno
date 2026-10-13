import type { NodeKind, ProcessEdge, ProcessNode, ProcessNodeData } from '../../types'
import { Button, Field, fieldClass } from '../ui'

const OWNERS = ['Менеджер', 'Руководитель', 'Поддержка', 'Финансы', 'Клиент', 'IT']
const DURATIONS = ['15 мин', '1 час', '1 день', '3 дня']

type Props = {
  summary: string
  onSummary: (value: string) => void
  node?: ProcessNode
  edge?: ProcessEdge
  onPatchNode: (id: string, patch: Partial<ProcessNodeData>) => void
  onPatchEdge: (id: string, label: string) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
  onEditStart: () => void
  onClose?: () => void
}

export function Inspector({
  summary,
  onSummary,
  node,
  edge,
  onPatchNode,
  onPatchEdge,
  onDeleteNode,
  onDeleteEdge,
  onEditStart,
  onClose,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <p className="text-sm font-semibold">{node ? 'Блок' : edge ? 'Стрелка' : 'О процессе'}</p>
        {onClose ? (
          <button className="text-sm text-muted lg:hidden" onClick={onClose}>
            Закрыть
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {node ? <NodeForm node={node} onPatchNode={onPatchNode} onDeleteNode={onDeleteNode} onEditStart={onEditStart} /> : null}
        {!node && edge ? (
          <EdgeForm edge={edge} onPatchEdge={onPatchEdge} onDeleteEdge={onDeleteEdge} onEditStart={onEditStart} />
        ) : null}
        {!node && !edge ? (
          <>
            <Field label="Кратко" hint="Пара слов, чтобы потом узнать схему в списке.">
              <textarea
                className={`${fieldClass} min-h-24 resize-y`}
                value={summary}
                onFocus={onEditStart}
                onChange={(event) => onSummary(event.target.value)}
              />
            </Field>
            <div className="rounded-2xl border border-line bg-paper p-3 text-sm leading-6 text-muted">
              <p className="font-semibold text-ink">Как читать схему</p>
              <p className="mt-1">Прямоугольник — этап. Ромб — решение. Стрелка — что за чем идёт.</p>
              <p className="mt-2">
                <span className="font-semibold text-danger">Красным</span> отмечают узкое место,{' '}
                <span className="font-semibold text-auto">синим</span> — то, что можно отдать системе.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function NodeForm({
  node,
  onPatchNode,
  onDeleteNode,
  onEditStart,
}: {
  node: ProcessNode
  onPatchNode: (id: string, patch: Partial<ProcessNodeData>) => void
  onDeleteNode: (id: string) => void
  onEditStart: () => void
}) {
  const data = node.data
  const terminal = data.kind === 'start' || data.kind === 'end'
  const patch = (next: Partial<ProcessNodeData>) => onPatchNode(node.id, next)

  return (
    <>
      <Field label="Тип">
        <select
          className={fieldClass}
          value={data.kind}
          onFocus={onEditStart}
          onChange={(event) => patch({ kind: event.target.value as NodeKind })}
        >
          <option value="action">Этап</option>
          <option value="decision">Решение</option>
          <option value="start">Начало</option>
          <option value="end">Конец</option>
        </select>
      </Field>
      <Field label="Название">
        <input
          className={fieldClass}
          value={data.label}
          onFocus={onEditStart}
          onChange={(event) => patch({ label: event.target.value })}
        />
      </Field>
      {terminal ? null : (
        <>
          <Field label="Ответственный" hint="Роль или имя.">
            <input
              className={fieldClass}
              value={data.owner ?? ''}
              placeholder="Например, менеджер"
              onFocus={onEditStart}
              onChange={(event) => patch({ owner: event.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {OWNERS.map((owner) => (
                <button
                  key={owner}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
                  onClick={() => {
                    onEditStart()
                    patch({ owner })
                  }}
                >
                  {owner}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Время этапа">
            <input
              className={fieldClass}
              value={data.duration ?? ''}
              placeholder="20 мин"
              onFocus={onEditStart}
              onChange={(event) => patch({ duration: event.target.value })}
            />
            <div className="mt-2 flex flex-wrap gap-1.5">
              {DURATIONS.map((duration) => (
                <button
                  key={duration}
                  className="rounded-full border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
                  onClick={() => {
                    onEditStart()
                    patch({ duration })
                  }}
                >
                  {duration}
                </button>
              ))}
            </div>
          </Field>
          <Toggle
            checked={Boolean(data.bottleneck)}
            title="Узкое место"
            tone="danger"
            note={data.bottleneckNote ?? ''}
            placeholder="Почему здесь стопорится?"
            onToggle={(checked) => {
              onEditStart()
              patch({ bottleneck: checked })
            }}
            onNote={(bottleneckNote) => patch({ bottleneckNote })}
            onFocus={onEditStart}
          />
          <Toggle
            checked={Boolean(data.automation)}
            title="Точка автоматизации"
            tone="auto"
            note={data.automationNote ?? ''}
            placeholder="Что можно отдать системе?"
            onToggle={(checked) => {
              onEditStart()
              patch({ automation: checked })
            }}
            onNote={(automationNote) => patch({ automationNote })}
            onFocus={onEditStart}
          />
        </>
      )}
      <Button variant="danger" className="w-full" onClick={() => onDeleteNode(node.id)}>
        Удалить блок
      </Button>
    </>
  )
}

function Toggle({
  checked,
  title,
  tone,
  note,
  placeholder,
  onToggle,
  onNote,
  onFocus,
}: {
  checked: boolean
  title: string
  tone: 'danger' | 'auto'
  note: string
  placeholder: string
  onToggle: (checked: boolean) => void
  onNote: (value: string) => void
  onFocus: () => void
}) {
  return (
    <div className={`rounded-2xl border p-3 ${checked ? (tone === 'danger' ? 'border-danger bg-danger-soft' : 'border-auto bg-auto-soft') : 'border-line'}`}>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={checked} onChange={(event) => onToggle(event.target.checked)} />
        <span className={tone === 'danger' ? 'text-danger' : 'text-auto'}>{title}</span>
      </label>
      {checked ? (
        <textarea
          className={`${fieldClass} mt-2 min-h-20 bg-surface`}
          value={note}
          placeholder={placeholder}
          onFocus={onFocus}
          onChange={(event) => onNote(event.target.value)}
        />
      ) : null}
    </div>
  )
}

function EdgeForm({
  edge,
  onPatchEdge,
  onDeleteEdge,
  onEditStart,
}: {
  edge: ProcessEdge
  onPatchEdge: (id: string, label: string) => void
  onDeleteEdge: (id: string) => void
  onEditStart: () => void
}) {
  const label = typeof edge.label === 'string' ? edge.label : ''
  return (
    <>
      <Field label="Подпись" hint="Удобно для «да» и «нет» у решений.">
        <input
          className={fieldClass}
          value={label}
          placeholder="Да"
          onFocus={onEditStart}
          onChange={(event) => onPatchEdge(edge.id, event.target.value)}
        />
      </Field>
      <div className="flex gap-2">
        {['Да', 'Нет'].map((value) => (
          <button
            key={value}
            className="rounded-full border border-line px-3 py-1.5 text-sm"
            onClick={() => {
              onEditStart()
              onPatchEdge(edge.id, value)
            }}
          >
            {value}
          </button>
        ))}
      </div>
      <Button variant="danger" className="w-full" onClick={() => onDeleteEdge(edge.id)}>
        Удалить стрелку
      </Button>
    </>
  )
}
