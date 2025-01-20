"use client"

import { useMemo } from "react"
import * as d3 from "d3"
import { BaseNodeData, Dimensions, LayoutConfig } from "@/app/components/types/common"

const DEFAULT_CONFIG: LayoutConfig = {
  type: "tree",
  orientation: "horizontal",
  nodeSpacing: {
    horizontal: 200,
    vertical: 60
  },
  margins: {
    top: 20,
    right: 120,
    bottom: 20,
    left: 120
  }
}

export function useLayout<T extends BaseNodeData>(
  data: T | T[],
  dimensions: Dimensions,
  config: Partial<LayoutConfig> = {}
) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  return useMemo(() => {
    if (!dimensions.width || !dimensions.height) return null

    if (finalConfig.type === "tree") {
      const tree = d3.tree<T>()
        .nodeSize([
          finalConfig.nodeSpacing!.vertical,
          finalConfig.nodeSpacing!.horizontal
        ])

      const hierarchy = d3.hierarchy(data as T)
      const root = tree(hierarchy)

      // Adjust coordinates based on orientation
      if (finalConfig.orientation === "horizontal") {
        root.each(d => {
          const temp = d.x
          d.x = d.y + finalConfig.margins!.left
          d.y = temp + dimensions.height / 2
        })
      }

      return root
    }

    // Graph layout using force simulation
    if (finalConfig.type === "graph") {
      // ... graph layout logic (we'll implement this when needed)
      return null
    }

    return null
  }, [data, dimensions, finalConfig])
} 