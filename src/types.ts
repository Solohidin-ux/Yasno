import type { Edge, Node } from '@xyflow/react'

export type NodeKind = 'start' | 'end' | 'action' | 'decision'
export type Plan = 'free' | 'pro'
export type ThemeChoice = 'light' | 'dark' | 'system'
export type Direction = 'LR' | 'TB'

export type ProcessNodeData = {
  label: string
  kind: NodeKind
  duration?: string
  owner?: string
  bottleneck?: boolean
  bottleneckNote?: string
  automation?: boolean
  automationNote?: string
} & Record<string, unknown>

export type ProcessNode = Node<ProcessNodeData, 'process'>
export type ProcessEdge = Edge

export type ProcessDoc = {
  id: string
  title: string
  summary: string
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  createdAt: number
  updatedAt: number
  ownerId: string
  isPublic: boolean
  templateId?: string
}

export type User = {
  id: string
  name: string
  email: string
  plan: Plan
  createdAt: number
}

export type StepDef = {
  key: string
  label: string
  kind: NodeKind
  owner?: string
  duration?: string
  bottleneck?: boolean
  bottleneckNote?: string
  automation?: boolean
  automationNote?: string
}

export type LinkDef = {
  source: string
  target: string
  label?: string
}

export type Template = {
  id: string
  title: string
  summary: string
  blurb: string
  steps: StepDef[]
  links: LinkDef[]
}

export const GUEST_ID = 'guest'
export const FREE_LIMIT = 3
