import { BadgePercent, Copy, TicketPercent } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
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

function formatHelperText(helperText: string) {
  const normalized = helperText
    .replace(/\s+/g, " ")
    .replace(/^use\b/i, "Apply")
    .replace(/\bthis coupon code\b/i, "code")
    .replace(/\bpromo code\b/i, "code")
    .replace(/[.!,;:\s]+$/g, "")
    .trim()

  if (normalized.length <= 54) {
    return normalized
  }

  const firstClause = normalized.split(/[.,;:]/)[0]?.trim() ?? normalized
  if (firstClause.length >= 18 && firstClause.length <= 54) {
    return firstClause
  }

  return `${normalized.slice(0, 51).trimEnd()}...`
}

export function CouponBanner({ className, config }: CouponBannerProps) {
  const [copied, setCopied] = useState(false)

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
      data-technical-name="block.storefront.home.coupon-banner"
      className={cn(
        "relative isolate min-w-0 w-full max-w-full overflow-hidden px-5 py-4 shadow-[0_28px_60px_-42px_rgba(31,24,19,0.4)] sm:px-6 lg:px-7 lg:py-5",
        className
      )}
      style={{
        backgroundColor: config.backgroundColor,
      }}
    >
      <TechnicalNameBadge
        alwaysVisible
        name="block.storefront.home.coupon-banner"
        className="absolute right-3 top-3 z-30 max-w-[calc(100%-1.5rem)]"
      />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-y-5 right-[18.25rem] hidden w-px lg:block"
          style={{
            backgroundImage: `radial-gradient(circle, ${config.borderColor} 1.2px, transparent 1.35px)`,
            backgroundPosition: "center top",
            backgroundRepeat: "repeat-y",
            backgroundSize: "2px 11px",
            opacity: 0.9,
          }}
        />
        <div
          className="absolute inset-x-10 top-0 h-px opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
        />
        <div
          className="absolute inset-x-10 bottom-0 h-px opacity-60"
          style={{ background: `linear-gradient(90deg, transparent, ${config.borderColor}, transparent)` }}
        />
        <div
          className="absolute left-4 top-8 size-32 rounded-full opacity-45 blur-3xl"
          style={{ backgroundColor: `${config.accentColor}22` }}
        />
        <div
          className="absolute right-6 top-6 size-28 rounded-full opacity-55 blur-2xl"
          style={{ backgroundColor: `${config.accentColor}33` }}
        />
        <div
          className="absolute bottom-4 right-12 size-32 rounded-full opacity-45 blur-3xl"
          style={{ backgroundColor: `${config.accentColor}18` }}
        />
      </div>
      <div
        data-technical-name="block.storefront.home.coupon-banner.layout"
        className="relative grid min-w-0 max-w-full gap-4 xl:grid-cols-[minmax(0,1.15fr)_17rem] xl:items-center"
      >
        <div
          data-technical-name="block.storefront.home.coupon-banner.copy"
          className="min-w-0 space-y-3 xl:pr-6"
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex size-10 items-center justify-center rounded-[1rem] border"
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

          <div className="space-y-1.5">
            <h2
              className="max-w-3xl font-heading text-[1.7rem] font-semibold tracking-tight leading-[1.05] lg:text-[1.95rem]"
              style={{ color: config.titleColor }}
            >
              {config.title}
            </h2>
            <p className="max-w-3xl text-sm leading-6 lg:text-[0.92rem]" style={{ color: config.summaryColor }}>
              {config.summary}
            </p>
          </div>

          {hasContent(config.helperText) ? (
            <div
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.75rem] font-medium tracking-[0.08em]"
              style={{
                color: config.summaryColor,
                borderColor: `${config.borderColor}99`,
                backgroundColor: `${config.accentColor}10`,
              }}
            >
              <BadgePercent className="size-3.5" style={{ color: config.accentColor }} />
              <span>{formatHelperText(config.helperText)}</span>
            </div>
          ) : null}
        </div>

        <div
          data-technical-name="block.storefront.home.coupon-banner.actions"
          className="flex flex-col items-stretch gap-2.5 lg:items-stretch"
        >
          <button
            type="button"
            data-technical-name="block.storefront.home.coupon-banner.code"
            onClick={() => void handleCopyCode()}
            className="group relative flex w-full flex-col items-start gap-2.5 overflow-hidden rounded-[1.35rem] border px-4 py-3 text-left transition-transform hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
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
              <p className="mt-0.5 text-[1.05rem] font-semibold tracking-[0.22em]">
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
              className="h-10 w-full rounded-full border px-5 shadow-[0_16px_30px_-20px_rgba(31,24,19,0.44)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
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
