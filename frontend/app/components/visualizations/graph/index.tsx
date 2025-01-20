"use client"

import { useCallback, useRef, useState } from "react"
import * as d3 from "d3"
import { Layout } from "@/app/components/shared/Layout"
import { BaseNode } from "@/app/components/shared/Node"
import { useDimensions } from "../hooks/useDimensions"
import { useZoom } from "../hooks/useZoom"
import { useSimulation } from "./useSimulation"
import { GraphProps, GraphNodeData } from "./types"
import { LinkData } from "@/app/components/types/common"
import "./styles.css"

const INITIAL_TRANSFORM = {
  x: 0,
  y: 0,
  scale: 1
}

export function GraphVisualization({
  className,
  initialData,
  onNodeUpdate,
  onAskQuestion,
  isLoading: externalLoading
}: GraphProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [graphData, setGraphData] = useState(initialData)
  const [isLoading, setIsLoading] = useState(false)

  // Get container dimensions
  const dimensions = useDimensions(containerRef)

  // Setup zoom behavior
  useZoom(svgRef, { initialTransform: INITIAL_TRANSFORM })

  // Setup force simulation
  const { updateNodePosition } = useSimulation(graphData, dimensions)

  // Handle node updates
  const handleUpdateNode = useCallback((id: string, newName: string) => {
    onNodeUpdate?.(id, newName)
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node =>
        node.id === id ? { ...node, name: newName } : node
      )
    }))
  }, [onNodeUpdate])

  // Handle node dragging
  const handleDrag = useCallback((id: string, x: number, y: number) => {
    updateNodePosition(id, x, y)
  }, [updateNodePosition])

  // Handle questions
  const handleAskQuestion = useCallback(async (nodeId: string, question: string) => {
    if (!onAskQuestion) return
    setIsLoading(true)
    try {
      await onAskQuestion(nodeId, question)
    } finally {
      setIsLoading(false)
    }
  }, [onAskQuestion])

  return (
    <Layout isLoading={isLoading || externalLoading} className={className}>
      <div ref={containerRef} className="graph-container">
        <svg
          ref={svgRef}
          className="graph-svg"
          width={dimensions.width}
          height={dimensions.height}
        >
          <g>
            {/* Render links */}
            {graphData.links.map((link: LinkData) => (
              <line
                key={link.id}
                className="graph-link"
                x1={(link.source as GraphNodeData).x ?? 0}
                y1={(link.source as GraphNodeData).y ?? 0}
                x2={(link.target as GraphNodeData).x ?? 0}
                y2={(link.target as GraphNodeData).y ?? 0}
              />
            ))}
            {/* Render nodes */}
            {graphData.nodes.map((node: GraphNodeData) => (
              <BaseNode
                key={node.id}
                data={node}
                x={node.x ?? 0}
                y={node.y ?? 0}
                onUpdate={handleUpdateNode}
                onAskQuestion={handleAskQuestion}
              />
            ))}
          </g>
        </svg>
      </div>
    </Layout>
  )
} 