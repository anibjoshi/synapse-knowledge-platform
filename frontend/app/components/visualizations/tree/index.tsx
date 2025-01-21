"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import * as d3 from "d3"
import { Layout } from "../../shared/Layout"
import { BaseNode } from "../../shared/Node"
import { useDimensions } from "../hooks/useDimensions"
import { useZoom } from "../hooks/useZoom"
import { TreeNodeData, TreeProps, D3TreeNode } from "./types"
import "./styles.css"
import { Sidebar } from "../../shared/Sidebar"

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

// Update relationship styles for dark mode
const RELATIONSHIP_STYLES = {
  type: {
    stroke: '#818cf8',    // Indigo
    label: 'is a type of'
  },
  company: {
    stroke: '#4ade80',    // Green
    label: 'is a company in'
  },
  product: {
    stroke: '#38bdf8',    // Sky blue
    label: 'is a product of'
  }
}

function mergeNodes(existingData: TreeNodeData, newNodes: TreeNodeData[]): TreeNodeData {
  // If the node has no children, simply add the new nodes
  if (!existingData.children) {
    return {
      ...existingData,
      children: newNodes
    }
  }

  // Keep existing children and add new unique nodes
  const existingChildren = existingData.children
  const existingIds = new Set(existingChildren.map(child => child.id))
  
  // Filter out any new nodes that already exist
  const newUniqueNodes = newNodes.filter(node => !existingIds.has(node.id))
  
  return {
    ...existingData,
    children: [...existingChildren, ...newUniqueNodes]
  }
}

// First, update the TreeProps interface to specify the return type
interface TreeProps {
  className?: string
  initialData: TreeNodeData
  onNodeUpdate?: (id: string, newName: string) => void
  onAskQuestion: (nodeId: string, question: string) => Promise<ApiResponse>
  isLoading?: boolean
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
  const [activeQuestion, setActiveQuestion] = useState<{ nodeId: string, x: number, y: number } | null>(null)
  const [selectedNode, setSelectedNode] = useState<{id: string, name: string} | null>(null)
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set())

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

  // Handle click outside
  const handleBackdropClick = useCallback(() => {
    setActiveQuestion(null)
  }, [])

  // Then update the handleQuestionSubmit to properly handle the API response
  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!activeQuestion || !onAskQuestion) return
    
    setIsLoading(true)
    setLoadingNodes(prev => new Set(prev).add(activeQuestion.nodeId))
    
    try {
      const response = await onAskQuestion(activeQuestion.nodeId, question)
      console.log('API Response:', response)

      setRoot(prevRoot => {
        if (!prevRoot) return null

        // Clone the current tree data
        const clone = d3.hierarchy(JSON.parse(JSON.stringify(prevRoot.data)))
        
        // Find the node to update
        clone.each(node => {
          if (node.data.id === activeQuestion.nodeId) {
            // Get existing children or empty array
            const existingChildren = node.data.children || []
            
            // Create Set of existing IDs for O(1) lookup
            const existingIds = new Set(existingChildren.map(child => child.id))
            
            // Filter out any nodes that already exist
            const newUniqueNodes = response.nodes.filter(newNode => !existingIds.has(newNode.id))
            
            // Merge existing children with new unique nodes
            node.data.children = [...existingChildren, ...newUniqueNodes]
          }
        })

        // Recalculate layout
        const treeLayout = d3.tree<TreeNodeData>()
          .nodeSize([SPACING.MIN_HORIZONTAL, SPACING.MIN_VERTICAL])
        
        return treeLayout(clone)
      })

    } finally {
      setIsLoading(false)
      setLoadingNodes(prev => {
        const next = new Set(prev)
        next.delete(activeQuestion.nodeId)
        return next
      })
      setActiveQuestion(null)
    }
  }, [activeQuestion, onAskQuestion])

  const handleNodeDoubleClick = useCallback((nodeId: string, nodeName: string) => {
    setSelectedNode({ id: nodeId, name: nodeName })
  }, [])

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
          <g className={activeQuestion ? 'graph-blur' : ''}>
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
                onAskQuestion={onAskQuestion}
                onDoubleClick={handleNodeDoubleClick}
                isLoading={loadingNodes.has(node.data.id)}
              />
            ))}
          </g>
          
          {/* Question Modal */}
          {activeQuestion && (
            <g>
              {/* Backdrop */}
              <rect
                x={0}
                y={0}
                width={dimensions.width}
                height={dimensions.height}
                className="modal-backdrop"
                onClick={handleBackdropClick}
              />
              {/* Question Box */}
              <g transform={`translate(${activeQuestion.x}, ${activeQuestion.y})`}>
                <rect
                  x={-150}
                  y={-75}
                  width={300}
                  height={150}
                  rx={12}
                  className="modal-container"
                />
                <foreignObject
                  x={-140}
                  y={-65}
                  width={280}
                  height={130}
                >
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const input = e.currentTarget.querySelector("input")
                      if (input?.value) {
                        handleQuestionSubmit(input.value)
                        input.value = ""
                      }
                    }}
                    className="modal-form"
                  >
                    <input
                      type="text"
                      placeholder="Ask Synapse about this topic..."
                      className="modal-input"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          setActiveQuestion(null)
                        }
                      }}
                    />
                  </form>
                </foreignObject>
              </g>
            </g>
          )}
        </svg>
        <Sidebar 
          isOpen={!!selectedNode}
          selectedNode={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </Layout>
  )
} 