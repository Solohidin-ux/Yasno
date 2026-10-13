import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templateGraph } from '../data/templates'
import type { Template } from '../types'
import { createProcess } from './db'
import { parseDescription } from './parse'

export function useStart() {
  const navigate = useNavigate()
  const [limitOpen, setLimitOpen] = useState(false)

  async function fromTemplate(template: Template) {
    const graph = templateGraph(template)
    const result = await createProcess({
      title: template.title,
      summary: template.summary,
      nodes: graph.nodes,
      edges: graph.edges,
      templateId: template.id,
    })
    if (!result.ok) {
      if (result.error === 'limit') setLimitOpen(true)
      return
    }
    navigate(`/editor/${result.process.id}`)
  }

  async function fromText(text: string) {
    const parsed = parseDescription(text)
    if (!parsed) return 'empty' as const
    const result = await createProcess({
      title: parsed.title,
      summary: parsed.summary,
      nodes: parsed.nodes,
      edges: parsed.edges,
    })
    if (!result.ok) {
      if (result.error === 'limit') setLimitOpen(true)
      return result.error
    }
    navigate(`/editor/${result.process.id}`)
    return 'ok' as const
  }

  return { fromTemplate, fromText, limitOpen, setLimitOpen }
}
