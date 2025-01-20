import { NextResponse } from "next/server"
import { ApiResponse } from '@/app/components/types/common'

const MOCK_RESPONSES: Record<string, ApiResponse> = {
  'root-types': {
    type: 'children',
    nodes: [
      { id: 'ml', name: 'Machine Learning', parentId: 'root', relationship: 'type' },
      { id: 'dl', name: 'Deep Learning', parentId: 'root', relationship: 'type' },
      { id: 'nlp', name: 'Natural Language Processing', parentId: 'root', relationship: 'type' }
    ]
  },
  'root-companies': {
    type: 'children',
    nodes: [
      { id: 'openai', name: 'OpenAI', parentId: 'root', relationship: 'company' },
      { id: 'google', name: 'Google AI', parentId: 'root', relationship: 'company' },
      { id: 'anthropic', name: 'Anthropic', parentId: 'root', relationship: 'company' }
    ]
  },
  'root-products': {
    type: 'children',
    nodes: [
      { id: 'chatgpt', name: 'ChatGPT', parentId: 'root', relationship: 'product' },
      { id: 'bard', name: 'Bard', parentId: 'root', relationship: 'product' },
      { id: 'claude', name: 'Claude', parentId: 'root', relationship: 'product' }
    ]
  },
  'ml': {
    type: 'children',
    nodes: [
      { id: 'supervised', name: 'Supervised Learning', parentId: 'ml' },
      { id: 'unsupervised', name: 'Unsupervised Learning', parentId: 'ml' },
      { id: 'reinforcement', name: 'Reinforcement Learning', parentId: 'ml' }
    ]
  },
  'dl': {
    type: 'children',
    nodes: [
      { id: 'cnn', name: 'Convolutional Neural Networks', parentId: 'dl' },
      { id: 'rnn', name: 'Recurrent Neural Networks', parentId: 'dl' },
      { id: 'transformers', name: 'Transformers', parentId: 'dl' }
    ]
  },
  'nlp': {
    type: 'children',
    nodes: [
      { id: 'nlp_tasks', name: 'NLP Tasks', parentId: 'nlp' },
      { id: 'embeddings', name: 'Word Embeddings', parentId: 'nlp' },
      { id: 'llm', name: 'Large Language Models', parentId: 'nlp' }
    ]
  }
}

export async function POST(request: Request) {
  const { nodeId, question } = await request.json()
  
  console.log('API called with:', { nodeId, question })

  // Simple question parsing
  let responseKey = nodeId
  if (question.toLowerCase().includes('type')) {
    responseKey = `${nodeId}-types`
  } else if (question.toLowerCase().includes('compan')) {
    responseKey = `${nodeId}-companies`
  } else if (question.toLowerCase().includes('product')) {
    responseKey = `${nodeId}-products`
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const response = MOCK_RESPONSES[responseKey] || {
    type: 'children',
    nodes: []
  }
  
  console.log('Returning response:', response)
  
  return NextResponse.json(response)
} 