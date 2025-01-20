"use client"

import { useCallback, useEffect, useRef } from "react"
import * as d3 from "d3"
import { Dimensions } from "@/app/components/types/common"
import { GraphData, GraphNodeData } from "./types"

interface SimulationConfig {
  strength?: number
  distance?: number
  center?: number
}

const DEFAULT_CONFIG: SimulationConfig = {
  strength: -800,
  distance: 200,
  center: 0.1
}

export function useSimulation(
  data: GraphData,
  dimensions: Dimensions,
  config: SimulationConfig = DEFAULT_CONFIG
) {
  const simulationRef = useRef<d3.Simulation<GraphNodeData, any> | null>(null)

  // Initialize or update simulation
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return

    // Stop existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop()
    }

    // Create new simulation
    simulationRef.current = d3.forceSimulation<GraphNodeData>(data.nodes)
      .force("link", d3.forceLink<GraphNodeData, GraphLinkData>(data.links)
        .id(d => d.id)
        .distance(config.distance))
      .force("charge", d3.forceManyBody()
        .strength(config.strength))
      .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
        .strength(config.center))
      .force("collision", d3.forceCollide().radius(50))
      .alphaDecay(0.02)
      .velocityDecay(0.4)

    return () => {
      simulationRef.current?.stop()
    }
  }, [data, dimensions, config])

  // Update node position
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    if (!simulationRef.current) return

    const node = simulationRef.current.nodes().find(n => n.id === nodeId)
    if (node) {
      node.fx = x
      node.fy = y
      simulationRef.current.alpha(0.1).restart()
    }
  }, [])

  // Release node position
  const releaseNode = useCallback((nodeId: string) => {
    if (!simulationRef.current) return

    const node = simulationRef.current.nodes().find(n => n.id === nodeId)
    if (node) {
      node.fx = null
      node.fy = null
      simulationRef.current.alpha(0.3).restart()
    }
  }, [])

  return {
    simulation: simulationRef.current,
    updateNodePosition,
    releaseNode
  }
} 