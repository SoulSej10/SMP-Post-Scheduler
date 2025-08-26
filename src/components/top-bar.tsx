"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, SlidersHorizontal } from "lucide-react"
import type { Platform } from "@/lib/types"

type Props = {
  onCreate?: () => void
  platformFilter?: Platform[]
  onPlatformFilterChange?: (p: Platform[] | null) => void
  statusFilter?: ("scheduled" | "posted" | "failed")[]
  onStatusFilterChange?: (s: ("scheduled" | "posted" | "failed")[] | null) => void
}

const ALL_PLATFORMS: Platform[] = ["facebook", "instagram", "linkedin"]
const ALL_STATUS: ("scheduled" | "posted" | "failed")[] = ["scheduled", "posted", "failed"]

export default function TopBar({
  onCreate,
  platformFilter = [],
  onPlatformFilterChange,
  statusFilter = [],
  onStatusFilterChange,
}: Props) {
  const togglePlatform = (p: Platform) => {
    const next = platformFilter.includes(p) ? platformFilter.filter((x) => x !== p) : [...platformFilter, p]
    onPlatformFilterChange?.(next)
  }

  const toggleStatus = (s: "scheduled" | "posted" | "failed") => {
    const next = statusFilter.includes(s) ? statusFilter.filter((x) => x !== s) : [...statusFilter, s]
    onStatusFilterChange?.(next)
  }

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              Platforms
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ALL_PLATFORMS.map((p) => (
              <DropdownMenuItem key={p} onClick={() => togglePlatform(p)}>
                <div className="flex w-full items-center justify-between">
                  <span className="capitalize">{p}</span>
                  {platformFilter.includes(p) && <Badge variant="secondary">on</Badge>}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => onPlatformFilterChange?.([])}>Clear</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              Status
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            {ALL_STATUS.map((s) => (
              <DropdownMenuItem key={s} onClick={() => toggleStatus(s)}>
                <div className="flex w-full items-center justify-between">
                  <span className="capitalize">{s}</span>
                  {statusFilter.includes(s) && <Badge variant="secondary">on</Badge>}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem onClick={() => onStatusFilterChange?.([])}>Clear</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onCreate}>
          Create Schedule
        </Button>
      </div>
    </div>
  )
}
