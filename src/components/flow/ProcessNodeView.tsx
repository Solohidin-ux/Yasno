import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useTheme } from '../../context/ThemeContext'
import { palettes } from '../../lib/palette'
import { cn } from '../../lib/utils'
import type { ProcessNode, ProcessNodeData } from '../../types'

function Handles() {
  return (
    <>
      <Handle id="in-left" type="target" position={Position.Left} />
      <Handle id="out-right" type="source" position={Position.Right} />
      <Handle id="in-top" type="target" position={Position.Top} />
      <Handle id="out-bottom" type="source" position={Position.Bottom} />
    </>
  )
}

function Mark({ tone, label, note }: { tone: 'danger' | 'auto'; label: string; note?: string }) {
  return (
    <div className={cn('rounded-xl px-2 py-1.5', tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-auto-soft text-auto')}>
      <div className="text-[10px] font-bold uppercase tracking-wide">{label}</div>
      {note ? <div className="mt-0.5 text-[11px] leading-4 text-ink">{note}</div> : null}
    </div>
  )
}

function Marks({ data }: { data: ProcessNodeData }) {
  if (!data.bottleneck && !data.automation) return null
  return (
    <div className="mt-2 space-y-1.5">
      {data.bottleneck ? <Mark tone="danger" label="Узкое место" note={data.bottleneckNote} /> : null}
      {data.automation ? <Mark tone="auto" label="Автоматизация" note={data.automationNote} /> : null}
    </div>
  )
}

export function ProcessNodeView({ data, selected }: NodeProps<ProcessNode>) {
  const { resolved } = useTheme()
  const colors = palettes[resolved]
  const stroke = data.bottleneck ? colors.danger : data.automation ? colors.auto : selected ? colors.accent : colors.line

  if (data.kind === 'start' || data.kind === 'end') {
    return (
      <div
        className={cn(
          'node-card relative rounded-full border-2 bg-surface px-4 py-2 text-sm font-semibold',
          selected && 'node-selected',
        )}
        style={{ borderColor: stroke }}
      >
        <Handles />
        {data.label}
      </div>
    )
  }

  if (data.kind === 'decision') {
    return (
      <div className="flex w-[176px] flex-col items-center">
        <div className="relative h-[150px] w-[168px]">
          <svg viewBox="0 0 168 150" className="absolute inset-0 h-full w-full overflow-visible">
            <polygon
              points="84,5 163,75 84,145 5,75"
              fill={colors.surface}
              stroke={stroke}
              strokeWidth={selected ? 3 : 2}
              strokeLinejoin="round"
            />
          </svg>
          <Handles />
          <div className="relative z-10 flex h-full items-center justify-center px-8 text-center text-[13px] font-semibold leading-tight">
            {data.label}
          </div>
        </div>
        <div className="w-full">
          <Marks data={data} />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn('node-card relative w-[230px] rounded-2xl border-2 bg-surface px-3.5 py-3', selected && 'node-selected')}
      style={{ borderColor: stroke }}
    >
      <Handles />
      {data.duration || data.owner ? (
        <div className="flex items-center justify-between gap-3 text-[11px] font-medium text-muted">
          <span>{data.duration}</span>
          <span className="truncate">{data.owner}</span>
        </div>
      ) : null}
      <div className={cn('text-sm font-semibold leading-snug', data.duration || data.owner ? 'mt-1' : '')}>{data.label}</div>
      <Marks data={data} />
    </div>
  )
}
