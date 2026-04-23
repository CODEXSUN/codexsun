import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"

import { hasContent } from "./storefront-home-content"

export function StorefrontHomeSectionHeader({
  eyebrow,
  title,
  summary,
  ctaLabel,
  ctaHref,
  technicalName,
  compact = false,
}: {
  eyebrow: string | null | undefined
  title: string | null | undefined
  summary: string | null | undefined
  ctaLabel?: string | null
  ctaHref?: string | null
  technicalName: string
  compact?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-start gap-4 lg:gap-5 ${compact ? "lg:flex-col" : "md:flex-row md:items-end md:justify-between"}`}
      data-technical-name={technicalName}
    >
      <div className="max-w-3xl">
        {hasContent(eyebrow) ? (
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        {hasContent(title) ? (
          <h2 className="mt-2 font-heading text-[1.85rem] font-semibold tracking-tight sm:text-[2rem] lg:text-3xl">{title}</h2>
        ) : null}
        {hasContent(summary) ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground lg:leading-7">{summary}</p>
        ) : null}
      </div>
      {hasContent(ctaLabel) && ctaHref ? (
        <Button asChild variant="outline" className="w-full rounded-full md:w-auto">
          <Link to={ctaHref} className="gap-2">
            {ctaLabel}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
