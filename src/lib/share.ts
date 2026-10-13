import type { NodeKind, ProcessDoc, ProcessEdge, ProcessNode } from '../types'
import { slimEdge, slimNode } from './graph'

const KINDS = new Set<NodeKind>(['start', 'end', 'action', 'decision'])

type SharePayload = {
  v: 1
  title: string
  summary: string
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  updatedAt: number
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function base64UrlToBytes(value: string) {
  const pad = value.length % 4 === 0 ? '' : '='.repeat(4 - (value.length % 4))
  const binary = atob(value.replace(/-/g, '+').replace(/_/g, '/') + pad)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

function asBlob(bytes: Uint8Array) {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return new Blob([copy.buffer])
}

async function gzip(text: string) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function gunzip(bytes: Uint8Array) {
  const stream = asBlob(bytes).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Response(stream).text()
}

export async function buildShareUrl(doc: Pick<ProcessDoc, 'title' | 'summary' | 'nodes' | 'edges' | 'updatedAt'>) {
  const payload: SharePayload = {
    v: 1,
    title: doc.title,
    summary: doc.summary,
    nodes: doc.nodes.map(slimNode),
    edges: doc.edges.map(slimEdge),
    updatedAt: doc.updatedAt,
  }
  const encoded = `z${bytesToBase64Url(await gzip(JSON.stringify(payload)))}`
  if (encoded.length > 15000) {
    throw new Error('Схема слишком большая для ссылки. Скачайте PNG.')
  }
  return `${window.location.origin}/p#${encoded}`
}

export async function decodeShare(code: string): Promise<SharePayload | null> {
  try {
    if (!code.startsWith('z')) return null
    const json = await gunzip(base64UrlToBytes(code.slice(1)))
    const parsed = JSON.parse(json) as SharePayload
    if (parsed.v !== 1 || typeof parsed.title !== 'string' || !Array.isArray(parsed.nodes)) return null
    const nodes = parsed.nodes.filter(isNode).slice(0, 200).map(slimNode)
    const ids = new Set(nodes.map((node) => node.id))
    const edges = (Array.isArray(parsed.edges) ? parsed.edges : [])
      .filter((edge) => isEdge(edge) && ids.has(edge.source) && ids.has(edge.target))
      .slice(0, 400)
      .map(slimEdge)
    if (nodes.length === 0) return null
    return {
      v: 1,
      title: parsed.title.slice(0, 120) || 'Схема',
      summary: typeof parsed.summary === 'string' ? parsed.summary.slice(0, 4000) : '',
      nodes,
      edges,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : Date.now(),
    }
  } catch {
    return null
  }
}

function isNode(value: unknown): value is ProcessNode {
  if (!value || typeof value !== 'object') return false
  const node = value as ProcessNode
  return (
    typeof node.id === 'string' &&
    !!node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    !!node.data &&
    typeof node.data.label === 'string' &&
    KINDS.has(node.data.kind)
  )
}

function isEdge(value: unknown): value is ProcessEdge {
  if (!value || typeof value !== 'object') return false
  const edge = value as ProcessEdge
  return typeof edge.id === 'string' && typeof edge.source === 'string' && typeof edge.target === 'string'
}
