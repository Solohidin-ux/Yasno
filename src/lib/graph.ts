import { MarkerType } from '@xyflow/react'
import { Graph, layout as dagreLayout } from '@dagrejs/dagre'
import type { Direction, LinkDef, NodeKind, ProcessEdge, ProcessNode, ProcessNodeData, StepDef } from '../types'

const DEFAULT_LABEL: Record<NodeKind, string> = {
  start: 'Старт',
  end: 'Финиш',
  action: 'Новый этап',
  decision: 'Условие?',
}

export function sizeOf(data: Pick<ProcessNodeData, 'kind' | 'bottleneck' | 'automation' | 'bottleneckNote' | 'automationNote'>) {
  if (data.kind === 'decision') {
    const extra = data.bottleneck || data.automation ? 72 : 0
    return { width: 176, height: 156 + extra }
  }
  if (data.kind === 'start' || data.kind === 'end') return { width: 148, height: 52 }
  let height = 92
  if (data.bottleneck) height += data.bottleneckNote ? 42 : 26
  if (data.automation) height += data.automationNote ? 42 : 26
  return { width: 240, height }
}

export function layoutGraph(nodes: ProcessNode[], edges: ProcessEdge[], direction: Direction = 'LR') {
  if (nodes.length === 0) return nodes
  const graph = new Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({
    rankdir: direction,
    nodesep: direction === 'LR' ? 48 : 36,
    ranksep: direction === 'LR' ? 100 : 76,
    marginx: 16,
    marginy: 16,
  })

  for (const node of nodes) {
    const size = sizeOf(node.data)
    graph.setNode(node.id, size)
  }
  const ids = new Set(nodes.map((node) => node.id))
  for (const edge of edges) {
    if (ids.has(edge.source) && ids.has(edge.target) && edge.source !== edge.target) {
      graph.setEdge(edge.source, edge.target)
    }
  }
  dagreLayout(graph)

  return nodes.map((node) => {
    const pos = graph.node(node.id) as { x: number; y: number } | undefined
    if (!pos) return node
    const size = sizeOf(node.data)
    return {
      ...node,
      position: { x: pos.x - size.width / 2, y: pos.y - size.height / 2 },
    }
  })
}

export function makeEdge(
  source: string,
  target: string,
  label?: string,
  id?: string,
  direction: Direction = 'LR',
): ProcessEdge {
  const edge: ProcessEdge = {
    id: id ?? crypto.randomUUID(),
    source,
    target,
    type: 'smoothstep',
    sourceHandle: direction === 'TB' ? 'out-bottom' : 'out-right',
    targetHandle: direction === 'TB' ? 'in-top' : 'in-left',
    markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
  }
  if (label) edge.label = label
  return edge
}

export function withDirection(edge: ProcessEdge, direction: Direction): ProcessEdge {
  return {
    ...edge,
    sourceHandle: direction === 'TB' ? 'out-bottom' : 'out-right',
    targetHandle: direction === 'TB' ? 'in-top' : 'in-left',
  }
}

export function buildFromSteps(steps: StepDef[], links: LinkDef[], direction: Direction = 'LR') {
  const nodes: ProcessNode[] = steps.map((step) => ({
    id: step.key,
    type: 'process',
    position: { x: 0, y: 0 },
    data: {
      label: step.label,
      kind: step.kind,
      duration: step.duration,
      owner: step.owner,
      bottleneck: step.bottleneck,
      bottleneckNote: step.bottleneckNote,
      automation: step.automation,
      automationNote: step.automationNote,
    },
  }))
  const edges = links.map((link) =>
    makeEdge(link.source, link.target, link.label, `${link.source}>${link.target}`, direction),
  )
  return { nodes: layoutGraph(nodes, edges, direction), edges }
}

export function slimNode(node: ProcessNode): ProcessNode {
  const data: ProcessNodeData = {
    label: node.data.label.trim() || DEFAULT_LABEL[node.data.kind],
    kind: node.data.kind,
  }
  if (node.data.duration?.trim()) data.duration = node.data.duration.trim()
  if (node.data.owner?.trim()) data.owner = node.data.owner.trim()
  if (node.data.bottleneck) data.bottleneck = true
  if (node.data.bottleneckNote?.trim()) data.bottleneckNote = node.data.bottleneckNote.trim()
  if (node.data.automation) data.automation = true
  if (node.data.automationNote?.trim()) data.automationNote = node.data.automationNote.trim()
  return {
    id: node.id,
    type: 'process',
    position: { x: node.position.x, y: node.position.y },
    data,
  }
}

export function slimEdge(edge: ProcessEdge): ProcessEdge {
  const slim = makeEdge(edge.source, edge.target, undefined, edge.id)
  if (typeof edge.label === 'string' && edge.label.trim()) slim.label = edge.label.trim()
  if (edge.sourceHandle) slim.sourceHandle = edge.sourceHandle
  if (edge.targetHandle) slim.targetHandle = edge.targetHandle
  return slim
}

export function nextLabel(kind: NodeKind, nodes: ProcessNode[]) {
  const base = DEFAULT_LABEL[kind]
  const labels = new Set(nodes.map((node) => node.data.label))
  if (!labels.has(base)) return base
  let index = 2
  while (labels.has(`${base} ${index}`)) index += 1
  return `${base} ${index}`
}

export function nextPosition(nodes: ProcessNode[], anchor?: ProcessNode) {
  const base = anchor ?? nodes.reduce<ProcessNode | undefined>((right, node) => {
    if (!right || node.position.x > right.position.x) return node
    return right
  }, undefined)
  if (!base) return { x: 48, y: 80 }
  return { x: base.position.x + 280, y: base.position.y }
}
