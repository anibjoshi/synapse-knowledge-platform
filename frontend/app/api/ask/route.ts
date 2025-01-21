import { NextResponse } from "next/server"
import { ApiResponse } from '@/app/components/types/common'

const MOCK_RESPONSES: Record<string, ApiResponse> = {
  // Root level responses
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

  // Machine Learning drill-downs
  'ml-types': {
    type: 'children',
    nodes: [
      { id: 'supervised', name: 'Supervised Learning', parentId: 'ml', relationship: 'type' },
      { id: 'unsupervised', name: 'Unsupervised Learning', parentId: 'ml', relationship: 'type' },
      { id: 'reinforcement', name: 'Reinforcement Learning', parentId: 'ml', relationship: 'type' }
    ]
  },
  'ml-companies': {
    type: 'children',
    nodes: [
      { id: 'databricks', name: 'Databricks', parentId: 'ml', relationship: 'company' },
      { id: 'h2o', name: 'H2O.ai', parentId: 'ml', relationship: 'company' },
      { id: 'datarobot', name: 'DataRobot', parentId: 'ml', relationship: 'company' }
    ]
  },
  'ml-products': {
    type: 'children',
    nodes: [
      { id: 'sklearn', name: 'Scikit-learn', parentId: 'ml', relationship: 'product' },
      { id: 'tensorflow', name: 'TensorFlow', parentId: 'ml', relationship: 'product' },
      { id: 'pytorch', name: 'PyTorch', parentId: 'ml', relationship: 'product' }
    ]
  },

  // Deep Learning drill-downs
  'dl-types': {
    type: 'children',
    nodes: [
      { id: 'cnn', name: 'Convolutional Neural Networks', parentId: 'dl', relationship: 'type' },
      { id: 'rnn', name: 'Recurrent Neural Networks', parentId: 'dl', relationship: 'type' },
      { id: 'transformers', name: 'Transformers', parentId: 'dl', relationship: 'type' }
    ]
  },
  'dl-companies': {
    type: 'children',
    nodes: [
      { id: 'deepmind', name: 'DeepMind', parentId: 'dl', relationship: 'company' },
      { id: 'meta', name: 'Meta AI', parentId: 'dl', relationship: 'company' },
      { id: 'nvidia', name: 'NVIDIA', parentId: 'dl', relationship: 'company' }
    ]
  },
  'dl-products': {
    type: 'children',
    nodes: [
      { id: 'stable-diffusion', name: 'Stable Diffusion', parentId: 'dl', relationship: 'product' },
      { id: 'dall-e', name: 'DALL-E', parentId: 'dl', relationship: 'product' },
      { id: 'midjourney', name: 'Midjourney', parentId: 'dl', relationship: 'product' }
    ]
  },

  // NLP drill-downs
  'nlp-types': {
    type: 'children',
    nodes: [
      { id: 'translation', name: 'Machine Translation', parentId: 'nlp', relationship: 'type' },
      { id: 'sentiment', name: 'Sentiment Analysis', parentId: 'nlp', relationship: 'type' },
      { id: 'qa', name: 'Question Answering', parentId: 'nlp', relationship: 'type' }
    ]
  },
  'nlp-companies': {
    type: 'children',
    nodes: [
      { id: 'cohere', name: 'Cohere', parentId: 'nlp', relationship: 'company' },
      { id: 'huggingface', name: 'Hugging Face', parentId: 'nlp', relationship: 'company' },
      { id: 'ai21', name: 'AI21 Labs', parentId: 'nlp', relationship: 'company' }
    ]
  },
  'nlp-products': {
    type: 'children',
    nodes: [
      { id: 'gpt4', name: 'GPT-4', parentId: 'nlp', relationship: 'product' },
      { id: 'palm', name: 'PaLM', parentId: 'nlp', relationship: 'product' },
      { id: 'bert', name: 'BERT', parentId: 'nlp', relationship: 'product' }
    ]
  }
}

export async function POST(request: Request) {
  const { nodeId, question } = await request.json()
  
  console.log('API called with:', { nodeId, question })

  // Simple question parsing
  let responseKey = nodeId
  const questionLower = question.toLowerCase()
  
  if (questionLower.includes('type')) {
    responseKey = `${nodeId}-types`
  } else if (questionLower.includes('compan')) {
    responseKey = `${nodeId}-companies`
  } else if (questionLower.includes('product')) {
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