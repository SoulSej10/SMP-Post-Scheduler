import type { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Write a short social post."
    const count: number = Math.max(1, Math.min(20, Number(body?.count || 5)))
    const length: string = body?.length || "medium" // Get length parameter

    console.log("✅ Parsed prompt:", prompt, "✅ Count:", count, "✅ Length:", length)

    if (!process.env.GEMINI_API_KEY) {
      const variants = Array.from({ length: count }, (_, i) => `${prompt} (alt ${i + 1})`)
      return Response.json({ variants })
    }

    const lengthInstructions = {
      short: "Keep each post under 100 characters. Be concise and punchy.",
      medium: "Keep each post between 100-200 characters. Provide good detail without being too long.",
      long: "Make each post 200+ characters. Include comprehensive details, examples, and context.",
    }

    const lengthInstruction = lengthInstructions[length as keyof typeof lengthInstructions] || lengthInstructions.medium

    const geminiPrompt = `
You are an expert social media content creator.

Generate ${count} distinct social media posts for this prompt:
"${prompt}"

IMPORTANT CHARACTER LIMIT: ${lengthInstruction}

Rules:
- Each post must be completely unique (no duplicates or simple rephrasings).
- Do not repeat hooks, CTAs, or hashtags across posts.
- Style, structure, and word choice must vary significantly.
- Use text formatting like **bold**, *italic*, and other decorations when appropriate.
- STRICTLY follow the character limit specified above.
- Output as a numbered list (1., 2., etc.).
- No intro, explanations, or extra text.
    `

    const result = await model.generateContent(geminiPrompt)

    const rawText = result.response.text()

    let variants = rawText
      .split(/\n(?=\d+[.)]\s)/)
      .map((block) => block.replace(/^\d+[.)]\s*/, "").trim())
      .filter(Boolean)

    const targetLength = length as "short" | "medium" | "long"
    variants = variants.filter((post) => {
      const charCount = post.length
      switch (targetLength) {
        case "short":
          return charCount < 100
        case "medium":
          return charCount >= 100 && charCount <= 200
        case "long":
          return charCount > 200
        default:
          return true
      }
    })

    const seen = new Set<string>()
    variants = variants.filter((post) => {
      const normalized = post.toLowerCase().replace(/\s+/g, " ").trim()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    })

    if (variants.length < count) {
      const extraPrompt = `
Generate ${count - variants.length} MORE unique posts for:
"${prompt}"

IMPORTANT CHARACTER LIMIT: ${lengthInstruction}

Follow same rules: all must be distinct from each other and from these already generated posts.
Use text formatting like **bold**, *italic*, and other decorations when appropriate.
STRICTLY follow the character limit specified above.
    `
      const extra = await model.generateContent(extraPrompt)
      const extraText = extra.response.text()
      let extraVariants = extraText
        .split(/\n(?=\d+[.)]\s)/)
        .map((block) => block.replace(/^\d+[.)]\s*/, "").trim())
        .filter(Boolean)

      // Filter extra variants by character count
      extraVariants = extraVariants.filter((post) => {
        const charCount = post.length
        switch (targetLength) {
          case "short":
            return charCount < 100
          case "medium":
            return charCount >= 100 && charCount <= 200
          case "long":
            return charCount > 200
          default:
            return true
        }
      })

      for (const post of extraVariants) {
        const normalized = post.toLowerCase().replace(/\s+/g, " ").trim()
        if (!seen.has(normalized) && variants.length < count) {
          seen.add(normalized)
          variants.push(post)
        }
      }
    }

    return Response.json({ variants: variants.slice(0, count) })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "AI error" }), { status: 500 })
  }
}
