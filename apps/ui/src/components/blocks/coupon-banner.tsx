import { BadgePercent, Copy, TicketPercent } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CouponBannerProps = {
  className?: string
  config: {
    enabled?: boolean
    eyebrow: string
    title: string
    summary: string
    couponCode: string
    buttonLabel: string
    buttonHref: string | null
    helperText: string
    backgroundColor: string
    borderColor: string
    eyebrowColor: string
    titleColor: string
    summaryColor: string
    codeBackgroundColor: string
    codeTextColor: string
    buttonBackgroundColor: string
    buttonTextColor: string
    accentColor: string
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

export function CouponBanner({ className, config }: CouponBannerProps) {
  const [copied, setCopied] = useState(false)
  const storefrontSurface = "#f7f3ee"

  if (
    config.enabled === false ||
    !hasContent(config.title) ||
    !hasContent(config.summary) ||
    !hasContent(config.couponCode)
  ) {
    return null
  }

  async function handleCopyCode() {
    try {
      await navigator.clipboard.writeText(config.couponCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section
      className={cn(
        "relative isolate overflow-hidden px-6 py-6 shadow-[0_32px_70px_-42px_rgba(31,24,19,0.44)] lg:px-8 lg:py-7",
        className
      )}
      style={{
        backgroundColor: config.backgroundColor,
      }}
    >
      {["top-[10%]", "top-[26%]", "top-[42%]", "top-[58%]", "top-[74%]", "top-[90%]"].map((position) => (
        <div
          key={`left-${position}`}
          className={`pointer-events-none absolute left-0 ${position} z-20 hidden size-9 -translate-x-[58%] -translate-y-1/2 rounded-full lg:block`}
          style={{ backgroundColor: storefrontSurface }}
        />
      ))}
      {["top-[10%]", "top-[26%]", "top-[42%]", "top-[58%]", "top-[74%]", "top-[90%]"].map((position) => (
        <div
          key={`right-${position}`}
          className={`pointer-events-none absolute right-0 ${position} z-20 hidden size-9 translate-x-[58%] -translate-y-1/2 rounded-full lg:block`}
          style={{ backgroundColor: storefrontSurface }}
        />
      ))}
      <div
        className="pointer-events-none absolute right-[20.5rem] top-0 z-20 hidden size-5 translate-x-1/2 -translate-y-1/2 rounded-full lg:block"
        style={{ backgroundColor: storefrontSurface }}
      />
      <div
        className="pointer-events-none absolute bottom-0 right-[20.5rem] z-20 hidden size-5 translate-x-1/2 translate-y-1/2 rounded-full lg:block"
        style={{ backgroundColor: storefrontSurface }}
      />
      <div
        className="pointer-events-none absolute inset-y-5 right-[20.5rem] hidden w-[4px] translate-x-1/2 lg:block"
        style={{
          backgroundImage: `radial-gradient(circle, ${config.borderColor} 1.8px, transparent 1.95px)`,
          backgroundPosition: "center top",
          backgroundRepeat: "repeat-y",
          backgroundSize: "4px 12px",
          opacity: 1,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-10 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-10 bottom-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
      />
      <div
        className="pointer-events-none absolute -left-10 top-10 size-40 rounded-full opacity-55 blur-3xl"
        style={{ backgroundColor: `${config.accentColor}22` }}
      />
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-36 rounded-full opacity-70 blur-2xl"
        style={{ backgroundColor: `${config.accentColor}33` }}
      />
      <div
        className="pointer-events-none absolute -bottom-14 right-14 size-40 rounded-full opacity-60 blur-3xl"
        style={{ backgroundColor: `${config.accentColor}18` }}
      />
      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1.18fr)_18rem] lg:items-center">
        <div className="space-y-4 lg:pr-8">
          <div className="flex items-center gap-3">
            <div
              className="flex size-11 items-center justify-center rounded-[1.15rem] border"
              style={{ backgroundColor: `${config.accentColor}18`, color: config.accentColor }}
            >
              <TicketPercent className="size-5" />
            </div>
            {hasContent(config.eyebrow) ? (
              <p
                className="text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: config.eyebrowColor }}
              >
                {config.eyebrow}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <h2
              className="max-w-3xl font-heading text-2xl font-semibold tracking-tight lg:text-[2.15rem] lg:leading-[1.05]"
              style={{ color: config.titleColor }}
            >
              {config.title}
            </h2>
            <p className="max-w-3xl text-sm leading-7 lg:text-[0.95rem]" style={{ color: config.summaryColor }}>
              {config.summary}
            </p>
          </div>

          {hasContent(config.helperText) ? (
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
              style={{
                color: config.summaryColor,
                borderColor: `${config.borderColor}99`,
                backgroundColor: `${config.accentColor}10`,
              }}
            >
              <BadgePercent className="size-4" style={{ color: config.accentColor }} />
              <span>{config.helperText}</span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col items-stretch gap-3 lg:items-stretch">
          <button
            type="button"
            onClick={() => void handleCopyCode()}
            className="group relative flex min-w-[14rem] items-center justify-between overflow-hidden rounded-[1.6rem] border px-4 py-4 text-left transition-transform hover:-translate-y-0.5"
            style={{
              backgroundColor: config.codeBackgroundColor,
              borderColor: `${config.codeTextColor}22`,
              color: config.codeTextColor,
            }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: config.accentColor }}
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] opacity-70">
                Coupon code
              </p>
              <p className="mt-1 text-xl font-semibold tracking-[0.24em]">
                {config.couponCode}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium opacity-80 transition-opacity group-hover:opacity-100">
              <Copy className="size-4" />
              <span>{copied ? "Copied" : "Copy"}</span>
            </div>
          </button>

          {hasContent(config.buttonLabel) && hasContent(config.buttonHref) ? (
            <Button
              asChild
              className="h-12 min-w-[12rem] rounded-full border px-6 shadow-[0_18px_34px_-20px_rgba(31,24,19,0.48)] transition-transform duration-300 hover:-translate-y-0.5"
              style={{
                backgroundColor: config.buttonBackgroundColor,
                color: config.buttonTextColor,
                borderColor: `${config.buttonTextColor}1f`,
              }}
            >
              <Link to={config.buttonHref ?? "/shop/catalog"}>{config.buttonLabel}</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  )
}
