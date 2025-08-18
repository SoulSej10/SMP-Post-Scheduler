import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { cohere } from "@ai-sdk/cohere"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Write a short social post."
    const count: number = Math.max(1, Math.min(20, Number(body?.count || 5)))

    if (!process.env.COHERE_API_KEY) {
      const variants = Array.from({ length: count }, (_, i) => `${prompt} (alt ${i + 1})`)
      return Response.json({ variants })
    }

    const { text } = await generateText({
      model: cohere("command-r-plus"), // You can also use "command-light" for cheaper
      system:
        "You are an expert social media content creator. Generate engaging, platform-appropriate posts that match the specified requirements exactly. Focus on the target audience and maintain the requested tone throughout. Always include relevant hashtags when keywords are provided.",
      prompt: `${prompt}\n\nGenerate ${count} distinct variations of this post. Each should be unique while maintaining the core message and requirements. Respond as a numbered list only.`,
    })

    const variants = text
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[).\s-]?\s*/, "").trim())
      .filter(Boolean)

    return Response.json({ variants: variants.slice(0, count) })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "AI error" }), { status: 500 })
  }
}
