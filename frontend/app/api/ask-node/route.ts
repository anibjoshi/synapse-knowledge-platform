import { NextResponse } from "next/server"

const mockKnowledgeGraph: Record<
  string,
  { name: string; description: string; relationships: Array<{ id: string; name: string }> }
> = {
  "1": {
    name: "Artificial Intelligence",
    description: "A field of computer science focused on creating intelligent machines.",
    relationships: [
      { id: "2", name: "Machine Learning" },
      { id: "3", name: "Natural Language Processing" },
    ],
  },
  // ... (add more mock data as needed)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nodeId, question } = body

    if (!nodeId || !question) {
      return NextResponse.json({ error: "Node ID and question are required" }, { status: 400 })
    }

    const nodeData = mockKnowledgeGraph[nodeId]

    if (!nodeData) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 })
    }

    // Simulate RAG process
    const answer = `Here's an answer about ${nodeData.name} related to your question: "${question}". ${nodeData.description}`

    return NextResponse.json({ answer, relatedNodes: nodeData.relationships })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process question' },
      { status: 500 }
    )
  }
}

