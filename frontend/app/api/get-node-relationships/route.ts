import { NextResponse } from "next/server"

const mockData: Record<string, Array<{ id: string; name: string; description: string }>> = {
  "1": [
    { id: "2", name: "Machine Learning", description: "Subfield of AI focusing on algorithms." },
    { id: "3", name: "Natural Language Processing", description: "Focuses on understanding human language." },
  ],
  "2": [
    { id: "4", name: "Neural Networks", description: "Framework for AI training algorithms." },
    { id: "5", name: "Decision Trees", description: "Algorithm for classification tasks." },
  ],
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const nodeId = searchParams.get("nodeId")

  if (!nodeId) {
    return NextResponse.json({ error: "Node ID is required" }, { status: 400 })
  }

  const relationships = mockData[nodeId] || []

  return NextResponse.json({ relationships })
}

