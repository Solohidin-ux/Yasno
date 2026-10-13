import type { ReactNode } from 'react'
import {
  AlignHorizontalSpaceAround,
  AlignVerticalSpaceAround,
  Circle,
  CircleHelp,
  Diamond,
  Flag,
  LocateFixed,
  Redo2,
  Square,
  Undo2,
} from 'lucide-react'
import type { Direction, NodeKind } from '../../types'
import { cn } from '../../lib/utils'

type Props = {
  horizontal?: boolean
  onAdd: (kind: NodeKind) => void
  onLayout: (direction: Direction) => void
  onFit: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  onHelp: () => void
}

const tools: { kind: NodeKind; label: string; icon: typeof Square }[] = [
  { kind: 'action', label: 'Этап', icon: Square },
  { kind: 'decision', label: 'Решение', icon: Diamond },
  { kind: 'start', label: 'Старт', icon: Circle },
  { kind: 'end', label: 'Финиш', icon: Flag },
]

export function ToolRail({
  horizontal = false,
  onAdd,
  onLayout,
  onFit,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onHelp,
}: Props) {
  return (
    <div
      className={cn(
        'flex gap-1 bg-surface',
        horizontal
          ? 'overflow-x-auto border-b border-line px-2 py-2'
          : 'h-full w-[4.6rem] flex-col items-center border-r border-line py-3',
      )}
    >
      {tools.map((tool) => (
        <RailButton key={tool.kind} label={tool.label} horizontal={horizontal} onClick={() => onAdd(tool.kind)}>
          <tool.icon size={18} />
        </RailButton>
      ))}
      <span className={cn('bg-line', horizontal ? 'mx-1 w-px self-stretch' : 'my-2 h-px w-8')} />
      <RailButton label="В ряд" horizontal={horizontal} onClick={() => onLayout('LR')}>
        <AlignHorizontalSpaceAround size={18} />
      </RailButton>
      <RailButton label="В столбец" horizontal={horizontal} onClick={() => onLayout('TB')}>
        <AlignVerticalSpaceAround size={18} />
      </RailButton>
      <RailButton label="Вместить" horizontal={horizontal} onClick={onFit}>
        <LocateFixed size={18} />
      </RailButton>
      <RailButton label="Назад" horizontal={horizontal} disabled={!canUndo} onClick={onUndo}>
        <Undo2 size={18} />
      </RailButton>
      <RailButton label="Вперёд" horizontal={horizontal} disabled={!canRedo} onClick={onRedo}>
        <Redo2 size={18} />
      </RailButton>
      <RailButton label="Подсказка" horizontal={horizontal} onClick={onHelp} className={horizontal ? '' : 'mt-auto'}>
        <CircleHelp size={18} />
      </RailButton>
    </div>
  )
}

function RailButton({
  label,
  onClick,
  children,
  disabled,
  horizontal,
  className,
}: {
  label: string
  onClick: () => void
  children: ReactNode
  disabled?: boolean
  horizontal?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl text-ink hover:bg-paper disabled:opacity-35',
        horizontal ? 'h-14 min-w-16 px-2' : 'h-14 w-14',
        className,
      )}
    >
      {children}
      <span className="text-[10px] font-medium leading-none text-muted">{label}</span>
    </button>
  )
}
