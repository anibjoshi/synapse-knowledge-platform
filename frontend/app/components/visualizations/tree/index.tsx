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
import { ChatHistory } from "../../shared/ChatHistory"

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

// First, update the TreeProps interface to specify the return type
interface TreeProps {
  className?: string
  initialData: TreeNodeData
  onNodeUpdate?: (id: string, newName: string) => void
  onAskQuestion: (nodeId: string, question: string) => Promise<ApiResponse>
}

export function TreeVisualization({
  className,
  initialData,
  onNodeUpdate,
  onAskQuestion,
}: TreeProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [root, setRoot] = useState<d3.HierarchyPointNode<TreeNodeData> | null>(null)
  const [selectedNode, setSelectedNode] = useState<{id: string, name: string} | null>(null)
  const [loadingNodes, setLoadingNodes] = useState<Set<string>>(new Set())
  const [isChatHistoryOpen, setIsChatHistoryOpen] = useState(false)

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
    // Remove activeQuestion state since we're not using the modal anymore
  }, [])

  // Then update the handleQuestionSubmit to properly handle the API response
  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!selectedNode || !onAskQuestion) return
    
    // Hide modal immediately
    setSelectedNode(null)
    
    // Set loading state for this specific node
    setLoadingNodes(prev => new Set(prev).add(selectedNode.id))
    
    try {
      const response = await onAskQuestion(selectedNode.id, question)
      console.log('API Response:', response)

      setRoot(prevRoot => {
        if (!prevRoot) return null

        // Clone the current tree data
        const clone = d3.hierarchy(JSON.parse(JSON.stringify(prevRoot.data)))
        
        // Find the node to update
        clone.each(node => {
          if (node.data.id === selectedNode.id) {
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
      setLoadingNodes(prev => {
        const next = new Set(prev)
        next.delete(selectedNode.id)
        return next
      })
    }
  }, [selectedNode, onAskQuestion])

  const handleNodeDoubleClick = useCallback((nodeId: string, nodeName: string) => {
    setSelectedNode({ id: nodeId, name: nodeName })
  }, [])

  // Compute container classes
  const containerClasses = [
    'tree-container',
    isChatHistoryOpen && 'left-sidebar-open',
    selectedNode && 'right-sidebar-open',
    (isChatHistoryOpen && selectedNode) && 'both-sidebars-open'
  ].filter(Boolean).join(' ')

  return (
    <Layout className={className}>
      <button 
        className="history-toggle"
        onClick={() => setIsChatHistoryOpen(true)}
        title="Chat History"
      >
        ≡
      </button>
      <ChatHistory 
        isOpen={isChatHistoryOpen}
        onClose={() => setIsChatHistoryOpen(false)}
      />
      <div ref={containerRef} className={containerClasses}>
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
                onAskQuestion={async (nodeId, question) => {
                  setLoadingNodes(prev => new Set(prev).add(nodeId))
                  try {
                    const response = await onAskQuestion(nodeId, question)
                    
                    // Type check the response
                    if (!response || !Array.isArray(response.nodes)) {
                      console.error('Invalid response format:', response)
                      return
                    }
                    
                    setRoot(prevRoot => {
                      if (!prevRoot) return null
                      const clone = d3.hierarchy(JSON.parse(JSON.stringify(prevRoot.data)))
                      
                      clone.each(node => {
                        if (node.data.id === nodeId) {
                          const existingChildren = node.data.children || []
                          const existingIds = new Set(existingChildren.map(child => child.id))
                          // Make sure we're using the nodes array from the response
                          const newUniqueNodes = response.nodes.filter(newNode => !existingIds.has(newNode.id))
                          node.data.children = [...existingChildren, ...newUniqueNodes]
                        }
                      })

                      const treeLayout = d3.tree<TreeNodeData>()
                        .nodeSize([SPACING.MIN_HORIZONTAL, SPACING.MIN_VERTICAL])
                      return treeLayout(clone)
                    })
                  } catch (error) {
                    console.error('Error expanding node:', error)
                  } finally {
                    setLoadingNodes(prev => {
                      const next = new Set(prev)
                      next.delete(nodeId)
                      return next
                    })
                  }
                }}
                onDoubleClick={handleNodeDoubleClick}
                isLoading={loadingNodes.has(node.data.id)}
              />
            ))}
          </g>
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