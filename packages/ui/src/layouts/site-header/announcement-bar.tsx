import { ArrowRight, Sparkles, X } from 'lucide-react'
import { useState } from 'react'
import type { SiteAnnouncementProps } from './site-header-types'

export function AnnouncementBar({
  actionLabel,
  actionUrl,
  dismissible = true,
  message,
  onDismiss,
  show = true,
}: SiteAnnouncementProps) {
  const [visible, setVisible] = useState(show)

  if (!visible) return null

  function handleDismiss() {
    setVisible(false)
    onDismiss?.()
  }

  return (
    <div
      aria-label="Announcement banner"
      className="relative flex min-h-9 w-full items-center justify-center bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground select-none"
      role="region"
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-center">
        <Sparkles className="size-3.5 shrink-0 opacity-80" />
        <span>{message}</span>

        {actionLabel && actionUrl && (
          <a
            className="inline-flex items-center gap-1 font-semibold underline underline-offset-4 hover:opacity-90"
            href={actionUrl}
          >
            {actionLabel}
            <ArrowRight className="size-3" />
          </a>
        )}
      </div>

      {dismissible && (
        <button
          aria-label="Dismiss announcement"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-foreground"
          type="button"
          onClick={handleDismiss}
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
