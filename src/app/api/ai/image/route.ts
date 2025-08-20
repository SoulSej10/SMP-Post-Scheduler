import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Professional social media image"

    const response = await fetch("https://api.stability.ai/v2beta/stable-image/generate/core", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STABILITY_API_KEY}`,
        Accept: "application/json",
      },
      body: (() => {
        const form = new FormData()
        form.append("prompt", prompt)
        form.append("output_format", "png")
        return form
      })(),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Stability API error: ${response.status} - ${err}`)
    }

    const result = await response.json()

    if (!result?.image) {
      throw new Error("No image returned from Stability API")
    }

    const imageBuffer = Buffer.from(result.image, "base64")

    return new Response(imageBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": "inline; filename=generated.png", 
      },
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Image error" }), { status: 500 })
  }
}
