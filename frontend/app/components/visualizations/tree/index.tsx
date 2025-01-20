"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import * as d3 from "d3"
import { Layout } from "../../shared/Layout"
import { BaseNode } from "../../shared/Node"
import { useDimensions } from "../hooks/useDimensions"
import { useZoom } from "../hooks/useZoom"
import { TreeNodeData, TreeProps, D3TreeNode } from "./types"
import "./styles.css"

const INITIAL_TRANSFORM = {
  x: 0,
  y: 50,
  scale: 0.8
}

const DEFAULT_DIMENSIONS = {
  width: 1000,
  height: 800
}

const NODE_SIZE = {
  width: 120,
  height: 60
}

const SPACING = {
  HORIZONTAL: 200,  // Space between siblings
  VERTICAL: 100,    // Space between parent and child
  TOP_MARGIN: 40    // Space from top
}

// Add relationship colors
const RELATIONSHIP_STYLES = {
  type: {
    stroke: '#3b82f6',  // blue
    label: 'is a type of'
  },
  company: {
    stroke: '#10b981',  // green
    label: 'is a company in'
  },
  product: {
    stroke: '#8b5cf6',  // purple
    label: 'is a product of'
  }
}

// Update path generator to include relationship label
function generatePath(
  source: { x: number, y: number },
  target: { x: number, y: number },
  relationship?: string
): { path: string, labelPosition: { x: number, y: number } } {
  const midY = source.y + (target.y - source.y) * 0.5
  return {
    path: `M${source.x},${source.y} L${source.x},${midY} L${target.x},${midY} L${target.x},${target.y}`,
    labelPosition: {
      x: source.x + (target.x - source.x) / 2,
      y: midY - 10
    }
  }
}

export function TreeVisualization({
  className,
  initialData,
  onNodeUpdate,
  onAskQuestion,
  isLoading: externalLoading
}: TreeProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [root, setRoot] = useState<d3.HierarchyPointNode<TreeNodeData> | null>(null)

  // Get container dimensions
  const dimensions = useDimensions(containerRef)

  // Setup zoom behavior
  useZoom(svgRef, {
    initialTransform: INITIAL_TRANSFORM,
    enabled: !!root
  })

  // Initialize tree layout - now depends on initialData
  useEffect(() => {
    const width = dimensions.width || DEFAULT_DIMENSIONS.width
    const height = dimensions.height || DEFAULT_DIMENSIONS.height

    const hierarchy = d3.hierarchy(initialData)  // Use initialData directly
    
    const treeLayout = d3.tree<TreeNodeData>()
      .nodeSize([SPACING.HORIZONTAL, SPACING.VERTICAL])
      .separation((a, b) => {
        return a.parent === b.parent ? 1.2 : 2
      })

    // Calculate layout
    const newRoot = treeLayout(hierarchy)

    // Calculate the bounds of the tree
    let minX = Infinity
    let maxX = -Infinity

    newRoot.each(d => {
      minX = Math.min(minX, d.x)
      maxX = Math.max(maxX, d.x)
    })

    // Calculate the center offset
    const treeWidth = maxX - minX
    const centerOffset = (width - treeWidth) / 2

    // Center nodes horizontally and adjust vertical spacing
    newRoot.each(d => {
      d.x = d.x - minX + centerOffset
      d.y = d.y + SPACING.TOP_MARGIN
    })

    setRoot(newRoot)
  }, [dimensions, initialData])  // Add initialData to dependencies

  // Handle node updates
  const handleUpdateNode = useCallback((id: string, newName: string) => {
    onNodeUpdate?.(id, newName)
  }, [onNodeUpdate])

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
      <div ref={containerRef} className="tree-container">
        <svg
          ref={svgRef}
          className="tree-svg"
          width="100%"
          height="100%"
          viewBox={`0 0 ${dimensions.width || DEFAULT_DIMENSIONS.width} ${dimensions.height || DEFAULT_DIMENSIONS.height}`}
        >
          <g>
            {/* Render links with relationship labels */}
            {root?.links().map((link, i) => {
              const relationship = (link.target.data as any).relationship
              const { path, labelPosition } = generatePath(
                { x: link.source.x, y: link.source.y },
                { x: link.target.x, y: link.target.y },
                relationship
              )
              const style = RELATIONSHIP_STYLES[relationship as keyof typeof RELATIONSHIP_STYLES]

              return (
                <g key={`link-${i}`}>
                  <path
                    className="tree-link"
                    d={path}
                    style={{ stroke: style?.stroke }}
                  />
                  {style && (
                    <text
                      x={labelPosition.x}
                      y={labelPosition.y}
                      className="relationship-label"
                      textAnchor="middle"
                      fill={style.stroke}
                    >
                      {style.label}
                    </text>
                  )}
                </g>
              )
            })}
            {/* Render nodes */}
            {root?.descendants().map((node: D3TreeNode) => (
              <BaseNode
                key={node.data.id}
                data={node.data}
                x={node.x}
                y={node.y}
                width={NODE_SIZE.width}
                height={40}
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