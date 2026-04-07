import { useState } from "react"
import { ImagePlusIcon, Trash2Icon } from "lucide-react"
import type { ReactNode } from "react"

import type { MediaStorageScope, MediaSummary } from "../../../../../framework/shared/media"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { FrameworkMediaBrowser } from "./media-browser"
import { handleMediaPreviewError, resolveMediaPreviewUrl } from "./media-url"

export function FrameworkMediaPickerField({
  allowedScopes = ["public"],
  clearLabel = "Clear",
  footer,
  helperText,
  orderLabel,
  orderValue,
  onOrderChange,
  previewAlt,
  showPreview = true,
  size = "default",
  value,
  onChange,
}: {
  allowedScopes?: MediaStorageScope[]
  clearLabel?: string
  footer?: ReactNode
  helperText?: ReactNode
  orderLabel?: string
  orderValue?: number | string
  onOrderChange?: (value: string) => void
  previewAlt: string
  showPreview?: boolean
  size?: "default" | "compact"
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
      <div
        className={cn(
          "overflow-hidden rounded-[0.95rem] border border-border/70 bg-background/70",
          size === "compact" ? "max-w-[13rem]" : ""
        )}
      >
        {showPreview ? (
          <div className={cn("aspect-square bg-muted/60", size === "compact" ? "max-h-[13rem]" : "")}>
            {value.trim().length > 0 ? (
              <img
                src={resolveMediaPreviewUrl(value, previewAlt)}
                alt={previewAlt}
                className="h-full w-full object-cover"
                onError={(event) => handleMediaPreviewError(event, previewAlt)}
              />
            ) : (
              <div
                className={cn(
                  "flex h-full items-center justify-center text-muted-foreground",
                  size === "compact" ? "text-xs" : "text-sm"
                )}
              >
                No image selected
              </div>
            )}
          </div>
        ) : null}
        <div className={cn("space-y-1.5", size === "compact" ? "p-1.5" : "p-2")}>
          <Input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste image URL or choose from media"
            className="h-9"
          />
          {helperText ? (
            <div className="text-xs leading-5 text-muted-foreground">{helperText}</div>
          ) : null}
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
        <DialogContent className="w-[min(96vw,78rem)] max-w-[78rem] max-h-[90vh] overflow-y-auto p-0">
          <div className="space-y-4 p-6">
          <DialogHeader>
            <DialogTitle>Select Media</DialogTitle>
          </DialogHeader>
          <FrameworkMediaBrowser
            compact
            allowedScopes={allowedScopes}
            onSelect={handleSelect}
            selectedUrl={value || null}
          />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
