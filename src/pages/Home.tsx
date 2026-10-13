import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FlowCanvas } from '../components/flow/FlowCanvas'
import { LimitDialog } from '../components/LimitDialog'
import { Marketing } from '../components/SiteChrome'
import { Button } from '../components/ui'
import { homePreviewGraph, templates } from '../data/templates'
import { useStart } from '../lib/useStart'
import { useTitle } from '../lib/useTitle'

const steps = [
  {
    n: '01',
    title: 'Шаблон или текст',
    text: 'Возьмите готовую схему продаж, поддержки, закупки — или опишите процесс так, как рассказываете коллеге.',
  },
  {
    n: '02',
    title: 'Схема, которую можно поправить',
    text: 'Этапы, решения, ответственные и время. Лишнее убирается, пропущенное добавляется за минуту.',
  },
  {
    n: '03',
    title: 'Метки и файл',
    text: 'Красным — где процесс стоит. Синим — что уже можно отдать системе. Потом PNG на планёрку.',
  },
]

const people = [
  { title: 'Владелец', text: 'Когда спрашивают «как у нас продаётся», ответ больше не рисуют заново на доске.' },
  { title: 'Руководитель отдела', text: 'Новый человек видит путь заявки, а не ищет его в переписке.' },
  { title: 'Операционный директор', text: 'Узкое место видно на схеме, а не всплывает через месяц в отчёте.' },
  { title: 'Аналитик и IT', text: 'На схеме уже отмечено, какой шаг автоматизировать и почему.' },
]

export function HomePage() {
  useTitle('Ясно')
  const preview = useMemo(() => homePreviewGraph(), [])
  const { fromTemplate, limitOpen, setLimitOpen } = useStart()

  return (
    <Marketing>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <p className="text-sm font-semibold text-accent">Для малого и среднего бизнеса</p>
          <h1 className="mt-4 font-display text-4xl leading-[1.08] sm:text-6xl">
            Процессы перестают жить только в головах
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
            За 5–10 минут — схема из шаблона или обычного текста. На ней видно этапы, узкие места и то, что уже можно
            автоматизировать.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/create" size="lg">
              Создать процесс
            </Button>
            <Button to="/example/sales" size="lg" variant="secondary">
              Смотреть пример
            </Button>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="font-display text-2xl">5–10</dt>
              <dd className="mt-1 text-muted">минут до схемы</dd>
            </div>
            <div>
              <dt className="font-display text-2xl">7</dt>
              <dd className="mt-1 text-muted">готовых шаблонов</dd>
            </div>
            <div>
              <dt className="font-display text-2xl">PNG</dt>
              <dd className="mt-1 text-muted">сразу на планёрку</dd>
            </div>
          </dl>
        </div>
        <div className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-[var(--shadow)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold">Продажи</p>
            <p className="text-xs text-muted">пример: узкое место и автоматизация</p>
          </div>
          <div className="pointer-events-none h-[560px] lg:h-[640px]">
            <FlowCanvas mode="static" nodes={preview.nodes} edges={preview.edges} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="font-display text-3xl">Как это происходит</h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((step) => (
            <article key={step.n} className="rounded-3xl border border-line bg-surface p-5">
              <p className="font-display text-sm text-accent">{step.n}</p>
              <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-3xl">Начните с чужого каркаса</h2>
          <Link to="/create" className="text-sm font-semibold text-accent">
            Все способы создать
          </Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {templates.map((template) => (
            <article key={template.id} className="flex flex-col rounded-3xl border border-line bg-surface p-5">
              <h3 className="text-lg font-semibold">{template.title}</h3>
              <p className="mt-1 text-sm text-muted">{template.blurb}</p>
              <p className="mt-4 text-sm leading-6 text-ink/80">
                {template.steps
                  .filter((step) => step.kind !== 'start' && step.kind !== 'end')
                  .slice(0, 4)
                  .map((step) => step.label)
                  .join(' → ')}
              </p>
              <div className="mt-5 flex gap-2">
                <Button size="sm" onClick={() => fromTemplate(template)}>
                  Взять шаблон
                </Button>
                <Button size="sm" variant="secondary" to={`/example/${template.id}`}>
                  Пример
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-5 py-8 md:grid-cols-2">
        <article className="rounded-3xl border border-danger/30 bg-danger-soft p-6">
          <p className="text-sm font-bold text-danger">Узкое место</p>
          <h2 className="mt-2 font-display text-2xl">Где процесс стоит</h2>
          <p className="mt-3 text-sm leading-6">
            Красная метка и короткая причина: «ждём менеджера», «согласование в чате». На планёрке это видно без
            рассказа.
          </p>
        </article>
        <article className="rounded-3xl border border-auto/30 bg-auto-soft p-6">
          <p className="text-sm font-bold text-auto">Точка автоматизации</p>
          <h2 className="mt-2 font-display text-2xl">Что можно отдать системе</h2>
          <p className="mt-3 text-sm leading-6">
            Синяя метка говорит, какой шаг уже не обязан делать человек: счёт, напоминание, маршрутизация тикета.
          </p>
        </article>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="font-display text-3xl">Кому это нужно в понедельник утром</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {people.map((person) => (
            <article key={person.title} className="rounded-3xl border border-line bg-surface p-5">
              <h3 className="font-semibold">{person.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{person.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-[28px] bg-ink px-6 py-10 text-on-ink sm:px-10">
          <h2 className="font-display text-3xl">Три схемы бесплатно</h2>
          <p className="mt-3 max-w-xl text-sm leading-6 opacity-80">
            PNG с отметкой Ясно. Pro снимает лимит, убирает отметку и даёт ссылку, которую можно открыть на другом
            устройстве.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button to="/create" variant="accent" size="lg">
              Собрать первую схему
            </Button>
            <Link to="/pricing" className="inline-flex h-12 items-center px-2 text-sm font-semibold">
              Смотреть тарифы
            </Link>
          </div>
        </div>
      </section>
      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </Marketing>
  )
}
