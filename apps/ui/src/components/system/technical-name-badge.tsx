import { Badge } from "@/components/ui/badge"
import { showAppToast } from "@/components/ui/app-toast"
import { useTechnicalNameOverlay } from "@/components/system/technical-name-overlay-provider"
import { cn } from "@/lib/utils"

export function TechnicalNameBadge({
  className,
  name,
}: {
  className?: string
  name: string
}) {
  const { enabled } = useTechnicalNameOverlay()

  if (!enabled) {
    return null
  }

  async function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      showAppToast({
        variant: "warning",
        title: "Copy unavailable",
        description: "Clipboard access is not available in this browser context.",
      })
      return
    }

    await navigator.clipboard.writeText(name)
    showAppToast({
      variant: "success",
      title: "Technical name copied",
      description: name,
    })
  }

  return (
    <Badge
      variant="outline"
      role="button"
      tabIndex={0}
      className={cn(
        "cursor-copy rounded-full border border-violet-300/80 bg-violet-600/95 font-mono text-[10px] tracking-normal text-violet-50 shadow-sm shadow-violet-950/20 transition hover:bg-violet-500/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80",
        className
      )}
      onClick={() => void handleCopy()}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          void handleCopy()
        }
      }}
      title={`Copy technical name: ${name}`}
    >
      {name}
    </Badge>
  )
}
