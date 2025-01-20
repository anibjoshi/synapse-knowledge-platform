import { BaseNodeData, NodeEventHandlers, VisualizationProps } from "@/app/components/types/common"
import { HierarchyPointNode } from "d3"

export interface TreeNodeData extends BaseNodeData {
  children?: TreeNodeData[]
}

export interface D3TreeNode extends HierarchyPointNode<TreeNodeData> {
  x: number
  y: number
}

export interface TreeProps extends VisualizationProps, NodeEventHandlers {
  initialData: TreeNodeData
} 