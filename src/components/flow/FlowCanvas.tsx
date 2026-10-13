import {
  Background,
  BackgroundVariant,
  ConnectionMode,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  type Connection,
  type Node,
  type OnEdgesChange,
  type OnNodesChange,
  type OnReconnect,
} from '@xyflow/react'
import type { ReactNode } from 'react'
import { useTheme } from '../../context/ThemeContext'
import { palettes } from '../../lib/palette'
import type { ProcessEdge, ProcessNode, ProcessNodeData } from '../../types'
import { ProcessNodeView } from './ProcessNodeView'

const nodeTypes = { process: ProcessNodeView }

type Mode = 'edit' | 'view' | 'static'

type Props = {
  nodes: ProcessNode[]
  edges: ProcessEdge[]
  mode?: Mode
  onNodesChange?: OnNodesChange<ProcessNode>
  onEdgesChange?: OnEdgesChange<ProcessEdge>
  onConnect?: (connection: Connection) => void
  onReconnect?: OnReconnect<ProcessEdge>
  onNodeDragStart?: () => void
  onBeforeDelete?: () => Promise<boolean>
  fitView?: boolean
  children?: ReactNode
}

export function FlowCanvas({
  nodes,
  edges,
  mode = 'edit',
  onNodesChange,
  onEdgesChange,
  onConnect,
  onReconnect,
  onNodeDragStart,
  onBeforeDelete,
  fitView = true,
  children,
}: Props) {
  const { resolved } = useTheme()
  const colors = palettes[resolved]
  const editable = mode === 'edit'
  const frozen = mode === 'static'

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={editable ? onNodesChange : undefined}
      onEdgesChange={editable ? onEdgesChange : undefined}
      onConnect={editable ? onConnect : undefined}
      onReconnect={editable ? onReconnect : undefined}
      onNodeDragStart={editable ? onNodeDragStart : undefined}
      onBeforeDelete={
        editable && onBeforeDelete
          ? () => onBeforeDelete()
          : undefined
      }
      fitView={fitView}
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.25}
      maxZoom={1.6}
      colorMode={resolved}
      connectionMode={ConnectionMode.Loose}
      connectionRadius={36}
      nodesDraggable={editable}
      nodesConnectable={editable}
      elementsSelectable={mode !== 'static'}
      edgesReconnectable={editable}
      deleteKeyCode={editable ? ['Backspace', 'Delete'] : null}
      zoomOnDoubleClick={false}
      zoomOnScroll={!frozen}
      zoomOnPinch={!frozen}
      panOnDrag={!frozen}
      preventScrolling={!frozen}
      isValidConnection={(connection) => connection.source !== connection.target}
      defaultEdgeOptions={{
        type: 'smoothstep',
        markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
      }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.15} color={resolved === 'dark' ? '#3a342c' : '#d9d0c2'} />
      {mode !== 'static' ? <Controls showInteractive={false} /> : null}
      {mode !== 'static' ? (
        <MiniMap
          pannable
          zoomable
          maskColor={resolved === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(40,32,20,0.08)'}
          nodeColor={(node: Node) => {
            const data = node.data as ProcessNodeData
            if (data.bottleneck) return colors.danger
            if (data.automation) return colors.auto
            if (data.kind === 'decision') return '#c65a2e'
            return resolved === 'dark' ? '#4a433a' : '#d9d0c2'
          }}
        />
      ) : null}
      {children}
    </ReactFlow>
  )
}
