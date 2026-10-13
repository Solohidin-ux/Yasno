import { buildFromSteps } from './graph'
import type { NodeKind, StepDef } from '../types'

export const SAMPLE_DESCRIPTION = `Клиент оставляет заявку на сайте
Менеджер уточняет задачу | 20 мин | менеджер
Бюджет подходит?
Готовим коммерческое предложение | 1 день | менеджер
Клиент согласен?
Договор и счёт | финансы
Оплата | 2 дня
Передача в работу`

const ARROW = /\s*(?:→|->|=>|⇒)\s*/

export function parseDescription(text: string) {
  const summary = text.trim()
  const pieces: string[] = []
  for (const line of summary.split(/\n+/)) {
    for (const part of line.split(ARROW)) {
      const clean = part.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)/, '').trim()
      if (clean) pieces.push(clean)
    }
  }
  if (pieces.length === 0) return null

  const items: { label: string; kind: NodeKind; owner?: string; duration?: string }[] = pieces.map(parsePiece)
  if (!items.some((item) => item.kind === 'start')) items.unshift({ label: 'Старт', kind: 'start' })
  if (!items.some((item) => item.kind === 'end')) items.push({ label: 'Финиш', kind: 'end' })

  const steps: StepDef[] = items.map((item, index) => ({
    key: `s${index + 1}`,
    label: item.label,
    kind: item.kind,
    owner: item.owner,
    duration: item.duration,
  }))
  const links = steps.slice(1).map((step, index) => ({
    source: steps[index].key,
    target: step.key,
  }))
  const graph = buildFromSteps(steps, links)
  const titleSource = items.find((item) => item.kind === 'action')?.label ?? 'Новый процесс'
  const title = titleSource.length > 52 ? `${titleSource.slice(0, 52).trim()}…` : titleSource
  return { title, summary, ...graph }
}

function parsePiece(piece: string) {
  const bits = piece.split('|').map((bit) => bit.trim()).filter(Boolean)
  const label = bits[0] ?? piece
  let owner: string | undefined
  let duration: string | undefined
  for (const bit of bits.slice(1)) {
    if (isDuration(bit)) duration = bit
    else owner = bit
  }
  return { label, kind: kindOf(label), owner, duration }
}

function isDuration(value: string) {
  return /\d/.test(value) && /(мин|час|день|дн|нед|сут)/i.test(value)
}

function kindOf(label: string): NodeKind {
  const text = label.trim()
  if (/^(старт|начало)\b/i.test(text) && text.length < 28) return 'start'
  if (/^(финиш|конец|завершение|готово)\b/i.test(text) && text.length < 28) return 'end'
  if (/^(если|когда|при условии)\b/i.test(text) || /\?\s*$/.test(text)) return 'decision'
  return 'action'
}
