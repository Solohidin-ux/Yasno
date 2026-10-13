import { useState } from 'react'
import { Button } from '../ui'

const steps = [
  {
    title: 'Расставьте этапы',
    text: 'Кнопки слева добавляют блок. Хватайте его и переносите туда, где он должен стоять в процессе.',
  },
  {
    title: 'Свяжите шаги',
    text: 'Потяните от точки на краю одного блока к другому. У решения подпишите стрелки: «Да» и «Нет».',
  },
  {
    title: 'Отметьте важное',
    text: 'Выберите блок справа и поставьте узкое место или точку автоматизации. Комментарий попадёт в PNG. Delete удаляет, Ctrl+Z отменяет.',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const current = steps[step]
  const last = step === steps.length - 1

  return (
    <div className="w-[min(92vw,24rem)] rounded-3xl border border-line bg-surface p-4 text-left shadow-[var(--shadow)]">
      <p className="text-xs font-semibold text-accent">
        Подсказка {step + 1} из {steps.length}
      </p>
      <h2 className="mt-1 font-display text-lg">{current.title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted">{current.text}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        <button className="text-sm text-muted" onClick={onDone}>
          Пропустить
        </button>
        <Button
          size="sm"
          onClick={() => {
            if (last) onDone()
            else setStep((value) => value + 1)
          }}
        >
          {last ? 'Понятно' : 'Дальше'}
        </Button>
      </div>
    </div>
  )
}
