import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type GiftCornerProps = {
  className?: string
  config: {
    enabled?: boolean
    eyebrow: string
    title: string
    summary: string
    buttonLabel: string
    buttonHref: string | null
    imageUrl: string
    backgroundFrom: string
    backgroundTo: string
    eyebrowColor: string
    titleColor: string
    summaryColor: string
    buttonBackgroundColor: string
    buttonIconColor: string
    imageFrameBackgroundColor: string
    imageFrameAccentColor: string
    ribbonColor: string
    ribbonDetailColor: string
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function GiftCorner({ className, config }: GiftCornerProps) {
  if (
    config.enabled === false ||
    !hasContent(config.title) ||
    !hasContent(config.summary) ||
    !hasContent(config.imageUrl)
  ) {
    return null
  }

  const hasButton = hasContent(config.buttonLabel) && hasContent(config.buttonHref)

  return (
    <section
      className={cn(
        "relative isolate min-w-0 w-full max-w-full overflow-hidden rounded-[2rem] px-6 py-6 shadow-[0_32px_80px_-48px_rgba(34,20,14,0.65)] lg:px-8 lg:py-7",
        className
      )}
      style={{
        backgroundImage: `linear-gradient(120deg, ${config.backgroundFrom} 0%, ${config.backgroundTo} 100%)`,
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute left-6 top-1/2 size-32 -translate-y-1/2 rounded-full blur-3xl"
          style={{ backgroundColor: `${config.imageFrameAccentColor}44` }}
        />
        <div
          className="absolute right-6 top-6 size-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${config.imageFrameAccentColor}55` }}
        />
        <div
          className="absolute bottom-0 left-1/2 h-px w-40 -translate-x-1/2"
          style={{
            backgroundImage: `linear-gradient(90deg, transparent, ${config.imageFrameAccentColor}, transparent)`,
          }}
        />
      </div>

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-center">
        <div className="space-y-4 lg:max-w-2xl">
          {hasContent(config.eyebrow) ? (
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: config.eyebrowColor }}
            >
              {config.eyebrow}
            </p>
          ) : null}

          <div className="space-y-3">
            <h2
              className="max-w-2xl font-heading text-2xl font-semibold tracking-tight lg:text-[2.15rem] lg:leading-[1.04]"
              style={{ color: config.titleColor }}
            >
              {config.title}
            </h2>
            <p
              className="max-w-2xl text-sm leading-7 lg:text-[0.95rem]"
              style={{ color: config.summaryColor }}
            >
              {config.summary}
            </p>
          </div>

          {hasButton ? (
            <Link
              to={config.buttonHref ?? "/shop/catalog"}
              className="group inline-flex items-center gap-3"
            >
              <span className="text-sm font-medium text-white/90">{config.buttonLabel}</span>
              <span
                className="flex size-11 items-center justify-center rounded-full shadow-[0_16px_28px_-18px_rgba(17,10,7,0.72)] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                style={{ backgroundColor: config.buttonBackgroundColor, color: config.buttonIconColor }}
              >
                <ArrowUpRight className="size-4" />
              </span>
            </Link>
          ) : null}
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[18rem] lg:max-w-[19rem]">
            <div
              className="relative h-[15rem] overflow-hidden lg:h-[18.5rem]"
            >
              <img
                src={config.imageUrl}
                alt={config.title}
                className="h-full w-full object-cover"
                loading="lazy"
                decoding="async"
                sizes="(min-width: 1024px) 304px, 80vw"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
