import { Marketing } from '../components/SiteChrome'
import { Button } from '../components/ui'
import { useTitle } from '../lib/useTitle'

const later = [
  'Разбор текста моделью и подсказки, где процесс обычно стоит',
  'PDF с легендой',
  'Картинка для Miro и FigJam',
  'История версий',
  'Командный доступ',
  'Ссылка с паролем',
]

export function AboutPage() {
  useTitle('Как это работает')
  return (
    <Marketing>
      <article className="mx-auto max-w-3xl px-5 py-14">
        <p className="text-sm font-semibold text-accent">О продукте</p>
        <h1 className="mt-2 font-display text-4xl leading-tight">Процесс, который можно показать, а не пересказать</h1>
        <div className="mt-6 space-y-4 text-base leading-7 text-muted">
          <p>
            В небольшой компании схема продаж живёт у одного менеджера, онбординг — у HR, а жалоба — в голове того, кто
            вчера отвечал клиенту. Пока человек на месте, процесс «есть». Когда он в отпуске, процесс исчезает.
          </p>
          <p>
            Ясно делает короткую схему: этапы, решения, кто отвечает и сколько это занимает. Поверх неё две метки.
            Узкое место — где работа копится. Точка автоматизации — какой шаг уже не обязан делать человек.
          </p>
          <p>
            Это не система управления процессами и не замена регламенту на двадцать страниц. Это рисунок, который
            успевают сделать до совещания.
          </p>
        </div>
        <h2 className="mt-12 font-display text-2xl">Что уже можно сделать</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          <li>Семь шаблонов: продажи, онбординг, поддержка, заказ, закупка, жалоба, запуск.</li>
          <li>Свой текст: строка — этап, вопрос — решение, через черту можно указать время и роль.</li>
          <li>Редактор: блоки, стрелки, перетаскивание, ответственный, время.</li>
          <li>Красная и синяя метки с комментарием, они попадают в PNG.</li>
          <li>Аккаунт на сервере и список своих схем. На Free — три процесса и отметка на файле.</li>
        </ul>
        <h2 className="mt-12 font-display text-2xl">Что сознательно позже</h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-muted">
          {later.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm leading-6 text-muted">
          Аккаунт и схемы лежат на сервере. Пароль хранится как хеш. Публичная ссылка открывает схему по адресу, её
          видит каждый, у кого она есть.
        </p>
        <div className="mt-8">
          <Button to="/create" size="lg">
            Собрать схему
          </Button>
        </div>
      </article>
    </Marketing>
  )
}
