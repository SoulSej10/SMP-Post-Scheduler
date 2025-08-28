import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const prompt: string = body?.prompt || "Professional social media image"

    console.log("Image generation request:", prompt.substring(0, 100))

    // For now, always use enhanced placeholders with Facebook dimensions
    const enhancedPlaceholder = generateEnhancedPlaceholder(prompt)
    console.log("Generated placeholder:", enhancedPlaceholder)

    return Response.json({ imageUrl: enhancedPlaceholder })
  } catch (e: any) {
    console.error("Image generation error:", e)
    // Always return a placeholder with Facebook dimensions
    const fallbackUrl = `/placeholder.svg?height=630&width=1200&query=${encodeURIComponent("Social media post")}`
    return Response.json({ imageUrl: fallbackUrl })
  }
}

function generateEnhancedPlaceholder(prompt: string): string {
  // Extract key information from prompt for better placeholder
  const imageType = extractImageType(prompt)
  const style = extractStyle(prompt)
  const colors = extractColors(prompt)
  const topic = extractImageTopic(prompt)

  // Create a more descriptive query for the placeholder
  const placeholderQuery = `${imageType} ${style} ${topic} ${colors}`.trim()

  // Add some randomization for variety
  const seed = Math.floor(Math.random() * 1000)

  // Use Facebook image dimensions (1200x630)
  return `/placeholder.svg?height=630&width=1200&query=${encodeURIComponent(placeholderQuery)}&seed=${seed}`
}

function extractImageType(prompt: string): string {
  const types = [
    "product photo",
    "infographic",
    "quote graphic",
    "behind-the-scenes",
    "lifestyle image",
    "chart",
    "before/after",
    "team photo",
    "event photo",
    "abstract design",
  ]

  for (const type of types) {
    if (prompt.toLowerCase().includes(type)) return type
  }

  return "professional image"
}

function extractStyle(prompt: string): string {
  const styles = [
    "modern and clean",
    "vibrant and colorful",
    "minimalist",
    "professional",
    "playful and fun",
    "elegant and sophisticated",
    "bold and dramatic",
    "warm and inviting",
    "tech-focused",
    "brand colors",
  ]

  for (const style of styles) {
    if (prompt.toLowerCase().includes(style)) return style
  }

  return "modern"
}

function extractColors(prompt: string): string {
  const colorKeywords = ["blue", "green", "red", "purple", "orange", "yellow", "pink", "teal", "brand colors"]

  for (const color of colorKeywords) {
    if (prompt.toLowerCase().includes(color)) return color
  }

  return "professional colors"
}

function extractImageTopic(prompt: string): string {
  // Try to extract topic from common patterns
  const topicMatch = prompt.match(/topic: ([^.]+)/i)
  if (topicMatch) return topicMatch[1].trim()

  const industryMatch = prompt.match(/industry: ([^.]+)/i)
  if (industryMatch) return industryMatch[1].trim()

  return "business content"
}
