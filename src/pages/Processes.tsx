import { Copy, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LimitDialog } from '../components/LimitDialog'
import { Marketing } from '../components/SiteChrome'
import { Button, fieldClass, Modal } from '../components/ui'
import { getTemplate } from '../data/templates'
import { deleteProcess, duplicateProcess } from '../lib/db'
import { formatWhen, plural } from '../lib/format'
import { useApp } from '../lib/useApp'
import { useTitle } from '../lib/useTitle'
import type { ProcessDoc } from '../types'

export function ProcessesPage() {
  useTitle('Мои процессы')
  const navigate = useNavigate()
  const { user, mine, drafts, pro } = useApp()
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState<ProcessDoc | null>(null)
  const [limitOpen, setLimitOpen] = useState(false)
  const visible = user ? mine : mine
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return visible
    return visible.filter((doc) => `${doc.title} ${doc.summary}`.toLowerCase().includes(needle))
  }, [query, visible])

  async function copy(doc: ProcessDoc) {
    const result = await duplicateProcess(doc.id)
    if (!result.ok) {
      setLimitOpen(true)
      return
    }
    navigate(`/editor/${result.process.id}`)
  }

  return (
    <Marketing>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">{user ? 'Мои процессы' : 'Гостевые схемы'}</h1>
            <p className="mt-2 text-muted">
              {user
                ? `${user.name} · ${pro ? 'Pro' : `Free, ${mine.length} из 3`}`
                : 'Они уже на сервере, но привязаны к этому браузеру, пока вы не войдёте.'}
            </p>
          </div>
          <Button to="/create">Новый процесс</Button>
        </div>

        {!user ? (
          <div className="mt-6 rounded-3xl border border-line bg-surface p-4 text-sm">
            <Link to="/register?next=/processes" className="font-semibold text-accent">
              Создать аккаунт
            </Link>
            <span className="text-muted"> — гостевые схемы перейдут на вашу почту.</span>
          </div>
        ) : null}

        {visible.length > 3 ? (
          <input
            className={`${fieldClass} mt-6 max-w-sm`}
            placeholder="Найти схему"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        ) : null}

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-dashed border-line bg-surface px-6 py-16 text-center">
            <h2 className="font-display text-2xl">Пока пусто</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              Первый процесс лучше взять из шаблона продаж или поддержки — и сразу отметить одно узкое место.
            </p>
            <div className="mt-5">
              <Button to="/create">Создать процесс</Button>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {filtered.map((doc) => (
              <ProcessCard key={doc.id} doc={doc} onCopy={() => copy(doc)} onDelete={() => setPending(doc)} />
            ))}
          </div>
        )}

        {drafts.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl">Черновики, которые не влезли в Free</h2>
            <p className="mt-2 text-sm text-muted">Они остались на устройстве. Включите Pro — и они перейдут в аккаунт.</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {drafts.map((doc) => (
                <ProcessCard key={doc.id} doc={doc} onCopy={() => copy(doc)} onDelete={() => setPending(doc)} />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <Modal open={Boolean(pending)} title="Удалить схему?" onClose={() => setPending(null)}>
        <p>«{pending?.title}» удалится с сервера.</p>
        <div className="mt-5 flex gap-2">
          <Button
            variant="danger"
            onClick={() => {
              if (pending) void deleteProcess(pending.id)
              setPending(null)
            }}
          >
            Удалить
          </Button>
          <Button variant="secondary" onClick={() => setPending(null)}>
            Оставить
          </Button>
        </div>
      </Modal>
      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </Marketing>
  )
}

function ProcessCard({ doc, onCopy, onDelete }: { doc: ProcessDoc; onCopy: () => void; onDelete: () => void }) {
  const template = doc.templateId ? getTemplate(doc.templateId) : undefined
  const bottlenecks = doc.nodes.filter((node) => node.data.bottleneck).length
  const automations = doc.nodes.filter((node) => node.data.automation).length
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{doc.title}</h2>
          <p className="mt-1 text-sm text-muted">
            {formatWhen(doc.updatedAt)}
            {template ? ` · ${template.title}` : ''}
            {doc.isPublic ? ' · есть ссылка' : ''}
          </p>
        </div>
        <p className="text-xs text-muted">{plural(doc.nodes.length, 'блок', 'блока', 'блоков')}</p>
      </div>
      {doc.summary ? <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted">{doc.summary}</p> : null}
      <p className="mt-3 text-xs font-semibold">
        {bottlenecks ? <span className="text-danger">Узких мест {bottlenecks}</span> : null}
        {bottlenecks && automations ? <span className="text-muted"> · </span> : null}
        {automations ? <span className="text-auto">Автоматизаций {automations}</span> : null}
        {!bottlenecks && !automations ? <span className="text-muted">Меток пока нет</span> : null}
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" to={`/editor/${doc.id}`}>
          Открыть
        </Button>
        <Button size="sm" variant="secondary" onClick={onCopy} aria-label="Дублировать">
          <Copy size={14} />
          Копия
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} aria-label="Удалить">
          <Trash2 size={14} />
        </Button>
      </div>
    </article>
  )
}
