export function plural(count: number, one: string, few: string, many: string) {
  const mod100 = Math.abs(count) % 100
  const mod10 = mod100 % 10
  if (mod100 > 10 && mod100 < 20) return `${count} ${many}`
  if (mod10 > 1 && mod10 < 5) return `${count} ${few}`
  if (mod10 === 1) return `${count} ${one}`
  return `${count} ${many}`
}

export function formatWhen(ts: number) {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'только что'
  if (diff < 3_600_000) {
    const minutes = Math.max(1, Math.floor(diff / 60_000))
    return `${minutes} мин назад`
  }
  const date = new Date(ts)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) return 'сегодня'
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return 'вчера'
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
}

export function formatLongDate(ts: number) {
  return new Date(ts).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function fileSlug(title: string) {
  const clean = title
    .replace(/[^\p{L}\p{N}\s_-]+/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  return clean || 'shema'
}

export function safeNext(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/processes'
  return value
}
