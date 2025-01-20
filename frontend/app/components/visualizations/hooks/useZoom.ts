"use client"

import { useEffect } from "react"
import * as d3 from "d3"
import { ZoomConfig } from "../../../types/common"

interface ZoomOptions extends Partial<ZoomConfig> {
  enabled?: boolean
}

export function useZoom(
  svgRef: React.RefObject<SVGSVGElement>,
  options: ZoomOptions = {}
) {
  useEffect(() => {
    if (!svgRef.current || options.enabled === false) return

    const finalConfig = {
      minZoom: 0.3,
      maxZoom: 2,
      initialTransform: {
        x: 0,
        y: 0,
        scale: 1
      },
      ...options
    }

    const svg = d3.select(svgRef.current)
    const g = svg.select("g")

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([finalConfig.minZoom, finalConfig.maxZoom])
      .on("zoom", (event) => g.attr("transform", event.transform))

    svg.call(zoom)

    // Set initial transform
    const { x, y, scale } = finalConfig.initialTransform
    const initialTransform = d3.zoomIdentity
      .translate(x, y)
      .scale(scale)
    
    svg.call(zoom.transform, initialTransform)

    return () => {
      svg.on(".zoom", null)
    }
  }, [svgRef, options])
} 