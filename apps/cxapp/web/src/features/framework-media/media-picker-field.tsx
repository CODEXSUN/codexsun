import { useState } from "react"
import { ImagePlusIcon, Trash2Icon } from "lucide-react"
import type { ReactNode } from "react"

import type { MediaStorageScope, MediaSummary } from "../../../../../framework/shared/media"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { FrameworkMediaBrowser } from "./media-browser"

export function FrameworkMediaPickerField({
  allowedScopes = ["public"],
  clearLabel = "Clear",
  footer,
  orderLabel,
  orderValue,
  onOrderChange,
  previewAlt,
  value,
  onChange,
}: {
  allowedScopes?: MediaStorageScope[]
  clearLabel?: string
  footer?: ReactNode
  orderLabel?: string
  orderValue?: number | string
  onOrderChange?: (value: string) => void
  previewAlt: string
  value: string
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  function handleSelect(asset: MediaSummary) {
    onChange(asset.fileUrl)
    setOpen(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="overflow-hidden rounded-[0.95rem] border border-border/70 bg-background/70">
        <div className="aspect-square bg-muted/60">
          {value.trim().length > 0 ? (
            <img src={value} alt={previewAlt} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              No image selected
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-2">
          <p className="truncate text-xs text-muted-foreground">
            {value.trim().length > 0 ? value : "Choose a media asset to attach here."}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setOpen(true)}
            >
              <ImagePlusIcon className="size-4" />
              Media
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onChange("")}
              disabled={value.trim().length === 0}
            >
              <Trash2Icon className="size-4" />
              {clearLabel}
            </Button>
          </div>
          {typeof orderValue !== "undefined" && onOrderChange ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-2">
              <Label className="text-xs">{orderLabel ?? "Order"}</Label>
              <Input
                type="number"
                className="h-8.5"
                value={orderValue}
                onChange={(event) => onOrderChange(event.target.value)}
              />
            </div>
          ) : null}
          {footer ? <div>{footer}</div> : null}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[min(96vw,78rem)] max-w-[78rem]">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
            <DialogDescription>
              Upload a new image or reuse an existing framework media asset.
            </DialogDescription>
          </DialogHeader>
          <FrameworkMediaBrowser
            compact
            allowedScopes={allowedScopes}
            onSelect={handleSelect}
            selectedUrl={value || null}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
