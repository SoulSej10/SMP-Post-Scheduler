import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Product image"

    if (!process.env.FAL_KEY) {
      return Response.json({
        imageUrl: `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(prompt)}`,
      })
    }

    // Example scaffold for Fal integration (uncomment once you add FAL_KEY):
    // import { fal } from "@fal-ai/serverless"
    // const client = fal(process.env.FAL_KEY)
    // const result = await client.invoke("fal-ai/fast-sdxl", {
    //   input: { prompt, image_size: "square_hd" },
    // })
    // const imageUrl = result?.images?.[0]?.url
    // return Response.json({ imageUrl: imageUrl || `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(prompt)}` })

    return Response.json({
      imageUrl: `/placeholder.svg?height=512&width=512&query=${encodeURIComponent(prompt)}`,
    })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "Image error" }), { status: 500 })
  }
}
