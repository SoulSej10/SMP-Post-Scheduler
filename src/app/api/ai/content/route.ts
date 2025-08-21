import type { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Write a short social post."
    const count: number = Math.max(1, Math.min(20, Number(body?.count || 5)))

    console.log("✅ Parsed prompt:", prompt, "✅ Count:", count)

    if (!process.env.GEMINI_API_KEY) {
      const variants = Array.from({ length: count }, (_, i) => `${prompt} (alt ${i + 1})`)
      return Response.json({ variants })
    }

    // Stronger instruction to Gemini
    const geminiPrompt = `
      You are an expert social media content creator.
      Always generate output as a numbered list.
      Each number must be a unique social media post variation.
      No intro or explanations.

      Prompt: ${prompt}
      Generate ${count} distinct variations of this post.
    `

    const result = await model.generateContent(geminiPrompt)

    const rawText = result.response.text()

    // Split into full numbered blocks instead of line-by-line
    const variants = rawText
      .split(/\n(?=\d+[.)]\s)/) // split only at "1. ", "2. ", etc.
      .map((block) => block.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean)
      .slice(0, count)

    return Response.json({ variants })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "AI error" }), { status: 500 })
  }
}
