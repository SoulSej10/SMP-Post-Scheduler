import type { NextRequest } from "next/server"
import { generateText } from "ai"
import { cohere } from "@ai-sdk/cohere"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Write a short social post."
    const count: number = Math.max(1, Math.min(20, Number(body?.count || 5)))
    console.log("✅ Parsed prompt:", prompt, "✅ Count:", count)
    if (!process.env.COHERE_API_KEY) {
      const variants = Array.from({ length: count }, (_, i) => `${prompt} (alt ${i + 1})`)
      return Response.json({ variants })
    }

    // Run multiple generations manually since `n` is not supported
    const results = await Promise.all(
      Array.from({ length: count }).map(async () => {
        const { text } = await generateText({
          model: cohere("command-r-plus"),
          system:
            "You are an expert social media content creator. Always generate output as a numbered list. Each number must be a unique social media post variation. No intro or explanations.",
          prompt: `${prompt}\n\nGenerate ${count} distinct variations of this post.`,
        })
        return text
      })
    )

    // Clean and filter
    const variants = results
      .flatMap((t: string) =>
        t
          .split("\n")
          .map((line) => line.replace(/^\s*\d+[).\s-]?\s*/, "").trim())
      )
      .filter(Boolean)
      .slice(0, count)

    return Response.json({ variants })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "AI error" }), { status: 500 })
  }
}
