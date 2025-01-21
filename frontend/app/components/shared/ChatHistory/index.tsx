"use client"

import { useState } from "react"
import "./styles.css"

interface SavedChat {
  id: string
  nodeId: string
  nodeName: string
  timestamp: Date
  preview: string
}

interface ChatHistoryProps {
  isOpen: boolean
  onClose: () => void
}

export function ChatHistory({ isOpen, onClose }: ChatHistoryProps) {
  const [savedChats] = useState<SavedChat[]>([
    {
      id: '1',
      nodeId: 'ml',
      nodeName: 'Machine Learning',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      preview: 'Discussion about ML in healthcare...'
    },
    {
      id: '2',
      nodeId: 'dl',
      nodeName: 'Deep Learning',
      timestamp: new Date(Date.now() - 1000 * 60 * 60),
      preview: 'Neural networks architecture...'
    }
  ])

  return (
    <div className={`chat-history ${isOpen ? 'open' : ''}`}>
      <div className="history-header">
        <h2 className="history-title">Saved Chats</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="history-list">
        {savedChats.map(chat => (
          <div key={chat.id} className="history-item">
            <div className="history-item-header">
              <span className="node-name">{chat.nodeName}</span>
              <span className="timestamp">
                {chat.timestamp.toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <p className="preview">{chat.preview}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 