import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Marketing } from '../components/SiteChrome'
import { Button } from '../components/ui'
import { useToast } from '../context/ToastContext'
import { setPlan } from '../lib/db'
import { useApp } from '../lib/useApp'
import { useTitle } from '../lib/useTitle'

const freePoints = [
  '3 процесса',
  'Редактор схемы и метки',
  'Экспорт PNG',
  'Отметка «Ясно · бесплатная версия» на файле',
]

const proPoints = [
  'Без лимита процессов',
  'PNG без отметки',
  'Ссылка, которая открывается на другом устройстве',
  'Приоритетная поддержка — вместе с оплатой',
  'PDF и разбор текста через модель — следующая версия',
]

export function PricingPage() {
  useTitle('Тарифы')
  const { user, pro } = useApp()
  const toast = useToast()
  const navigate = useNavigate()

  function enablePro() {
    if (!user) {
      navigate('/register?next=/pricing')
      return
    }
    void setPlan('pro').then(() => toast('Pro включён для этого аккаунта'))
  }

  return (
    <Marketing>
      <div className="mx-auto max-w-6xl px-5 py-14">
        <p className="text-sm font-semibold text-accent">Тарифы</p>
        <h1 className="mt-2 max-w-2xl font-display text-4xl">Сначала схема. Подписка — когда процессов станет больше трёх.</h1>
        <p className="mt-4 max-w-2xl text-muted">
          Рекомендуемая цена Pro — 990 ₽ в месяц. Оплату ещё не подключили: кнопка ниже только записывает тариф в базу,
          деньги не списываются.
        </p>
        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-[28px] border border-line bg-surface p-6">
            <h2 className="font-display text-2xl">Free</h2>
            <p className="mt-2 text-3xl font-semibold">0 ₽</p>
            <ul className="mt-6 space-y-3 text-sm">
              {freePoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Button to="/create" variant="secondary">
                Начать бесплатно
              </Button>
            </div>
          </article>
          <article className="rounded-[28px] border border-accent bg-surface p-6">
            <h2 className="font-display text-2xl">Pro</h2>
            <p className="mt-2 text-3xl font-semibold">990 ₽ <span className="text-base font-medium text-muted">/ месяц</span></p>
            <ul className="mt-6 space-y-3 text-sm">
              {proPoints.map((point) => (
                <li key={point} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-2">
              {pro ? (
                <Button
                  variant="secondary"
                  onClick={() => {
                    void setPlan('free').then(() => toast('Снова Free. Уже созданные схемы не удалятся'))
                  }}
                >
                  Pro включён · вернуть Free
                </Button>
              ) : (
                <Button variant="accent" onClick={enablePro}>
                  {user ? 'Включить Pro' : 'Создать аккаунт и включить Pro'}
                </Button>
              )}
            </div>
          </article>
        </div>
      </div>
    </Marketing>
  )
}
