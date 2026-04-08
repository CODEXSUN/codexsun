import { AlertTriangle } from "lucide-react"

import type {
  StorefrontBrandShowcase,
  StorefrontCampaignSection,
  StorefrontCouponBanner,
  StorefrontGiftCorner,
  StorefrontHomeSlider,
  StorefrontSettings,
  StorefrontTrendingSection,
} from "@ecommerce/shared"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export type StorefrontDesignerValidationIssue = {
  field: string
  message: string
}

function isValidLink(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return false
  }

  return /^(\/|https?:\/\/|mailto:|tel:|#)/i.test(trimmed)
}

function validateRequiredText(
  issues: StorefrontDesignerValidationIssue[],
  field: string,
  value: string | null | undefined,
  label: string
) {
  if (!value?.trim()) {
    issues.push({
      field,
      message: `${label} is required.`,
    })
  }
}

function validateOptionalLink(
  issues: StorefrontDesignerValidationIssue[],
  field: string,
  value: string | null | undefined,
  label: string
) {
  if (!value) {
    return
  }

  if (!isValidLink(value)) {
    issues.push({
      field,
      message: `${label} must be a relative path, anchor, or valid http/mailto/tel link.`,
    })
  }
}

function validateRequiredLink(
  issues: StorefrontDesignerValidationIssue[],
  field: string,
  value: string | null | undefined,
  label: string
) {
  if (!value?.trim()) {
    issues.push({
      field,
      message: `${label} is required.`,
    })
    return
  }

  validateOptionalLink(issues, field, value, label)
}

function validateRequiredMedia(
  issues: StorefrontDesignerValidationIssue[],
  field: string,
  value: string,
  label: string
) {
  if (!value.trim()) {
    issues.push({
      field,
      message: `${label} is required.`,
    })
  }
}

function validateSectionCtaPair(
  issues: StorefrontDesignerValidationIssue[],
  fieldPrefix: string,
  labelValue: string | null,
  hrefValue: string | null,
  labelName: string
) {
  const hasLabel = Boolean(labelValue?.trim())
  const hasHref = Boolean(hrefValue?.trim())

  if (hasLabel !== hasHref) {
    issues.push({
      field: fieldPrefix,
      message: `${labelName} needs both a label and a link.`,
    })
  }

  if (hasHref) {
    validateOptionalLink(issues, `${fieldPrefix}.href`, hrefValue, `${labelName} link`)
  }
}

export function validateCouponBannerDesigner(
  value: StorefrontCouponBanner
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  validateRequiredText(issues, "eyebrow", value.eyebrow, "Eyebrow")
  validateRequiredText(issues, "couponCode", value.couponCode, "Coupon code")
  validateRequiredText(issues, "title", value.title, "Title")
  validateRequiredText(issues, "summary", value.summary, "Summary")
  validateRequiredText(issues, "helperText", value.helperText, "Helper text")
  validateRequiredText(issues, "buttonLabel", value.buttonLabel, "Button label")
  validateOptionalLink(issues, "buttonHref", value.buttonHref, "Button link")

  return issues
}

export function validateGiftCornerDesigner(
  value: StorefrontGiftCorner
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  validateRequiredText(issues, "eyebrow", value.eyebrow, "Eyebrow")
  validateRequiredText(issues, "title", value.title, "Title")
  validateRequiredText(issues, "summary", value.summary, "Summary")
  validateRequiredText(issues, "buttonLabel", value.buttonLabel, "Button label")
  validateRequiredMedia(issues, "imageUrl", value.imageUrl, "Gift image")
  validateOptionalLink(issues, "buttonHref", value.buttonHref, "Button link")

  return issues
}

export function validateBrandShowcaseDesigner(
  value: StorefrontBrandShowcase
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  validateRequiredText(issues, "title", value.title, "Section title")
  validateRequiredText(issues, "description", value.description, "Section description")

  value.cards.forEach((card, index) => {
    const prefix = `cards.${index}`
    const label = `Brand card ${index + 1}`
    validateRequiredText(issues, `${prefix}.brandName`, card.brandName, `${label} chip`)
    validateRequiredText(issues, `${prefix}.title`, card.title, `${label} title`)
    validateRequiredText(issues, `${prefix}.summary`, card.summary, `${label} summary`)
    validateRequiredMedia(issues, `${prefix}.imageUrl`, card.imageUrl, `${label} image`)
    validateRequiredLink(issues, `${prefix}.href`, card.href, `${label} link`)
  })

  return issues
}

export function validateTrendingDesigner(
  value: StorefrontTrendingSection
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  validateRequiredText(issues, "title", value.title, "Section title")
  validateRequiredText(issues, "description", value.description, "Section description")
  validateRequiredText(issues, "featureTitle", value.featureTitle, "Lead title")
  validateRequiredText(issues, "featureSummary", value.featureSummary, "Lead summary")
  validateRequiredMedia(issues, "featureImageUrl", value.featureImageUrl, "Lead image")
  validateOptionalLink(issues, "featureHref", value.featureHref, "Lead link")

  value.cards.forEach((card, index) => {
    const prefix = `cards.${index}`
    const label = `Trend card ${index + 1}`
    validateRequiredText(issues, `${prefix}.title`, card.title, `${label} title`)
    validateRequiredText(issues, `${prefix}.caption`, card.caption, `${label} caption`)
    validateRequiredMedia(issues, `${prefix}.imageUrl`, card.imageUrl, `${label} image`)
    validateOptionalLink(issues, `${prefix}.href`, card.href, `${label} link`)
  })

  return issues
}

