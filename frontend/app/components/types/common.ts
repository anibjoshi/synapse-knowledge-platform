import { SimulationNodeDatum } from "d3"

// Base interfaces for all node types
export interface BaseNodeData {
  id: string
  name: string
  response?: string
}

// Common visualization props
export interface VisualizationProps {
  className?: string
  isLoading?: boolean
}

// Common dimension type
export interface Dimensions {
  width: number
  height: number
}

// Common margin type
export interface Margins {
  top: number
  right: number
  bottom: number
  left: number
}

// Common zoom configuration
export interface ZoomConfig {
  minZoom?: number
  maxZoom?: number
  initialTransform?: {
    x: number
    y: number
    scale: number
  }
}

// Common layout configuration
export interface LayoutConfig {
  type: "tree" | "graph"
  orientation?: "horizontal" | "vertical"
  nodeSpacing?: {
    horizontal: number
    vertical: number
  }
  margins?: Margins
}

// Common node event handlers
export interface NodeEventHandlers {
  onUpdate?: (id: string, newName: string) => void
  onAskQuestion?: (id: string, question: string) => void
}

// Common simulation node type
export interface SimulationNode extends BaseNodeData, SimulationNodeDatum {
  x?: number
  y?: number
  fx?: number
  fy?: number
}

// Common link type
export interface LinkData {
  id: string
  source: string | SimulationNode
  target: string | SimulationNode
  relationship: string
}

// Common API response types
export interface ApiResponse {
  type: 'children'
  nodes: {
    id: string
    name: string
    relationship?: string
  }[]
} 