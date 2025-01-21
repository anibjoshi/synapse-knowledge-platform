import { NextResponse } from "next/server"

interface ResponseMap {
  [key: string]: {
    default: string;
    [key: string]: string;
  }
}

const MOCK_RESPONSES: ResponseMap = {
  'root': {
    default: 'Artificial Intelligence (AI) is the simulation of human intelligence by machines. It encompasses various subfields including machine learning, deep learning, and natural language processing.'
  },
  'ml': {
    default: 'Machine Learning is a subset of AI that enables systems to learn and improve from experience without explicit programming. It uses statistical techniques to allow computers to "learn" from data.'
  },
  'dl': {
    default: 'Deep Learning is a type of machine learning based on artificial neural networks. It uses multiple layers to progressively extract higher-level features from raw input.'
  },
  'nlp': {
    default: 'Natural Language Processing (NLP) is a branch of AI that helps computers understand, interpret, and manipulate human language. It powers technologies like machine translation and chatbots.'
  },
  'default': {
    default: 'This is a fascinating topic in artificial intelligence. What specific aspect would you like to learn more about?'
  }
}

export async function POST(request: Request) {
  const { nodeId, message } = await request.json()
  
  console.log('Chat API called with:', { nodeId, message })

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Get node-specific responses or default
  const nodeResponses = MOCK_RESPONSES[nodeId] || MOCK_RESPONSES.default
  
  // For now, just return the default response for the node
  const response = nodeResponses.default

  return NextResponse.json({ response })
} 