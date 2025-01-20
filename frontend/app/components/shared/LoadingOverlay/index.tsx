"use client"

import "./styles.css"

export function LoadingOverlay(): React.ReactElement {
  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
    </div>
  )
} 