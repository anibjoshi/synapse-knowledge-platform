import { BaseNodeData, LinkData, NodeEventHandlers, VisualizationProps } from "@/app/components/types/common"
import { SimulationNodeDatum } from "d3"

export interface GraphNodeData extends BaseNodeData, SimulationNodeDatum {
  x?: number
  y?: number
  fx?: number
  fy?: number
}

export interface GraphData {
  nodes: GraphNodeData[]
  links: LinkData[]
}

export interface GraphProps extends VisualizationProps, NodeEventHandlers {
  initialData: GraphData
} 