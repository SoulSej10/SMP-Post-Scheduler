import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { xai } from "@ai-sdk/xai"


export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Write a short social post."
    const count: number = Math.max(1, Math.min(20, Number(body?.count || 5)))

    if (!process.env.XAI_API_KEY) {
      const variants = Array.from({ length: count }, (_, i) => `${prompt} (alt ${i + 1})`)
      return Response.json({ variants })
    }

    const { text } = await generateText({
      model: xai("grok-3"),
      system:
        "You generate concise, engaging social media copy for Facebook, Instagram, and LinkedIn audiences. Provide diverse variations and avoid duplication.",
      prompt:
        `Create ${count} distinct social media post variations based on the following briefing. ` +
        `Respond as a numbered list only. Keep each item under 240 characters. Avoid hashtags unless helpful. ` +
        `Briefing: ${prompt}`,
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
