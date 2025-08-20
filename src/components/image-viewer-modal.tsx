"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"

type Props = {
  imageUrl: string | null
  title?: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ImageViewerModal({ imageUrl, open, onOpenChange }: Props) {
  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a")
      link.href = imageUrl
      link.download = "social-media-image.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>

          {imageUrl && (
            <>
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Full size view"
                className="w-full h-auto max-h-[85vh] object-contain"
                crossOrigin="anonymous"
              />
              <div className="absolute bottom-2 right-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                  className="bg-black/50 hover:bg-black/70 text-white"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
