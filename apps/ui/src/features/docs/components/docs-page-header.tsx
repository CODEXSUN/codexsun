import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type DocsPageHeaderProps = {
  eyebrow?: string
  title: string
  description: string
  aside?: ReactNode
  className?: string
}

export function DocsPageHeader({
  aside,
  className,
  description,
  eyebrow,
  title,
}: DocsPageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
    >
      <div className={cn("min-w-0", eyebrow ? "space-y-1.5" : "space-y-1")}>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  )
}
