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

Generate ${count} distinct full-length social media posts based on this prompt:

"${prompt}"

Each post must:
- Be at least 150 words
- Start with a catchy hook with emojis 🎉🚀✨
- Use bullet points (with emojis) to highlight key points
- End with a strong call to action (CTA) and relevant hashtags
- Be clearly separated as a numbered list (1., 2., etc.)
Do not add explanations — only output the posts.
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
