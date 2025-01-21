"use client"

import { useState, useCallback } from "react"
import { TreeVisualization } from "./components/visualizations/Tree"
import { TreeNodeData } from "./components/visualizations/Tree/types"
import { ApiResponse } from "./components/types/common"

const INITIAL_TREE_DATA: TreeNodeData = {
  id: "root",
  name: "Artificial Intelligence",
  children: []  // Start with no children
}

export default function Home(): React.ReactElement {
  const [treeData, setTreeData] = useState<TreeNodeData>(INITIAL_TREE_DATA)
  const [isLoading, setIsLoading] = useState(false)

  const handleAskQuestion = useCallback(async (nodeId: string, question: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId, question })
      })

      const data: ApiResponse = await response.json()
      
      if (data.type === 'children') {
        setTreeData(prev => {
          const updateNode = (node: TreeNodeData): TreeNodeData => {
            if (node.id === nodeId) {
              // Get existing children or empty array
              const existingChildren = node.children || []
              
              // Create new children objects
              const newChildren = data.nodes.map(n => ({
                id: n.id,
                name: n.name,
                relationship: n.relationship,
                children: []
              }))

              // Create Set of existing IDs for O(1) lookup
              const existingIds = new Set(existingChildren.map(child => child.id))
              
              // Filter out duplicates and combine with existing children
              const mergedChildren = [
                ...existingChildren,
                ...newChildren.filter(newChild => !existingIds.has(newChild.id))
              ]

              return {
                ...node,
                children: mergedChildren
              }
            }
            if (node.children) {
              return {
                ...node,
                children: node.children.map(updateNode)
              }
            }
            return node
          }
          return updateNode(prev)
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <main className="w-screen h-screen">
      <TreeVisualization
        initialData={treeData}
        onAskQuestion={handleAskQuestion}
        isLoading={isLoading}
      />
    </main>
  )
}

