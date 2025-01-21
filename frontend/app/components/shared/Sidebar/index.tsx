"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import "./styles.css"

interface Message {
  id: string
  content: string
  sender: "user" | "assistant"
  timestamp: Date
}

interface SidebarProps {
  isOpen: boolean
  selectedNode: {
    id: string
    name: string
  } | null
  onClose: () => void
}

export function Sidebar({ isOpen, selectedNode, onClose }: SidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: "Tell me more about machine learning applications in healthcare.",
      sender: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 5) // 5 minutes ago
    },
    {
      id: '2',
      content: "Machine learning in healthcare is revolutionizing patient care through various applications such as disease diagnosis, treatment prediction, and medical imaging analysis. For example, deep learning models can detect abnormalities in X-rays and MRIs with high accuracy.",
      sender: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 4) // 4 minutes ago
    },
    {
      id: '3',
      content: "What about predictive analytics for patient outcomes?",
      sender: "user",
      timestamp: new Date(Date.now() - 1000 * 60 * 3) // 3 minutes ago
    },
    {
      id: '4',
      content: "Predictive analytics uses patient data to forecast potential health risks and outcomes. This helps healthcare providers take preventive measures and optimize treatment plans. The models analyze factors like medical history, lifestyle data, and genetic information to make these predictions.",
      sender: "assistant",
      timestamp: new Date(Date.now() - 1000 * 60 * 2) // 2 minutes ago
    }
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Reset messages when node changes
  useEffect(() => {
    setMessages([])
  }, [selectedNode?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !selectedNode) return

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date()
    }

    setMessages(prev => [...prev, newMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nodeId: selectedNode.id,
          message: inputValue
        })
      })

      const data = await response.json()

      const assistantMessage: Message = {
        id: Date.now().toString(),
        content: data.response,
        sender: "assistant",
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">{selectedNode?.name}</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      
      <div className="messages-container">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user' : 'assistant'}`}
          >
            <div className="message-content">{message.content}</div>
            <div className="message-timestamp">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="loading-dots">
              <span>.</span><span>.</span><span>.</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="input-container" onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Ask a question..."
          disabled={isLoading}
          className="chat-input"
        />
        <button 
          type="submit" 
          disabled={isLoading || !inputValue.trim()}
          className="send-button"
        >
          
        </button>
      </form>
    </div>
  )
} 