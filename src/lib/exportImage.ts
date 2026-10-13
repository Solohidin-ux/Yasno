import { getViewportForBounds, type Node, type Rect } from '@xyflow/react'
import { toPng } from 'html-to-image'
import type { ProcessNodeData } from '../types'
import { formatLongDate, fileSlug } from './format'
import { palettes, type Palette } from './palette'

type ExportNode = Node<ProcessNodeData>

export async function exportProcessPng(options: {
  title: string
  nodes: ExportNode[]
  bounds: Rect
  viewport: HTMLElement
  theme: 'light' | 'dark'
  watermark: boolean
}) {
  const { title, nodes, bounds, viewport, theme, watermark } = options
  const colors = palettes[theme]
  const padding = 48
  const width = Math.round(Math.min(2800, Math.max(1100, bounds.width + padding * 2)))
  const height = Math.round(Math.min(1800, Math.max(640, bounds.height + padding * 2)))
  const fitted = getViewportForBounds(bounds, width, height, 0.4, 1.4, 40)
  const pixelRatio = 2

  viewport.parentElement?.classList.add('exporting')
  let flowUrl = ''
  try {
    flowUrl = await toPng(viewport, {
      backgroundColor: colors.paper,
      width,
      height,
      pixelRatio,
      skipFonts: true,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${fitted.x}px, ${fitted.y}px) scale(${fitted.zoom})`,
      },
    })
  } finally {
    viewport.parentElement?.classList.remove('exporting')
  }

  const notes = collectNotes(nodes)
  const dataUrl = await compose(flowUrl, {
    title,
    colors,
    watermark,
    notes,
    pixelRatio,
  })
  download(dataUrl, `${fileSlug(title)}.png`)
}

function collectNotes(nodes: ExportNode[]) {
  const notes: { tone: 'danger' | 'auto'; title: string; text: string }[] = []
  for (const node of nodes) {
    if (node.data.bottleneck) {
      notes.push({
        tone: 'danger',
        title: node.data.label,
        text: node.data.bottleneckNote?.trim() || 'Узкое место',
      })
    }
    if (node.data.automation) {
      notes.push({
        tone: 'auto',
        title: node.data.label,
        text: node.data.automationNote?.trim() || 'Точка автоматизации',
      })
    }
  }
  return notes.slice(0, 12)
}

async function compose(
  flowUrl: string,
  options: {
    title: string
    colors: Palette
    watermark: boolean
    notes: { tone: 'danger' | 'auto'; title: string; text: string }[]
    pixelRatio: number
  },
) {
  await document.fonts.load('600 32px Manrope')
  await document.fonts.load('400 16px Manrope')
  const image = await loadImage(flowUrl)
  const ratio = options.pixelRatio
  const pad = 36 * ratio
  const titleSize = 28 * ratio
  const bodySize = 15 * ratio
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Не удалось подготовить изображение')

  ctx.font = `600 ${titleSize}px Manrope, sans-serif`
  const titleLines = wrap(ctx, options.title, image.width - pad * 2).slice(0, 2)
  const noteLines = options.notes.length + (options.notes.length ? 1 : 0)
  const header = pad + titleLines.length * titleSize * 1.25 + 28 * ratio
  const footerBase = (options.watermark ? 56 : 28) * ratio
  const footer = footerBase + noteLines * bodySize * 1.7 + (options.notes.length ? 36 * ratio : 12 * ratio)
  canvas.width = image.width
  canvas.height = image.height + header + footer

  ctx.fillStyle = options.colors.paper
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = options.colors.ink
  ctx.font = `600 ${titleSize}px Manrope, sans-serif`
  titleLines.forEach((line, index) => {
    ctx.fillText(line, pad, pad + titleSize + index * titleSize * 1.25)
  })
  ctx.fillStyle = options.colors.muted
  ctx.font = `500 ${bodySize}px Manrope, sans-serif`
  ctx.fillText(formatLongDate(Date.now()), pad, header - 16 * ratio)
  ctx.drawImage(image, 0, header)

  let y = header + image.height + 28 * ratio
  if (options.notes.length) {
    drawLegend(ctx, pad, y, bodySize, options.colors)
    y += 32 * ratio
    ctx.font = `500 ${bodySize}px Manrope, sans-serif`
    for (const note of options.notes) {
      ctx.fillStyle = note.tone === 'danger' ? options.colors.danger : options.colors.auto
      ctx.beginPath()
      ctx.arc(pad + 6 * ratio, y - 4 * ratio, 4 * ratio, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = options.colors.ink
      const line = `${note.title}: ${note.text}`
      ctx.fillText(truncate(ctx, line, image.width - pad * 2 - 24 * ratio), pad + 20 * ratio, y)
      y += bodySize * 1.7
    }
  }

  if (options.watermark) {
    ctx.fillStyle = options.colors.muted
    ctx.font = `600 ${bodySize}px Manrope, sans-serif`
    ctx.fillText('Ясно · бесплатная версия', pad, canvas.height - 18 * ratio)
  }
  return canvas.toDataURL('image/png')
}

function drawLegend(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  colors: Palette,
) {
  ctx.font = `600 ${size}px Manrope, sans-serif`
  ctx.fillStyle = colors.danger
  ctx.beginPath()
  ctx.arc(x + 6, y - 4, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = colors.ink
  ctx.fillText('Узкое место', x + 18, y)
  const shift = ctx.measureText('Узкое место').width + 48
  ctx.fillStyle = colors.auto
  ctx.beginPath()
  ctx.arc(x + shift, y - 4, 5, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = colors.ink
  ctx.fillText('Автоматизация', x + shift + 14, y)
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (ctx.measureText(next).width > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines.length ? lines : ['Схема']
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text
  let value = text
  while (value.length > 1 && ctx.measureText(`${value}…`).width > maxWidth) value = value.slice(0, -1)
  return `${value}…`
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Не удалось собрать PNG'))
    image.src = src
  })
}

function download(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  link.click()
}
