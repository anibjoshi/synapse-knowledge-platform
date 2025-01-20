"use client"

import { useCallback, useRef, useState, useEffect } from "react"
import { BaseNodeData, BaseNodeProps } from "./types"
import "./styles.css"

const MIN_WIDTH = 120
const NODE_PADDING = 20
const NODE_HEIGHT = 40

export function BaseNode<T extends BaseNodeData>({
  data,
  x,
  y,
  height = NODE_HEIGHT,
  onUpdate,
  onAskQuestion
}: BaseNodeProps<T>): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [width, setWidth] = useState(MIN_WIDTH)
  const textRef = useRef<SVGTextElement>(null)
  const groupRef = useRef<SVGGElement>(null)

  // Calculate width based on text content
  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.getComputedTextLength()
      setWidth(Math.max(MIN_WIDTH, textWidth + NODE_PADDING * 2))
    }
  }, [data.name])

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    if (!onUpdate) return
    event.stopPropagation()
    setIsEditing(true)
  }, [onUpdate])

  // Handle question submission
  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!onAskQuestion) return
    await onAskQuestion(data.id, question)
    setIsAsking(false)  // Close the question input after submission
  }, [data.id, onAskQuestion])

  return (
    <g ref={groupRef} className="node" transform={`translate(${x},${y})`}>
      {/* Main node box */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        ry={8}
        className="node-box"
      />
      <text
        ref={textRef}
        x={0}
        y={0}
        className="node-text"
        onDoubleClick={handleDoubleClick}
      >
        {data.name}
      </text>

      {/* Question button */}
      {onAskQuestion && (
        <g
          className="question-button"
          transform={`translate(${width / 2 - 15}, ${-height / 2 - 15})`}
          onClick={() => setIsAsking(true)}
        >
          <circle r={10} className="question-circle" />
          <text
            className="question-symbol"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            ?
          </text>
        </g>
      )}

      {/* Edit overlay */}
      {isEditing && onUpdate && (
        <foreignObject
          x={-width / 2}
          y={-height / 2}
          width={width}
          height={height}
        >
          <input
            type="text"
            defaultValue={data.name}
            className="node-input"
            autoFocus
            onBlur={(e) => {
              if (e.target.value !== data.name) {
                onUpdate(data.id, e.target.value)
              }
              setIsEditing(false)
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
              if (e.key === "Escape") setIsEditing(false)
            }}
          />
        </foreignObject>
      )}

      {/* Question input */}
      {isAsking && onAskQuestion && (
        <foreignObject
          x={-width / 2}
          y={height / 2 + 10}
          width={width}
          height={60}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const input = e.currentTarget.querySelector("input")
              if (input?.value) {
                handleQuestionSubmit(input.value)  // Use the new handler
                input.value = ""  // Clear input after submission
              }
            }}
          >
            <input
              type="text"
              placeholder="Ask a question..."
              className="question-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsAsking(false)
                }
              }}
            />
          </form>
        </foreignObject>
      )}

      {/* Response display */}
      {data.response && (
        <foreignObject
          x={-width / 2}
          y={height / 2 + 10}
          width={width}
          height={60}
        >
          <div className="response-text">
            {data.response}
          </div>
        </foreignObject>
      )}
    </g>
  )
} 