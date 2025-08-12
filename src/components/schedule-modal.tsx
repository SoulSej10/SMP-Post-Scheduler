"use client"
import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Checkbox } from "./ui/checkbox"
import { Badge } from "./ui/badge"
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
  const [prompt, setPrompt] = useState<string>("Announce our new feature and invite followers to try it.")
  const [imagePrompt, setImagePrompt] = useState<string>("Clean, modern product teaser in brand colors.")
  const [useAIContent, setUseAIContent] = useState<boolean>(true)
  const [useAIImage, setUseAIImage] = useState<boolean>(true)
  const [loading, setLoading] = useState<boolean>(false)
  const [resultCount, setResultCount] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

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
      const textVariants = useAIContent
        ? await generateTextVariants(prompt, baseCount)
        : Array.from({ length: baseCount }, (_, i) => `${prompt} (#${i + 1})`)

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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create AI Schedule</DialogTitle>
          <DialogDescription>
            Generate scheduled posts across selected dates and platforms. AI content generation is sourced at OpenAI platform.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start">Start date</Label>
            <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end">End date</Label>
            <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="freq">Frequency (posts per week)</Label>
            <Input
              id="freq"
              type="number"
              min={1}
              max={14}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value || 1))}
            />
          </div>
          <div className="space-y-2">
            <Label>Platforms</Label>
            <div className="flex flex-wrap gap-3">
              {ALL_PLATFORMS.map((p) => (
                <label key={p} className="flex cursor-pointer items-center gap-2 text-sm">
                  <Checkbox checked={platforms.includes(p)} onCheckedChange={() => togglePlatform(p)} />
                  <span className="capitalize">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="prompt">AI Content Prompt</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={useAIContent} onCheckedChange={(v) => setUseAIContent(Boolean(v))} /> Use AI
              </label>
            </div>
            <Textarea id="prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="imagePrompt">AI Image Prompt</Label>
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Checkbox checked={useAIImage} onCheckedChange={(v) => setUseAIImage(Boolean(v))} /> Use AI
              </label>
            </div>
            <Input id="imagePrompt" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {resultCount > 0 && (
          <p className="text-sm">
            Created <Badge>{resultCount}</Badge> posts.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || platforms.length === 0}>
            {loading ? "Creating..." : "Create"}
          </Button>
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
    return Array.from({ length: count }, (_, i) => `${prompt} (variant ${i + 1})`)
  }
  const data = (await res.json()) as { variants: string[] }
  const variants = data?.variants ?? []
  if (variants.length >= count) return variants.slice(0, count)
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
