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
  onAskQuestion,
  onDoubleClick: onChat,
  isLoading
}: BaseNodeProps<T>): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false)
  const [isAsking, setIsAsking] = useState(false)
  const [width, setWidth] = useState(MIN_WIDTH)
  const textRef = useRef<SVGTextElement>(null)
  const groupRef = useRef<SVGGElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Handle click outside
  useEffect(() => {
    if (!isAsking) return

    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setIsAsking(false)
      }
    }

    // Add click listener with a small delay to prevent immediate trigger
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAsking])

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

  const handleAskClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsAsking(prev => !prev)
  }, [])

  const handleQuestionSubmit = useCallback(async (question: string) => {
    if (!onAskQuestion) return
    await onAskQuestion(data.id, question)
    setIsAsking(false)
  }, [data.id, onAskQuestion])

  const handleChatClick = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChat?.(data.id, data.name)
  }, [data.id, data.name, onChat])

  return (
    <g ref={groupRef} className="node" transform={`translate(${x},${y})`} onDoubleClick={handleDoubleClick}>
      {/* Main node box */}
      <rect
        x={-width / 2}
        y={-height / 2}
        width={width}
        height={height}
        rx={8}
        ry={8}
        className={`node-box ${isLoading ? 'loading' : ''}`}
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <g className="loading-spinner">
          <circle
            cx={0}
            cy={0}
            r={12}
            className="spinner-track"
          />
          <circle
            cx={0}
            cy={0}
            r={12}
            className="spinner-head"
          />
        </g>
      )}

      <text
        ref={textRef}
        x={0}
        y={0}
        className="node-text"
        onDoubleClick={handleDoubleClick}
      >
        {data.name}
      </text>

      {/* Buttons container */}
      <g className="node-buttons" transform={`translate(${-width / 2 + 5}, ${-height / 2 - 15})`}>
        {/* Explore button */}
        {onAskQuestion && (
          <g
            className="question-button"
            onClick={handleAskClick}
          >
            <rect
              x={0}
              y={-8}
              width={50}
              height={16}
              rx={4}
              className="question-pill"
            />
            <text
              className="question-text"
              textAnchor="middle"
              dominantBaseline="middle"
              x={25}
            >
              Explore
            </text>
          </g>
        )}

        {/* Chat button */}
        {onChat && (
          <g
            className="chat-button"
            transform="translate(55, 0)"
            onClick={handleChatClick}
          >
            <rect
              x={0}
              y={-8}
              width={40}
              height={16}
              rx={4}
              className="chat-pill"
            />
            <text
              className="chat-text"
              textAnchor="middle"
              dominantBaseline="middle"
              x={20}
            >
              Chat
            </text>
          </g>
        )}
      </g>

      {/* Question input */}
      {isAsking && onAskQuestion && (
        <foreignObject
          x={-width / 2}
          y={height / 2 + 10}
          width={width}
          height={60}
          onMouseDown={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          <form
            ref={formRef}
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const input = inputRef.current
              if (input?.value) {
                handleQuestionSubmit(input.value)
                input.value = ""
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              type="text"
              placeholder="Explore deeper questions"
              className="question-input"
              autoFocus
              onKeyDown={(e) => {
                e.stopPropagation()
                if (e.key === "Escape") {
                  setIsAsking(false)
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </form>
        </foreignObject>
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
    </g>
  )
} 