"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Building2 } from "lucide-react"
import { createCompany, getSessionUser } from "@/lib/storage"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCompanyCreated?: (companyId: string) => void
}

export default function CreateCompanyModal({ open, onOpenChange, onCompanyCreated }: Props) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const user = getSessionUser()
    if (!user || !name.trim()) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      const company = createCompany(name.trim(), description.trim(), user.id)

      setName("")
      setDescription("")
      setLoading(false)
      onOpenChange(false)
      onCompanyCreated?.(company.id)
    }, 500)
  }

  const handleClose = () => {
    if (!loading) {
      setName("")
      setDescription("")
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Company
          </DialogTitle>
          <DialogDescription>
            Create a new company workspace to organize your social media posts and schedules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name">Company Name *</Label>
            <Input
              id="company-name"
              placeholder="Enter company name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company-description">Description (Optional)</Label>
            <Textarea
              id="company-description"
              placeholder="Brief description of the company"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? "Creating..." : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
