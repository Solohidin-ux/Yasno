import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { LimitDialog } from '../components/LimitDialog'
import { Marketing } from '../components/SiteChrome'
import { Button } from '../components/ui'
import { getTemplate, salesPreviewGraph, templateGraph } from '../data/templates'
import { useStart } from '../lib/useStart'
import { useTitle } from '../lib/useTitle'
import { SchemeFrame } from './SchemeFrame'

export function ExamplePage() {
  const { templateId } = useParams()
  const template = templateId ? getTemplate(templateId) : undefined
  useTitle(template ? `Пример · ${template.title}` : 'Пример')
  const { fromTemplate, limitOpen, setLimitOpen } = useStart()
  const graph = useMemo(() => {
    if (!template) return null
    return template.id === 'sales' ? salesPreviewGraph() : templateGraph(template)
  }, [template])

  if (!template || !graph) {
    return (
      <Marketing>
        <div className="mx-auto max-w-xl px-5 py-24 text-center">
          <h1 className="font-display text-4xl">Такого шаблона нет</h1>
          <div className="mt-6">
            <Button to="/create">Выбрать шаблон</Button>
          </div>
        </div>
      </Marketing>
    )
  }

  return (
    <>
      <SchemeFrame
        title={template.title}
        kicker="Пример схемы"
        summary={
          template.id === 'sales'
            ? 'На квалификации стоит узкое место, на постоплате — автоматизация. Шаблон откроется чистым: метки поставите свои.'
            : template.summary
        }
        nodes={graph.nodes}
        edges={graph.edges}
        actions={
          <Button variant="accent" onClick={() => fromTemplate(template)}>
            Взять за основу
          </Button>
        }
      />
      <LimitDialog open={limitOpen} onClose={() => setLimitOpen(false)} />
    </>
  )
}
