export interface BaseNodeData {
  id: string
  name: string
  children?: BaseNodeData[]
}

export interface BaseNodeProps<T extends BaseNodeData> {
  data: T
  x: number
  y: number
  width?: number
  height?: number
  onUpdate?: (id: string, newName: string) => void
  onAskQuestion?: (nodeId: string, question: string) => void
  onDoubleClick?: (nodeId: string, nodeName: string) => void
} 