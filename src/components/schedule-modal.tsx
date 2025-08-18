"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createPostsForSchedule, hashContent, normalizeContent } from "@/lib/scheduling"
import { getSessionUser, savePosts, getPostsForUser } from "@/lib/storage"
import type { Platform, Post } from "@/lib/types"

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
}

const ALL_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin"]

export default function ScheduleModal({ open, onOpenChange }: Props) {
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState<string>(() =>
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  )
  const [frequency, setFrequency] = useState<number>(3) // posts per week
  const [platforms, setPlatforms] = useState<Platform[]>(["facebook", "instagram", "linkedin"])
  const [loading, setLoading] = useState<boolean>(false)
  const [resultCount, setResultCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)
  const [useAIContent, setUseAIContent] = useState<boolean>(true)
  const [useAIImage, setUseAIImage] = useState<boolean>(true)

  const [templateValues, setTemplateValues] = useState({
    length: "medium" as "short" | "medium" | "long",
    platform: "facebook" as Platform,
    niche: "",
    topic: "",
    keyPoints: "",
    audience: "",
    tone: "professional" as string,
    elements: [] as string[],
    callToAction: "",
    perspective: "first-person" as "first-person" | "third-person",
    keywords: "",
    imageType: "product photo" as string,
    imageStyle: "modern and clean" as string,
  })

  const [showAdvanced, setShowAdvanced] = useState(false)

  // Predefined options
  const lengthOptions = [
    { value: "short", label: "Short (under 100 chars)" },
    { value: "medium", label: "Medium (100-200 chars)" },
    { value: "long", label: "Long (200+ chars)" },
  ]

  const toneOptions = [
    "professional",
    "casual",
    "friendly",
    "authoritative",
    "inspirational",
    "humorous",
    "educational",
    "conversational",
    "urgent",
    "empathetic",
  ]

  const elementOptions = [
    "bullet points",
    "emojis",
    "storytelling",
    "statistics",
    "questions",
    "quotes",
    "tips",
    "benefits",
    "features",
    "testimonials",
  ]

  const imageTypeOptions = [
    "product photo",
    "infographic",
    "quote graphic",
    "behind-the-scenes",
    "lifestyle image",
    "chart/graph",
    "before/after",
    "team photo",
    "event photo",
    "abstract design",
  ]

  const imageStyleOptions = [
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

  useEffect(() => {
    if (!open) {
      setError(null)
      setResultCount(0)
    }
  }, [open])

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]))
  }

  const handleCreate = async () => {
    setError(null)
    setLoading(true)
    try {
      const user = getSessionUser()
      if (!user) {
        setError("You must be logged in.")
        setLoading(false)
        return
      }

      const baseCount = estimateTotalPosts(startDate, endDate, frequency)

      // Build the structured prompt from template
      const structuredPrompt = buildPromptFromTemplate(templateValues)

      const textVariants = useAIContent
        ? await generateTextVariants(structuredPrompt, baseCount)
        : Array.from({ length: baseCount }, (_, i) => `${templateValues.topic || "Social media post"} (#${i + 1})`)

      // Build image prompt from template
      const imagePrompt = buildImagePromptFromTemplate(templateValues)
      const imageUrl = useAIImage ? await generateImage(imagePrompt) : "/generic-social-post.png"

      // de-duplicate against existing content
      const existing = getPostsForUser(user.id)
      const seen = new Set(existing.map((p) => hashContent(p.content)))
      const uniqueVariants: string[] = []
      for (const v of textVariants) {
        const key = hashContent(v)
        if (!seen.has(key) && !uniqueVariants.some((u) => hashContent(u) === key)) {
          uniqueVariants.push(v)
        } else {
          // try to lightly vary content to remain unique
          const alt = `${v}\n\n${generateVarietyTag(uniqueVariants.length)}`
          if (!seen.has(hashContent(alt))) {
            uniqueVariants.push(alt)
          }
        }
      }

      const posts = createPostsForSchedule({
        userId: user.id,
        startDate,
        endDate,
        frequencyPerWeek: frequency,
        platforms,
        variants: uniqueVariants,
        imageUrl,
      })

      // persist
      const previous = getPostsForUser(user.id)
      const merged = dedupePosts([...previous, ...posts])
      savePosts(user.id, merged)

      setResultCount(posts.length)
      // close after a short delay
      setTimeout(() => {
        setLoading(false)
        onOpenChange(false)
      }, 500)
    } catch (e: any) {
      setLoading(false)
      setError(e?.message ?? "Failed to create schedule")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create AI Schedule</DialogTitle>
          <DialogDescription>
            Generate scheduled posts across selected dates and platforms. Use advanced mode to to configure more details about post's AI content generation.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          {/* Schedule Settings */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Schedule Settings</CardTitle>
              <CardDescription>Configure when and where your posts will be published</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="start">Start date</Label>
                  <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End date</Label>
                  <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freq">Posts per week</Label>
                  <Input
                    id="freq"
                    type="number"
                    min={1}
                    max={14}
                    value={frequency}
                    onChange={(e) => setFrequency(Number(e.target.value || 1))}
                  />
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <Label>Target Platforms</Label>
                <div className="flex flex-wrap gap-4">
                  {ALL_PLATFORMS.map((p) => (
                    <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                      <Checkbox checked={platforms.includes(p)} onCheckedChange={() => togglePlatform(p)} />
                      <span className="capitalize font-medium">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Generation */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Content Generation</CardTitle>
                  <CardDescription>Customize how AI creates your social media content</CardDescription>
                </div>
                <Button
                  type="button"
                  variant={showAdvanced ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="min-w-[120px]"
                >
                  {showAdvanced ? "Simple Mode" : "Advanced Mode"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!showAdvanced ? (
                // Simple mode - just topic and key points
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="topic">What's your topic?</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., New product launch, Company milestone, Industry insights"
                      value={templateValues.topic}
                      onChange={(e) => setTemplateValues((prev) => ({ ...prev, topic: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keyPoints">Key points to highlight</Label>
                    <Textarea
                      id="keyPoints"
                      rows={3}
                      placeholder="e.g., 50% faster performance, Available now, Limited time offer"
                      value={templateValues.keyPoints}
                      onChange={(e) => setTemplateValues((prev) => ({ ...prev, keyPoints: e.target.value }))}
                    />
                  </div>
                </div>
              ) : (
                // Advanced mode - organized sections
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Post Length</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={templateValues.length}
                          onChange={(e) => setTemplateValues((prev) => ({ ...prev, length: e.target.value as any }))}
                        >
                          {lengthOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label>Primary Platform</Label>
                        <select
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={templateValues.platform}
                          onChange={(e) =>
                            setTemplateValues((prev) => ({ ...prev, platform: e.target.value as Platform }))
                          }
                        >
                          <option value="facebook">Facebook</option>
                          <option value="instagram">Instagram</option>
                          <option value="linkedin">LinkedIn</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="niche">Industry/Niche</Label>
                        <Input
                          id="niche"
                          placeholder="e.g., SaaS, E-commerce, Healthcare, Education"
                          value={templateValues.niche}
                          onChange={(e) => setTemplateValues((prev) => ({ ...prev, niche: e.target.value }))}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="topic-adv">Main Topic</Label>
                        <Input
                          id="topic-adv"
                          placeholder="e.g., Product launch, Company news, Tips"
                          value={templateValues.topic}
                          onChange={(e) => setTemplateValues((prev) => ({ ...prev, topic: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Content Details */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Content Details
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyPoints-adv">Key Points to Highlight</Label>
                        <Textarea
                          id="keyPoints-adv"
                          rows={3}
                          placeholder="e.g., 50% performance boost, Available now, Free trial"
                          value={templateValues.keyPoints}
                          onChange={(e) => setTemplateValues((prev) => ({ ...prev, keyPoints: e.target.value }))}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="audience">Target Audience</Label>
                          <Input
                            id="audience"
                            placeholder="e.g., Small business owners, Tech professionals"
                            value={templateValues.audience}
                            onChange={(e) => setTemplateValues((prev) => ({ ...prev, audience: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Tone of Voice</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={templateValues.tone}
                            onChange={(e) => setTemplateValues((prev) => ({ ...prev, tone: e.target.value }))}
                          >
                            {toneOptions.map((tone) => (
                              <option key={tone} value={tone}>
                                {tone.charAt(0).toUpperCase() + tone.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Style & Elements */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      Style & Elements
                    </h4>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Content Elements (select what to include)</Label>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                          {elementOptions.map((element) => (
                            <label
                              key={element}
                              className="flex items-center gap-2 text-sm p-2 rounded border hover:bg-muted/50 cursor-pointer"
                            >
                              <Checkbox
                                checked={templateValues.elements.includes(element)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setTemplateValues((prev) => ({
                                      ...prev,
                                      elements: [...prev.elements, element],
                                    }))
                                  } else {
                                    setTemplateValues((prev) => ({
                                      ...prev,
                                      elements: prev.elements.filter((e) => e !== element),
                                    }))
                                  }
                                }}
                              />
                              <span className="capitalize">{element}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="callToAction">Call to Action</Label>
                          <Input
                            id="callToAction"
                            placeholder="e.g., Sign up today, Learn more, Get started"
                            value={templateValues.callToAction}
                            onChange={(e) => setTemplateValues((prev) => ({ ...prev, callToAction: e.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Writing Perspective</Label>
                          <select
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={templateValues.perspective}
                            onChange={(e) =>
                              setTemplateValues((prev) => ({ ...prev, perspective: e.target.value as any }))
                            }
                          >
                            <option value="first-person">First Person (We/I)</option>
                            <option value="third-person">Third Person (They/Company)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* SEO & Discovery */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
                      SEO & Discovery
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="keywords">Keywords for Hashtags</Label>
                      <Input
                        id="keywords"
                        placeholder="e.g., productivity, automation, business, growth"
                        value={templateValues.keywords}
                        onChange={(e) => setTemplateValues((prev) => ({ ...prev, keywords: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate keywords with commas. AI will generate relevant hashtags.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Image Generation */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Image Generation</CardTitle>
                  <CardDescription>Let AI create custom images for your posts</CardDescription>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox checked={useAIImage} onCheckedChange={(v) => setUseAIImage(Boolean(v))} />
                  <span className="font-medium">Generate Images</span>
                </label>
              </div>
            </CardHeader>
            {useAIImage && (
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Image Type</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={templateValues.imageType}
                      onChange={(e) => setTemplateValues((prev) => ({ ...prev, imageType: e.target.value }))}
                    >
                      {imageTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Visual Style</Label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={templateValues.imageStyle}
                      onChange={(e) => setTemplateValues((prev) => ({ ...prev, imageStyle: e.target.value }))}
                    >
                      {imageStyleOptions.map((style) => (
                        <option key={style} value={style}>
                          {style.charAt(0).toUpperCase() + style.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        <div className="flex justify-between items-center flex-shrink-0 border-t pt-4 mt-6">
          <div className="flex items-center gap-4">
            {error && <p className="text-sm text-destructive">{error}</p>}
            {resultCount > 0 && (
              <p className="text-sm text-green-600">
                ✓ Created <Badge variant="secondary">{resultCount}</Badge> posts successfully!
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={loading || platforms.length === 0}>
              {loading ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function estimateTotalPosts(start: string, end: string, freqPerWeek: number) {
  const msPerDay = 24 * 60 * 60 * 1000
  const s = new Date(start).getTime()
  const e = new Date(end).getTime()
  const days = Math.max(1, Math.ceil((e - s) / msPerDay) + 1)
  const weeks = Math.max(1, Math.ceil(days / 7))
  return weeks * Math.max(1, freqPerWeek)
}

async function generateTextVariants(prompt: string, count: number): Promise<string[]> {
  const res = await fetch("/api/ai/content", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, count }),
  })
  if (!res.ok) {
    // fallback to simple variations
    return Array.from({ length: count }, (_, i) => `${prompt} (variant ${i + 1})`)
  }
  const data = (await res.json()) as { variants: string[] }
  const variants = data?.variants ?? []
  if (variants.length >= count) return variants.slice(0, count)
  // pad if needed
  return [...variants, ...Array.from({ length: count - variants.length }, (_, i) => `${prompt} (v${i + 1})`)]
}

async function generateImage(prompt: string): Promise<string> {
  const res = await fetch("/api/ai/image", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    return "/ai-placeholder.png"
  }
  const data = (await res.json()) as { imageUrl: string }
  return data.imageUrl || "/ai-placeholder.png"
}

function generateVarietyTag(index: number) {
  const tags = [
    "Fresh angle",
    "Alternative phrasing",
    "New call-to-action",
    "Different tone",
    "Shorter variant",
    "Longer variant",
  ]
  return `(${tags[index % tags.length]})`
}

function dedupePosts(ps: Post[]): Post[] {
  const seen = new Set<string>()
  const out: Post[] = []
  for (const p of ps) {
    const key = `${p.userId}|${p.platform}|${new Date(p.scheduledAt).toISOString()}|${hashContent(normalizeContent(p.content))}`
    if (!seen.has(key)) {
      seen.add(key)
      out.push(p)
    }
  }
  return out
}

function buildPromptFromTemplate(values: any): string {
  const elements = values.elements.length > 0 ? values.elements.join(", ") : "engaging content"

  return `Create a ${values.length} social media post for ${values.platform} ${values.niche ? `in the ${values.niche} niche` : ""}. The topic is ${values.topic || "general business update"}. The focus is ${values.keyPoints || "key benefits and features"}. ${values.audience ? `The target audience is ${values.audience}.` : ""} The tone should be ${values.tone}. Include ${elements} as needed. ${values.callToAction ? `Add a ${values.callToAction} call-to-action.` : ""} Use ${values.perspective} perspective. ${values.keywords ? `Include relevant hashtags related to ${values.keywords}.` : ""} Do not ask me any follow-up questions — generate the full post in one go.`
}

function buildImagePromptFromTemplate(values: any): string {
  return `Create a ${values.imageType} with ${values.imageStyle} style. Topic: ${values.topic || "business content"}. ${values.niche ? `Industry: ${values.niche}.` : ""} Professional quality, suitable for ${values.platform} social media.`
}
