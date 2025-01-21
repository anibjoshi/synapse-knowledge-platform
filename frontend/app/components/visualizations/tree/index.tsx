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
  MIN_HORIZONTAL: 200,  // Increased minimum space
  MIN_VERTICAL: 150,    // Increased vertical space
  TOP_MARGIN: 80,
  NODE_PADDING: 50     // Increased padding
}

// Enhanced path generator for more natural curves
function generatePath(
  source: { x: number, y: number },
  target: { x: number, y: number },
  relationship?: string
): { path: string, labelPosition: { x: number, y: number } } {
  // Calculate control points for a more natural curve
  const dx = target.x - source.x
  const dy = target.y - source.y
  const controlPoint1X = source.x + dx * 0.2
  const controlPoint1Y = source.y + dy * 0.4
  const controlPoint2X = source.x + dx * 0.8
  const controlPoint2Y = source.y + dy * 0.6

  // Create smooth curve
  const path = `
    M ${source.x},${source.y}
    C ${controlPoint1X},${controlPoint1Y}
      ${controlPoint2X},${controlPoint2Y}
      ${target.x},${target.y}
  `

  // Calculate label position along the curve
  return {
    path,
    labelPosition: {
      x: source.x + dx * 0.5,
      y: source.y + dy * 0.4 - 10
    }
  }
}

// Update relationship styles for a softer look
const RELATIONSHIP_STYLES = {
  type: {
    stroke: '#818cf8',    // Softer purple
    label: 'is a type of'
  },
  company: {
    stroke: '#34d399',    // Softer green
    label: 'is a company in'
  },
  product: {
    stroke: '#60a5fa',    // Softer blue
    label: 'is a product of'
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

  // Initialize tree layout
  useEffect(() => {
    const width = dimensions.width || DEFAULT_DIMENSIONS.width
    const height = dimensions.height || DEFAULT_DIMENSIONS.height

    const hierarchy = d3.hierarchy(initialData)

    // Calculate tree metrics
    const totalNodes = hierarchy.descendants().length
    const maxDepth = d3.max(hierarchy.descendants(), d => d.depth) || 0
    const nodesPerLevel = new Map<number, number>()
    
    hierarchy.descendants().forEach(d => {
      nodesPerLevel.set(d.depth, (nodesPerLevel.get(d.depth) || 0) + 1)
    })
    
    const maxNodesAtLevel = Math.max(...Array.from(nodesPerLevel.values()))

    // Calculate available space
    const availableWidth = width * 0.8  // Use 80% of width
    const availableHeight = height * 0.8 // Use 80% of height

    // Calculate spacing
    const horizontalSpacing = Math.max(
      SPACING.MIN_HORIZONTAL,
      availableWidth / maxNodesAtLevel
    )

    const verticalSpacing = Math.max(
      SPACING.MIN_VERTICAL,
      availableHeight / (maxDepth + 1)  // +1 to account for root level
    )

    const treeLayout = d3.tree<TreeNodeData>()
      .nodeSize([horizontalSpacing, verticalSpacing])  // Use nodeSize instead of size
      .separation((a, b) => {
        if (a.parent === b.parent) {
          // Siblings
          return 1.2
        }
        // Nodes in different branches
        return 2
      })

    const newRoot = treeLayout(hierarchy)

    // Calculate bounds
    let minX = Infinity
    let maxX = -Infinity
    let maxY = -Infinity

    newRoot.each(d => {
      minX = Math.min(minX, d.x)
      maxX = Math.max(maxX, d.x)
      maxY = Math.max(maxY, d.y)
    })

    // Center the tree
    const treeWidth = maxX - minX
    const centerOffset = (width - treeWidth) / 2

    // Position nodes with proper spacing
    newRoot.each(d => {
      d.x = d.x - minX + centerOffset
      d.y = SPACING.TOP_MARGIN + (d.depth * verticalSpacing)
    })

    setRoot(newRoot)
  }, [dimensions, initialData])

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