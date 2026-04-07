import { ArrowRight, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type CampaignTrustSectionProps = {
  className?: string
  visibility?: {
    cta?: boolean
    trust?: boolean
  }
  campaign: {
    eyebrow: string
    title: string
    summary: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
  }
  trustNotes: Array<{
    id: string
    title: string
    summary: string
    iconKey: "sparkles" | "truck" | "shield"
  }>
  design?: {
    campaignBackgroundFrom: string
    campaignBackgroundTo: string
    campaignBorderColor: string
    campaignEyebrowColor: string
    campaignTitleColor: string
    campaignSummaryColor: string
    primaryButtonBackgroundColor: string
    primaryButtonTextColor: string
    primaryButtonBorderColor: string
    secondaryButtonBackgroundColor: string
    secondaryButtonTextColor: string
    secondaryButtonBorderColor: string
    trustCardBackgroundColor: string
    trustCardBorderColor: string
    trustCardHoverBorderColor: string
    trustIconBackgroundColor: string
    trustIconColor: string
    trustIconHoverBackgroundColor: string
    trustIconHoverColor: string
    trustTitleColor: string
    trustTitleHoverColor: string
    trustSummaryColor: string
    trustSummaryHoverColor: string
  }
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function resolveTrustIcon(iconKey: "sparkles" | "truck" | "shield") {
  return iconKey === "truck"
    ? Truck
    : iconKey === "shield"
      ? ShieldCheck
      : Sparkles
}

export function CampaignTrustSection({
  className,
  visibility,
  campaign,
  trustNotes,
  design,
}: CampaignTrustSectionProps) {
  const hasCampaign =
    visibility?.cta !== false &&
    (hasContent(campaign.eyebrow) ||
      hasContent(campaign.title) ||
      hasContent(campaign.summary) ||
      hasContent(campaign.primaryCtaLabel) ||
      hasContent(campaign.secondaryCtaLabel))
  const hasTrust = visibility?.trust !== false && trustNotes.length > 0

  if (!hasCampaign && !hasTrust) {
    return null
  }

  return (
    <section className={cn("grid gap-6 lg:grid-cols-[1.15fr_0.85fr]", className)}>
      {hasCampaign ? (
        <Card
          className="h-full rounded-[2rem] py-0 text-stone-100 shadow-[0_30px_80px_-52px_rgba(28,15,8,0.75)]"
          style={{
            borderColor: design?.campaignBorderColor ?? "#decfbd",
            backgroundImage: `linear-gradient(135deg, ${design?.campaignBackgroundFrom ?? "#221812"} 0%, ${design?.campaignBackgroundTo ?? "#3b2a20"} 100%)`,
          }}
        >
          <CardContent className="flex h-full flex-col items-center justify-center gap-5 p-7 text-center">
            {hasContent(campaign.eyebrow) ? (
              <p
                className="w-full text-left text-xs font-semibold uppercase tracking-[0.22em]"
                style={{ color: design?.campaignEyebrowColor ?? "#f2c48a" }}
              >
                {campaign.eyebrow}
              </p>
            ) : null}
            <div className="space-y-3">
              {hasContent(campaign.title) ? (
                <h2
                  className="max-w-3xl font-heading text-3xl font-semibold tracking-tight"
                  style={{ color: design?.campaignTitleColor ?? "#f5f5f4" }}
                >
                  {campaign.title}
                </h2>
              ) : null}
              {hasContent(campaign.summary) ? (
                <p
                  className="mx-auto max-w-2xl text-sm leading-7"
                  style={{ color: design?.campaignSummaryColor ?? "#d6d3d1" }}
                >
                  {campaign.summary}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {hasContent(campaign.primaryCtaLabel) ? (
                <Button
                  asChild
                  className="h-11 min-w-[10.75rem] rounded-full border px-5 shadow-[0_16px_34px_-20px_rgba(10,6,3,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-22px_rgba(10,6,3,0.62)]"
                  style={{
                    backgroundColor: design?.primaryButtonBackgroundColor ?? "#fffaf5",
                    color: design?.primaryButtonTextColor ?? "#241913",
                    borderColor: design?.primaryButtonBorderColor ?? "#ffffff",
                  }}
                >
                  <Link
                    to={campaign.primaryCtaHref || "/shop/catalog"}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {campaign.primaryCtaLabel}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/button:translate-x-0.5" />
                  </Link>
                </Button>
              ) : null}
              {hasContent(campaign.secondaryCtaLabel) ? (
                <Button
                  asChild
                  variant="outline"
                  className="h-11 min-w-[10.75rem] rounded-full border px-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_34px_-22px_rgba(0,0,0,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_22px_40px_-24px_rgba(0,0,0,0.62)]"
                  style={{
                    backgroundColor: design?.secondaryButtonBackgroundColor ?? "#543724",
                    color: design?.secondaryButtonTextColor ?? "#fff4e8",
                    borderColor: design?.secondaryButtonBorderColor ?? "#b89473",
                  }}
                >
                  <Link
                    to={campaign.secondaryCtaHref || "/shop/cart"}
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {campaign.secondaryCtaLabel}
                    <ArrowRight className="size-4 opacity-80 transition-transform duration-300 group-hover/button:translate-x-0.5" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {hasTrust ? (
        <div className="grid gap-4">
          {trustNotes.map((note) => {
            const Icon = resolveTrustIcon(note.iconKey)

            return (
              <Card
                key={note.id}
                className="group rounded-[1.6rem] py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_-24px_rgba(53,33,20,0.22)] group-hover:[border-color:var(--trust-card-hover-border)]"
                style={{
                  backgroundColor: design?.trustCardBackgroundColor ?? "#ffffff",
                  borderColor: design?.trustCardBorderColor ?? "#e4d6c7",
                  ["--trust-card-hover-border" as string]:
                    design?.trustCardHoverBorderColor ?? "#d6c1ab",
                  ["--trust-icon-hover-bg" as string]:
                    design?.trustIconHoverBackgroundColor ?? "#efe0cf",
                  ["--trust-icon-hover-color" as string]:
                    design?.trustIconHoverColor ?? "#4b3527",
                  ["--trust-title-hover-color" as string]:
                    design?.trustTitleHoverColor ?? "#2f2119",
                  ["--trust-summary-hover-color" as string]:
                    design?.trustSummaryHoverColor ?? "#6b5a4c",
                }}
              >
                <CardContent className="space-y-3 p-5">
                  <div
                    className="flex size-11 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-[1.06] group-hover:[background-color:var(--trust-icon-hover-bg)] group-hover:[color:var(--trust-icon-hover-color)]"
                    style={{
                      backgroundColor: design?.trustIconBackgroundColor ?? "#f4e8da",
                      color: design?.trustIconColor ?? "#6d5140",
                    }}
                  >
                    <Icon className="size-5" />
                  </div>
                  <p
                    className="font-medium transition-colors duration-300 group-hover:[color:var(--trust-title-hover-color)]"
                    style={{ color: design?.trustTitleColor ?? "#2f2119" }}
                  >
                    {note.title}
                  </p>
                  <p
                    className="text-sm leading-6 transition-colors duration-300 group-hover:[color:var(--trust-summary-hover-color)]"
                    style={{ color: design?.trustSummaryColor ?? "#6b5a4c" }}
                  >
                    {note.summary}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}
