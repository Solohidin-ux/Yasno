import { useState } from 'react'
import { LimitDialog } from '../components/LimitDialog'
import { Marketing } from '../components/SiteChrome'
import { Button, fieldClass } from '../components/ui'
import { templates } from '../data/templates'
import { SAMPLE_DESCRIPTION } from '../lib/parse'
import { useStart } from '../lib/useStart'
import { useApp } from '../lib/useApp'
import { useTitle } from '../lib/useTitle'

export function CreatePage() {
  useTitle('Создать процесс')
  const { atLimit, pro, used } = useApp()
  const { fromTemplate, fromText, limitOpen, setLimitOpen } = useStart()
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  return (
    <Marketing>
      <div className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-sm font-semibold text-accent">Новый процесс</p>
        <h1 className="mt-2 font-display text-4xl">Шаблон или свои слова</h1>
        <p className="mt-3 max-w-2xl text-muted">
          Шаблон сразу открывает схему. Текст режется на этапы: каждая строка — шаг, стрелка → тоже подходит, вопрос
          становится решением.
        </p>
        {atLimit ? (
          <p className="mt-4 rounded-2xl border border-ember/40 bg-surface px-4 py-3 text-sm">
            На бесплатном плане уже {used} из 3 схем. Удалите одну или включите Pro.
          </p>
        ) : (
          <p className="mt-4 text-sm text-muted">{pro ? 'Pro · без лимита' : `Бесплатно · ${used} из 3`}</p>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section>
            <h2 className="text-lg font-semibold">Из шаблона</h2>
            <div className="mt-4 grid gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  disabled={atLimit}
                  onClick={() => fromTemplate(template)}
                  className="rounded-3xl border border-line bg-surface p-4 text-left hover:border-accent disabled:opacity-50"
                >
                  <span className="font-semibold">{template.title}</span>
                  <span className="mt-1 block text-sm text-muted">{template.summary}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="h-fit rounded-[28px] border border-line bg-surface p-5">
            <h2 className="text-lg font-semibold">Своими словами</h2>
            <p className="mt-1 text-sm text-muted">
              Можно дописать время и роль через вертикальную черту: «Оплата | 2 дня | финансы».
            </p>
            <textarea
              className={`${fieldClass} mt-4 min-h-64`}
              placeholder={SAMPLE_DESCRIPTION}
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setError('')
              }}
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                variant="accent"
                disabled={atLimit}
                onClick={() => {
                  void fromText(text).then((result) => {
                    if (result === 'empty') setError('Напишите хотя бы один этап — каждый с новой строки.')
                    if (result === 'error') setError('Не удалось сохранить схему. Проверьте, что сервер запущен.')
                  })
                }}
              >
                Создать схему
              </Button>
              <Button variant="secondary" onClick={() => setText(SAMPLE_DESCRIPTION)}>
                Подставить пример
              </Button>
            </div>
            {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
          </section>
        </div>
      </div>
      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </Marketing>
  )
}
