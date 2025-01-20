"use client"

import { useEffect, useRef, useState } from "react"
import { LoadingOverlay } from "../LoadingOverlay"
import { LayoutProps } from "./types"
import "./styles.css"

export function Layout({ children, isLoading, className = "" }: LayoutProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        })
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  return (
    <div 
      ref={containerRef}
      className={`visualization-container ${className}`}
    >
      {dimensions.width > 0 && dimensions.height > 0 && (
        <>
          {children}
          {isLoading && <LoadingOverlay />}
        </>
      )}
    </div>
  )
} 