export function validateCampaignDesigner(
  value: StorefrontCampaignSection
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  validateRequiredText(issues, "campaign.eyebrow", value.campaign.eyebrow, "Campaign eyebrow")
  validateRequiredText(issues, "campaign.title", value.campaign.title, "Campaign title")
  validateRequiredText(issues, "campaign.summary", value.campaign.summary, "Campaign summary")
  validateRequiredText(
    issues,
    "campaign.primaryCtaLabel",
    value.campaign.primaryCtaLabel,
    "Primary button label"
  )
  validateRequiredText(
    issues,
    "campaign.secondaryCtaLabel",
    value.campaign.secondaryCtaLabel,
    "Secondary button label"
  )
  validateRequiredLink(
    issues,
    "campaign.primaryCtaHref",
    value.campaign.primaryCtaHref,
    "Primary button link"
  )
  validateRequiredLink(
    issues,
    "campaign.secondaryCtaHref",
    value.campaign.secondaryCtaHref,
    "Secondary button link"
  )

  value.trustNotes.forEach((note, index) => {
    const prefix = `trustNotes.${index}`
    const label = `Trust card ${index + 1}`
    validateRequiredText(issues, `${prefix}.title`, note.title, `${label} title`)
    validateRequiredText(issues, `${prefix}.summary`, note.summary, `${label} summary`)
  })

  return issues
}

export function validateHomeSliderDesigner(
  value: StorefrontHomeSlider
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  if (value.slides.length === 0) {
    issues.push({
      field: "slides",
      message: "At least one slider is required.",
    })
    return issues
  }

  value.slides.forEach((slide, index) => {
    const prefix = `slides.${index}`
    const label = `Slider ${index + 1}`
    validateRequiredText(issues, `${prefix}.label`, slide.label, `${label} admin label`)
    validateRequiredText(
      issues,
      `${prefix}.theme.primaryButtonLabel`,
      slide.theme.primaryButtonLabel,
      `${label} primary button label`
    )
    validateRequiredText(
      issues,
      `${prefix}.theme.secondaryButtonLabel`,
      slide.theme.secondaryButtonLabel,
      `${label} secondary button label`
    )
  })

  return issues
}

export function validateStorefrontSettingsDesigner(
  value: StorefrontSettings
): StorefrontDesignerValidationIssue[] {
  const issues: StorefrontDesignerValidationIssue[] = []

  value.announcementItems.forEach((item, index) => {
    validateRequiredText(
      issues,
      `announcementItems.${index}.text`,
      item.text,
      `Announcement ${index + 1} text`
    )
    validateOptionalLink(
      issues,
      `announcementItems.${index}.href`,
      item.href,
      `Announcement ${index + 1} link`
    )
  })

  validateSectionCtaPair(
    issues,
    "sections.featured",
    value.sections.featured.ctaLabel,
    value.sections.featured.ctaHref,
    "Featured section CTA"
  )
  validateSectionCtaPair(
    issues,
    "sections.categories",
    value.sections.categories.ctaLabel,
    value.sections.categories.ctaHref,
    "Categories section CTA"
  )
  validateSectionCtaPair(
    issues,
    "sections.newArrivals",
    value.sections.newArrivals.ctaLabel,
    value.sections.newArrivals.ctaHref,
    "New arrivals CTA"
  )
  validateSectionCtaPair(
    issues,
    "sections.bestSellers",
    value.sections.bestSellers.ctaLabel,
    value.sections.bestSellers.ctaHref,
    "Best sellers CTA"
  )

  validateRequiredText(issues, "sections.cta.eyebrow", value.sections.cta.eyebrow, "Campaign eyebrow")
  validateRequiredText(issues, "sections.cta.title", value.sections.cta.title, "Campaign title")
  validateRequiredText(issues, "sections.cta.summary", value.sections.cta.summary, "Campaign summary")
  validateRequiredLink(
    issues,
    "sections.cta.primaryCtaHref",
    value.sections.cta.primaryCtaHref,
    "Primary campaign link"
  )
  validateRequiredLink(
    issues,
    "sections.cta.secondaryCtaHref",
    value.sections.cta.secondaryCtaHref,
    "Secondary campaign link"
  )

  return issues
}

export function StorefrontDesignerValidationCard({
  issues,
  title = "Validation",
}: {
  issues: StorefrontDesignerValidationIssue[]
  title?: string
}) {
  if (issues.length === 0) {
    return null
  }

  return (
    <Card className="border-amber-300/70 bg-amber-50/70 py-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-amber-950">
          <AlertTriangle className="size-4" />
          {title}
          <Badge variant="outline" className="border-amber-300 bg-amber-100 text-amber-900">
            {issues.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pb-5 text-sm text-amber-950">
        {issues.map((issue, index) => (
          <div key={`${issue.field}-${index}`} className="rounded-xl border border-amber-200/80 bg-white/75 px-3 py-2">
            <p className="font-medium">{issue.message}</p>
            <p className="text-xs text-amber-800/80">{issue.field}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
