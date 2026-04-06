import { ArrowRight, ChevronDown, ShieldCheck, Sparkles, Truck } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  storefrontSettingsSchema,
  type StorefrontProductCard,
  type StorefrontSettings,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import {
  FeaturedCardRowSurface,
  type FeaturedCardRowVariant,
} from "@/components/ux/featured-card-row-surface"
import { CategoryCardSurface } from "@/components/ux/category-card-surface"
import { CategoryCardGridSurface } from "@/components/ux/category-card-grid-surface"
import { CommerceProductCard } from "@/components/ux/commerce-product-card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { cn } from "@/lib/utils"
import {
  AnimatedTabs,
  type AnimatedContentTab,
} from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontSearchBar } from "../../components/storefront-search-bar"
import {
  StorefrontProductCardGrid,
  type StorefrontProductLaneCardsPerRow,
  type StorefrontProductLaneRowsToShow,
} from "../../components/storefront-product-card-grid"
import {
  invalidateStorefrontShellData,
  useStorefrontShellData,
} from "../../hooks/use-storefront-shell-data"
import { storefrontPaths } from "../../lib/storefront-routes"

function parsePipeList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDepartmentLines(settings: StorefrontSettings) {
  return settings.search.departments
    .map((item) => `${item.value}|${item.label}`)
    .join("\n")
}

function parseDepartmentLines(value: string) {
  return parsePipeList(value).map((item, index) => {
    const [rawValue, rawLabel] = item.split("|")
    const safeValue = rawValue?.trim() || `department-${index + 1}`
    return { value: safeValue, label: rawLabel?.trim() || safeValue }
  })
}

function Row({
  label,
  description,
  field,
}: {
  label: string
  description: string
  field: React.ReactNode
}) {
  return (
    <div className="grid gap-2 border-b border-border/60 px-4 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      </div>
      <div>{field}</div>
    </div>
  )
}

function TableCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn("overflow-hidden rounded-[1.5rem] border-border/70 py-0 shadow-sm", className)}>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function VisibilityRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <TableCard>
      <Row
      label={label}
      description={description}
      field={
          <div
            className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 transition-colors ${
              checked
                ? "border-emerald-200/80 bg-emerald-50/85 text-emerald-950"
                : "border-border/70 bg-card/60"
            }`}
          >
            <div className="space-y-1">
              <p className={`text-sm font-medium ${checked ? "text-emerald-950" : "text-foreground"}`}>
                Show this section on storefront
              </p>
              <p className={`text-xs ${checked ? "text-emerald-800/80" : "text-muted-foreground"}`}>
                Matches the active-style visibility switch used in master sections.
              </p>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={onCheckedChange}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        }
      />
    </TableCard>
  )
}

function PreviewCard({
  eyebrow,
  title,
  summary,
  children,
  className,
  showHeader = true,
}: {
  eyebrow: string
  title: string
  summary: string
  children: React.ReactNode
  className?: string
  showHeader?: boolean
}) {
  return (
    <Card className={cn("overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm", className)}>
      <CardContent className="space-y-5 p-5">
        {showHeader ? (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {eyebrow}
            </p>
            <h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  )
}

function AnnouncementPreview({
  announcement,
  design,
}: {
  announcement: string
  design: StorefrontSettings["announcementDesign"]
}) {
  const Icon =
    design.iconKey === "truck"
      ? Truck
      : design.iconKey === "shield"
        ? ShieldCheck
        : Sparkles

  const roundedClass =
    design.cornerStyle === "rounded"
      ? "rounded-[1.4rem]"
      : design.cornerStyle === "soft"
        ? "rounded-[1rem]"
        : "rounded-full"

  return (
    <div className="rounded-[1.45rem] border border-[#eadfce] bg-[#f8f2eb] p-4">
      <div
        className={`${roundedClass} px-5 py-4 text-sm shadow-[0_20px_40px_-28px_rgba(34,24,18,0.7)]`}
        style={{
          backgroundColor: design.backgroundColor,
          color: design.textColor,
        }}
      >
        <div className="flex items-center gap-3">
          <Icon className="size-4 shrink-0" style={{ color: design.iconColor }} />
          <span>{announcement}</span>
        </div>
      </div>
    </div>
  )
}

type BaseSectionCopyFields = Pick<
  StorefrontSettings["sections"]["featured"],
  "eyebrow" | "title" | "summary" | "ctaLabel" | "ctaHref"
>

function SectionCopyFields<TSection extends BaseSectionCopyFields>({
  section,
  onChange,
  description,
}: {
  section: TSection
  onChange: (next: TSection) => void
  description: string
}) {
  return (
    <Row
      label="Copy"
      description={description}
      field={
        <div className="grid gap-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={section.eyebrow}
              onChange={(event) =>
                onChange({ ...section, eyebrow: event.target.value })
              }
            />
            <Input
              value={section.title}
              onChange={(event) => onChange({ ...section, title: event.target.value })}
            />
          </div>
          <Textarea
            value={section.summary}
            onChange={(event) => onChange({ ...section, summary: event.target.value })}
            rows={3}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              value={section.ctaLabel ?? ""}
              onChange={(event) =>
                onChange({ ...section, ctaLabel: event.target.value || null })
              }
            />
            <Input
              value={section.ctaHref ?? ""}
              onChange={(event) =>
                onChange({ ...section, ctaHref: event.target.value || null })
              }
            />
          </div>
        </div>
      }
    />
  )
}

function ColorField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-14 cursor-pointer rounded-xl border border-border/70 bg-transparent p-1"
      />
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  )
}

function LabeledField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function CardDesignToggleGrid({
  design,
  onChange,
}: {
  design: StorefrontSettings["sections"]["featured"]["cardDesign"]
  onChange: (next: StorefrontSettings["sections"]["featured"]["cardDesign"]) => void
}) {
  const items = [
    {
      key: "showPrimaryBadge",
      label: "Left badge",
      description: "Show the left merchandising badge.",
    },
    {
      key: "showSecondaryBadge",
      label: "Right badge",
      description: "Show the right-side promo badge.",
    },
    {
      key: "showBrandMeta",
      label: "Brand",
      description: "Show the brand label in meta.",
    },
    {
      key: "showCategoryMeta",
      label: "Category",
      description: "Show the category label in meta.",
    },
    {
      key: "showStockMeta",
      label: "Stock",
      description: "Show stock status in meta.",
    },
    {
      key: "showDescription",
      label: "Description",
      description: "Show the short description text.",
    },
    {
      key: "showCompareAtPrice",
      label: "Compare price",
      description: "Show the struck-through compare price.",
    },
    {
      key: "showPrimaryAction",
      label: "Primary button",
      description: "Show the main action button.",
    },
    {
      key: "showSecondaryActions",
      label: "Add to cart",
      description: "Show the add-to-cart button.",
    },
  ] as const

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const checked = design[item.key]

        return (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 transition-colors ${
              checked
                ? "border-emerald-200/80 bg-emerald-50/85"
                : "border-border/70 bg-card/60"
            }`}
          >
            <div className="space-y-1">
              <p
                className={`text-sm font-medium ${
                  checked ? "text-emerald-950" : "text-foreground"
                }`}
              >
                {item.label}
              </p>
              <p
                className={`text-xs ${
                  checked ? "text-emerald-800/80" : "text-muted-foreground"
                }`}
              >
                {item.description}
              </p>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={(value) =>
                onChange({
                  ...design,
                  [item.key]: value,
                })
              }
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        )
      })}
    </div>
  )
}

function CategoryCardDesignToggleGrid({
  design,
  onChange,
}: {
  design: StorefrontSettings["sections"]["categories"]["cardDesign"]
  onChange: (next: StorefrontSettings["sections"]["categories"]["cardDesign"]) => void
}) {
  const items = [
    {
      key: "showProductCount",
      label: "Product count",
      description: "Show the category count line.",
    },
    {
      key: "showDescription",
      label: "Description",
      description: "Show the category summary text.",
    },
    {
      key: "showAction",
      label: "Action button",
      description: "Show the explore action button.",
    },
  ] as const

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const checked = design[item.key]

        return (
          <div
            key={item.key}
            className={`flex items-center justify-between rounded-[1rem] border px-4 py-3 transition-colors ${
              checked
                ? "border-emerald-200/80 bg-emerald-50/85"
                : "border-border/70 bg-card/60"
            }`}
          >
            <div className="space-y-1">
              <p className={`text-sm font-medium ${checked ? "text-emerald-950" : "text-foreground"}`}>
                {item.label}
              </p>
              <p className={`text-xs ${checked ? "text-emerald-800/80" : "text-muted-foreground"}`}>
                {item.description}
              </p>
            </div>
            <Switch
              checked={checked}
              onCheckedChange={(value) => onChange({ ...design, [item.key]: value })}
              className="data-[state=checked]:bg-emerald-600"
            />
          </div>
        )
      })}
    </div>
  )
}

function hasContent(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value)
}

function resolveTrustIcon(iconKey: "sparkles" | "truck" | "shield") {
  return iconKey === "truck"
    ? Truck
    : iconKey === "shield"
      ? ShieldCheck
      : Sparkles
}

function SectionPreviewShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fcf8f3_0%,#f7efe6_100%)] p-5 shadow-[0_28px_56px_-42px_rgba(48,31,19,0.26)]">
      {children}
    </div>
  )
}

function EmptyPreviewState({ message }: { message: string }) {
  return (
    <div className="rounded-[1.4rem] border border-dashed border-[#dccfbe] bg-white/60 px-5 py-8 text-sm text-[#7d6858]">
      {message}
    </div>
  )
}

function ProductLanePreview({
  section,
  items,
  cardsPerRow = 3,
  rowsToShow = 1,
  cardDesign,
}: {
  section: BaseSectionCopyFields
  items: StorefrontProductCard[]
  cardsPerRow?: FeaturedCardRowVariant
  rowsToShow?: 1 | 2 | 3
  cardDesign?: StorefrontSettings["sections"]["featured"]["cardDesign"]
}) {
  const visibleItemCount = cardsPerRow * rowsToShow

  return (
    <SectionPreviewShell>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            {hasContent(section.eyebrow) ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {section.eyebrow}
              </p>
            ) : null}
            {hasContent(section.title) ? (
              <h3 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#241913]">
                {section.title}
              </h3>
            ) : null}
            {hasContent(section.summary) ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6a5241]">
                {section.summary}
              </p>
            ) : null}
          </div>
          {hasContent(section.ctaLabel) ? (
            <Button type="button" variant="outline" className="rounded-full gap-2">
              {section.ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="pointer-events-none">
            <FeaturedCardRowSurface
              cardsPerRow={cardsPerRow}
              cardDesign={cardDesign}
              items={items.slice(0, visibleItemCount).map((item) => ({
                id: item.id,
                href: storefrontPaths.product(item.slug),
                name: item.name,
                imageUrl: item.primaryImageUrl,
                badge: item.badge ?? item.categoryName,
                brandName: item.brandName,
                categoryName: item.categoryName,
                shortDescription: item.shortDescription,
                amount: item.sellingPrice,
                compareAtAmount: item.mrp > item.sellingPrice ? item.mrp : null,
                availableQuantity: item.availableQuantity,
              }))}
            />
          </div>
        ) : (
          <EmptyPreviewState message="No live storefront products are available yet for this lane." />
        )}
      </div>
    </SectionPreviewShell>
  )
}

function StorefrontProductLanePreview({
  section,
  items,
}: {
  section: StorefrontSettings["sections"]["newArrivals"] | StorefrontSettings["sections"]["bestSellers"]
  items: StorefrontProductCard[]
}) {
  return (
    <SectionPreviewShell>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            {hasContent(section.eyebrow) ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {section.eyebrow}
              </p>
            ) : null}
            {hasContent(section.title) ? (
              <h3 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#241913]">
                {section.title}
              </h3>
            ) : null}
            {hasContent(section.summary) ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6a5241]">
                {section.summary}
              </p>
            ) : null}
          </div>
          {hasContent(section.ctaLabel) ? (
            <Button type="button" variant="outline" className="rounded-full gap-2">
              {section.ctaLabel}
              <ArrowRight className="size-4" />
            </Button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <div className="pointer-events-none">
            <StorefrontProductCardGrid
              items={items}
              cardsPerRow={section.cardsPerRow}
              rowsToShow={section.rowsToShow}
            />
          </div>
        ) : (
          <EmptyPreviewState message="No live storefront products are available yet for this lane." />
        )}
      </div>
    </SectionPreviewShell>
  )
}

function SingleFeaturedCardPreview({
  section,
  item,
}: {
  section: StorefrontSettings["sections"]["featured"]
  item: StorefrontProductCard | null
}) {
  return (
    <SectionPreviewShell>
      {item ? (
        <div className="w-full">
          <CommerceProductCard
            href={storefrontPaths.product(item.slug)}
            name={item.name}
            imageUrl={item.primaryImageUrl}
            badge={item.badge ?? item.categoryName}
            brandName={item.brandName}
            categoryName={item.categoryName}
            shortDescription={item.shortDescription}
            amount={item.sellingPrice}
            compareAtAmount={item.mrp > item.sellingPrice ? item.mrp : null}
            availableQuantity={item.availableQuantity}
            design={section.cardDesign}
          />
        </div>
      ) : (
        <EmptyPreviewState message="A single featured product preview will appear here once live storefront products are available." />
      )}
    </SectionPreviewShell>
  )
}

function CategoryGridPreview({
  section,
  items,
}: {
  section: StorefrontSettings["sections"]["categories"]
  items: Array<{
    id: string
    name: string
    description: string | null
    imageUrl: string | null
    productCount: number
  }>
}) {
  return (
    <SectionPreviewShell>
      <div className="space-y-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            {hasContent(section.eyebrow) ? (
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {section.eyebrow}
              </p>
            ) : null}
            {hasContent(section.title) ? (
              <h3 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-[#241913]">
                {section.title}
              </h3>
            ) : null}
            {hasContent(section.summary) ? (
              <p className="mt-2 max-w-2xl text-sm leading-7 text-[#6a5241]">
                {section.summary}
              </p>
            ) : null}
          </div>
          {hasContent(section.ctaLabel) ? (
            <Button type="button" variant="outline" className="rounded-full">
              {section.ctaLabel}
            </Button>
          ) : null}
        </div>
        {items.length > 0 ? (
          <CategoryCardGridSurface
            items={items.map((category) => ({
              ...category,
              href: storefrontPaths.catalog(),
            }))}
            cardsPerRow={section.cardsPerRow}
            rowsToShow={section.rowsToShow}
            cardDesign={section.cardDesign}
          />
        ) : (
          <EmptyPreviewState message="Category tiles will appear here from live storefront categories marked for storefront visibility." />
        )}
      </div>
    </SectionPreviewShell>
  )
}

function SingleCategoryCardPreview({
  section,
  item,
}: {
  section: StorefrontSettings["sections"]["categories"]
  item:
    | {
        id: string
        name: string
        description: string | null
        imageUrl: string | null
        productCount: number
        href: string
      }
    | null
}) {
  return (
    <SectionPreviewShell>
      {item ? (
        <div className="w-full">
          <CategoryCardSurface item={item} design={section.cardDesign} />
        </div>
      ) : (
        <EmptyPreviewState message="A single category preview will appear here once live storefront categories are available." />
      )}
    </SectionPreviewShell>
  )
}

function CampaignPreview({
  section,
}: {
  section: StorefrontSettings["sections"]["cta"]
}) {
  return (
    <SectionPreviewShell>
      <Card className="rounded-[2rem] border-[#decfbd] bg-[linear-gradient(135deg,#221812_0%,#3b2a20_100%)] py-0 text-stone-100 shadow-[0_30px_80px_-52px_rgba(28,15,8,0.75)]">
        <CardContent className="space-y-5 p-7">
          {hasContent(section.eyebrow) ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">
              {section.eyebrow}
            </p>
          ) : null}
          <div className="space-y-3">
            {hasContent(section.title) ? (
              <h3 className="font-heading text-3xl font-semibold tracking-tight">
                {section.title}
              </h3>
            ) : null}
            {hasContent(section.summary) ? (
              <p className="max-w-2xl text-sm leading-7 text-stone-200/80">
                {section.summary}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3">
            {hasContent(section.primaryCtaLabel) ? (
              <Button type="button" className="rounded-full bg-white text-[#241913] hover:bg-white/90">
                {section.primaryCtaLabel}
              </Button>
            ) : null}
            {hasContent(section.secondaryCtaLabel) ? (
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10"
              >
                {section.secondaryCtaLabel}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </SectionPreviewShell>
  )
}

function TrustPreview({ notes }: { notes: StorefrontSettings["trustNotes"] }) {
  return (
    <SectionPreviewShell>
      {notes.length > 0 ? (
        <div className="grid gap-4">
          {notes.map((note) => {
            const Icon = resolveTrustIcon(note.iconKey)

            return (
              <Card key={note.id} className="rounded-[1.6rem] border-[#e4d6c7] py-0 shadow-sm">
                <CardContent className="space-y-3 p-5">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-[#f4e8da] text-[#6d5140]">
                    <Icon className="size-5" />
                  </div>
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{note.summary}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <EmptyPreviewState message="Trust notes will appear here once at least one reassurance card is configured." />
      )}
    </SectionPreviewShell>
  )
}

export function StorefrontSettingsSection() {
  const [draft, setDraft] = useState<StorefrontSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const accessToken = getStoredAccessToken()
  const { data: shellData, refresh: refreshShellData } = useStorefrontShellData()

  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!accessToken) {
        setError("Admin session is required.")
        setIsLoading(false)
        return
      }

      try {
        const settings = await storefrontApi.getStorefrontSettings(accessToken)
        if (!cancelled) {
          setDraft(settings)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load storefront settings."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [accessToken])

  const tabs = useMemo(() => {
    if (!draft) {
      return [] as AnimatedContentTab[]
    }

    const featuredSection = draft.sections.featured
    const categoriesSection = draft.sections.categories
    const newArrivalsSection = draft.sections.newArrivals
    const bestSellersSection = draft.sections.bestSellers
    const ctaSection = draft.sections.cta
    const featuredPreviewItems = shellData?.featured ?? []
    const categoryPreviewItems =
      shellData?.categories.filter(
        (category) => category.productCount > 0 && category.slug !== "all-items"
      ) ?? []
    const newArrivalPreviewItems = shellData?.newArrivals ?? []
    const bestSellerPreviewItems = shellData?.bestSellers ?? []

    const announcement: AnimatedContentTab = {
      label: "Announcement",
      value: "announcement",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the storefront announcement strip."
            checked={draft.visibility.announcement}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, announcement: checked } })
            }
          />
          <TableCard>
            <Row
              label="Announcement"
              description="Storefront strip shown below the hero."
              field={
                <Textarea
                  value={draft.announcement}
                  onChange={(event) =>
                    setDraft({ ...draft, announcement: event.target.value })
                  }
                  rows={3}
                />
              }
            />
            <Row
              label="Design"
              description="Customize only the announcement strip surface, icon, and rounded treatment."
              field={
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Icon</p>
                    <Select value={draft.announcementDesign.iconKey} onValueChange={(value: "sparkles" | "truck" | "shield") => setDraft({ ...draft, announcementDesign: { ...draft.announcementDesign, iconKey: value } })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select icon" /></SelectTrigger>
                      <SelectContent><SelectItem value="sparkles">Sparkles</SelectItem><SelectItem value="truck">Truck</SelectItem><SelectItem value="shield">Shield</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Rounded</p>
                    <Select value={draft.announcementDesign.cornerStyle} onValueChange={(value: "pill" | "rounded" | "soft") => setDraft({ ...draft, announcementDesign: { ...draft.announcementDesign, cornerStyle: value } })}>
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select rounded" /></SelectTrigger>
                      <SelectContent><SelectItem value="pill">Pill</SelectItem><SelectItem value="rounded">Rounded</SelectItem><SelectItem value="soft">Soft</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Background</p><Input type="color" value={draft.announcementDesign.backgroundColor} onChange={(event) => setDraft({ ...draft, announcementDesign: { ...draft.announcementDesign, backgroundColor: event.target.value } })} className="h-11 w-full p-1" /></div>
                  <div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Text</p><Input type="color" value={draft.announcementDesign.textColor} onChange={(event) => setDraft({ ...draft, announcementDesign: { ...draft.announcementDesign, textColor: event.target.value } })} className="h-11 w-full p-1" /></div>
                  <div className="space-y-2"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Icon Color</p><Input type="color" value={draft.announcementDesign.iconColor} onChange={(event) => setDraft({ ...draft, announcementDesign: { ...draft.announcementDesign, iconColor: event.target.value } })} className="h-11 w-full p-1" /></div>
                </div>
              }
            />
          </TableCard>
          <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm"><CardContent className="p-5"><AnnouncementPreview announcement={draft.announcement} design={draft.announcementDesign} /></CardContent></Card>
        </div>
      ),
    }

    const hero: AnimatedContentTab = {
      label: "Slider Copy",
      value: "hero",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the hero slider."
            checked={draft.visibility.hero}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, hero: checked } })
            }
          />
          <TableCard>
            <Row label="Slider Meta" description="Fallback slider badge and image used when promo-led product copy is not active." field={<div className="grid gap-3 md:grid-cols-2"><Input value={draft.hero.eyebrow} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, eyebrow: event.target.value } })} /><Input value={draft.hero.heroImageUrl} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, heroImageUrl: event.target.value } })} /></div>} />
            <Row label="Fallback Title" description="Default slider title when a product does not override it with promo copy." field={<Input value={draft.hero.title} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, title: event.target.value } })} />} />
            <Row label="Fallback Summary" description="Supporting slider copy shown when promo subtitle is not available." field={<Textarea value={draft.hero.summary} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, summary: event.target.value } })} rows={4} />} />
            <Row label="Primary Action" description="Main slider action label and destination, usually to the catalog or a focused collection." field={<div className="grid gap-3 md:grid-cols-2"><Input value={draft.hero.primaryCtaLabel} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, primaryCtaLabel: event.target.value } })} /><Input value={draft.hero.primaryCtaHref} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, primaryCtaHref: event.target.value } })} /></div>} />
            <Row label="Secondary Action" description="Secondary slider action label and destination for discovery or detail flows." field={<div className="grid gap-3 md:grid-cols-2"><Input value={draft.hero.secondaryCtaLabel} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, secondaryCtaLabel: event.target.value } })} /><Input value={draft.hero.secondaryCtaHref} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, secondaryCtaHref: event.target.value } })} /></div>} />
            <Row label="Support Notes" description="Short supporting notes shown inside the slider layout." field={<div className="grid gap-3">{draft.hero.highlights.map((highlight) => <div key={highlight.id} className="grid gap-3 md:grid-cols-2"><Input value={highlight.label} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, highlights: draft.hero.highlights.map((item) => item.id === highlight.id ? { ...item, label: event.target.value } : item) } })} /><Input value={highlight.summary} onChange={(event) => setDraft({ ...draft, hero: { ...draft.hero, highlights: draft.hero.highlights.map((item) => item.id === highlight.id ? { ...item, summary: event.target.value } : item) } })} /></div>)}</div>} />
          </TableCard>
          <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm"><CardContent className="space-y-4 p-5"><p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Slider copy preview</p><div className="rounded-[1.5rem] border border-[#decfbd] bg-[linear-gradient(135deg,#221812_0%,#3b2a20_100%)] p-5 text-stone-100"><Badge variant="outline" className="rounded-full border-white/20 bg-white/10 px-3 py-1 text-amber-100">{draft.hero.eyebrow}</Badge><div className="mt-4 space-y-3"><h4 className="font-heading text-3xl font-semibold tracking-tight">{draft.hero.title}</h4><p className="max-w-xl text-sm leading-6 text-stone-200/80">{draft.hero.summary}</p></div><div className="mt-5 flex flex-wrap gap-3"><Button type="button" className="rounded-full bg-white text-[#241913] hover:bg-white/90">{draft.hero.primaryCtaLabel}</Button><Button type="button" variant="outline" className="rounded-full border-white/25 bg-transparent text-white hover:bg-white/10">{draft.hero.secondaryCtaLabel}</Button></div><div className="mt-5 grid gap-3 md:grid-cols-3">{draft.hero.highlights.map((highlight) => <div key={highlight.id} className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-200/70">{highlight.label}</p><p className="mt-2 text-sm text-stone-200/80">{highlight.summary}</p></div>)}</div></div></CardContent></Card>
        </div>
      ),
    }

    const search: AnimatedContentTab = {
      label: "Search",
      value: "search",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide storefront search."
            checked={draft.visibility.search}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, search: checked } })
            }
          />
          <TableCard>
            <Row
              label="Search"
              description="Control the shared storefront search copy and dropdown labels."
              field={
                <div className="grid gap-3">
                  <div className="grid gap-3">
                    <Input
                      value={draft.search.catalogIntro.eyebrow}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            catalogIntro: {
                              ...draft.search.catalogIntro,
                              eyebrow: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      value={draft.search.catalogIntro.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            catalogIntro: {
                              ...draft.search.catalogIntro,
                              title: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Textarea
                      value={draft.search.catalogIntro.summary}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            catalogIntro: {
                              ...draft.search.catalogIntro,
                              summary: event.target.value,
                            },
                          },
                        })
                      }
                      rows={3}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={draft.search.placeholder}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: { ...draft.search, placeholder: event.target.value },
                        })
                      }
                    />
                    <Input
                      value={draft.search.departmentLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            departmentLabel: event.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Input
                      value={draft.search.categoryFilterLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            categoryFilterLabel: event.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      value={draft.search.departmentFilterLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            departmentFilterLabel: event.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      value={draft.search.sortFilterLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: {
                            ...draft.search,
                            sortFilterLabel: event.target.value,
                          },
                        })
                      }
                    />
                    <Input
                      value={draft.search.resetLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          search: { ...draft.search, resetLabel: event.target.value },
                        })
                      }
                    />
                  </div>
                  <Input
                    value={draft.search.resultsLabel}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        search: { ...draft.search, resultsLabel: event.target.value },
                      })
                    }
                  />
                  <Textarea
                    value={toDepartmentLines(draft)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        search: {
                          ...draft.search,
                          departments: parseDepartmentLines(event.target.value),
                        },
                      })
                    }
                    rows={6}
                  />
                </div>
              }
            />
          </TableCard>
          <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
            <CardContent className="space-y-4 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Search preview
              </p>
              <div className="rounded-[2rem] border border-[#eadfce] bg-[linear-gradient(180deg,#fcf8f3_0%,#f7efe6_100%)] p-5 shadow-[0_28px_56px_-42px_rgba(48,31,19,0.26)]">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#866651]">
                      {draft.search.catalogIntro.eyebrow}
                    </p>
                    <h3 className="font-heading text-4xl font-semibold tracking-tight text-[#241913]">
                      {draft.search.catalogIntro.title}
                    </h3>
                    <p className="max-w-3xl text-sm leading-7 text-[#6a5241]">
                      {draft.search.catalogIntro.summary}
                    </p>
                  </div>
                  <div className="rounded-[2rem] border border-[#e3d5c6] bg-white/85 p-5 shadow-[0_26px_55px_-42px_rgba(48,31,19,0.28)]">
                    <div className="grid gap-5">
                      <StorefrontSearchBar
                        readOnly
                        className="shadow-none"
                        placeholder={draft.search.placeholder}
                        departmentLabel={draft.search.departmentLabel}
                        departments={draft.search.departments}
                      />
                      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_auto]">
                        {[
                          draft.search.categoryFilterLabel,
                          draft.search.departmentFilterLabel,
                          draft.search.sortFilterLabel,
                        ].map((label) => (
                          <div
                            key={label}
                            className="flex items-center justify-between rounded-full border border-[#e6d8c8] bg-[#fbf7f1] px-4 py-3 text-sm text-[#3b2a20] shadow-sm"
                          >
                            <span>{label}</span>
                            <ChevronDown className="size-4 text-[#c2ac95]" />
                          </div>
                        ))}
                        <div className="flex items-center justify-center rounded-full border border-[#e6d8c8] bg-white px-4 py-3 text-sm font-medium text-[#3b2a20] shadow-sm">
                          {draft.search.resetLabel}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <p className="text-sm text-[#6a5241]">
                          4 {draft.search.resultsLabel}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {draft.search.departments.slice(0, 6).map((item) => (
                            <div
                              key={item.value}
                              className="rounded-full border border-[#e6d8c8] bg-white px-4 py-2 text-xs font-medium text-[#3b2a20] shadow-sm"
                            >
                              {item.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
    }

    const support: AnimatedContentTab = {
      label: "Support",
      value: "support",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide support and shipping info."
            checked={draft.visibility.support}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, support: checked } })
            }
          />
          <TableCard>
            <Row
              label="Support Phone"
              description="Customer-facing phone number."
              field={
                <Input
                  value={draft.supportPhone}
                  onChange={(event) =>
                    setDraft({ ...draft, supportPhone: event.target.value })
                  }
                />
              }
            />
            <Row
              label="Support Email"
              description="Visible storefront support mailbox."
              field={
                <Input
                  value={draft.supportEmail}
                  onChange={(event) =>
                    setDraft({ ...draft, supportEmail: event.target.value })
                  }
                />
              }
            />
            <Row
              label="Free Shipping"
              description="Threshold for free shipping messaging."
              field={
                <Input
                  type="number"
                  value={draft.freeShippingThreshold}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      freeShippingThreshold: Number(event.target.value || 0),
                    })
                  }
                />
              }
            />
            <Row
              label="Default Shipping"
              description="Fallback delivery charge."
              field={
                <Input
                  type="number"
                  value={draft.defaultShippingAmount}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      defaultShippingAmount: Number(event.target.value || 0),
                    })
                  }
                />
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="Support preview"
            title="Support and shipping"
            summary="These values feed customer-facing support and shipping surfaces in the storefront."
          >
            <SectionPreviewShell>
              <div className="rounded-[1.8rem] border border-[#2d211b] bg-[#17120e] p-5 text-stone-200">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                      Support
                    </p>
                    <p className="mt-3 text-sm text-stone-100">{draft.supportEmail}</p>
                    <p className="mt-1 text-sm text-stone-300">{draft.supportPhone}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-stone-400">
                      Shipping
                    </p>
                    <p className="mt-3 text-sm text-stone-100">
                      Free over {formatCurrency(draft.freeShippingThreshold)}
                    </p>
                    <p className="mt-1 text-sm text-stone-300">
                      Default {formatCurrency(draft.defaultShippingAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </SectionPreviewShell>
          </PreviewCard>
        </div>
      ),
    }

    const featured: AnimatedContentTab = {
      label: "Featured",
      value: "featured",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the featured products section."
            checked={draft.visibility.featured}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, featured: checked } })
            }
          />
          <TableCard>
            <SectionCopyFields
              section={featuredSection}
              onChange={(next) =>
                setDraft({
                  ...draft,
                  sections: { ...draft.sections, featured: next },
                })
              }
              description="Eyebrow, title, summary, and CTA for the featured section."
            />
            <Row
              label="Preview Layout"
              description="Design-time only. Choose how many featured cards to view in a single preview row."
              field={
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Cards in row
                    </p>
                    <Select
                      value={String(featuredSection.cardsPerRow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            featured: {
                              ...featuredSection,
                              cardsPerRow: Number(value) as FeaturedCardRowVariant,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select featured row variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">FeaturedCard-3</SelectItem>
                        <SelectItem value="4">FeaturedCard-4</SelectItem>
                        <SelectItem value="5">FeaturedCard-5</SelectItem>
                        <SelectItem value="6">FeaturedCard-6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Rows to show
                    </p>
                    <Select
                      value={String(featuredSection.rowsToShow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            featured: {
                              ...featuredSection,
                              rowsToShow: Number(value) as 1 | 2 | 3,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select preview row count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Row</SelectItem>
                        <SelectItem value="2">2 Rows</SelectItem>
                        <SelectItem value="3">3 Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="Featured preview"
            title="Featured storefront lane"
            summary={`This preview uses the live storefront featured products with your current copy in the FeaturedCard-${featuredSection.cardsPerRow} layout across ${featuredSection.rowsToShow} row${featuredSection.rowsToShow > 1 ? "s" : ""}.`}
          >
            <ProductLanePreview
              section={featuredSection}
              items={featuredPreviewItems}
              cardsPerRow={featuredSection.cardsPerRow}
              rowsToShow={featuredSection.rowsToShow}
              cardDesign={featuredSection.cardDesign}
            />
          </PreviewCard>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(360px,0.62fr)] xl:items-start">
            <TableCard className="xl:max-w-[52rem]">
              <Row
                label="Primary button"
                description="Control the main featured card action label."
                field={
                  <Input
                    value={featuredSection.cardDesign.primaryButtonLabel}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          featured: {
                            ...featuredSection,
                            cardDesign: {
                              ...featuredSection.cardDesign,
                              primaryButtonLabel: event.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                }
              />
              <Row
                label="Right badge"
                description="Add the secondary badge shown at the top-right of the card."
                field={
                  <Input
                    value={featuredSection.cardDesign.secondaryBadgeText}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          featured: {
                            ...featuredSection,
                            cardDesign: {
                              ...featuredSection.cardDesign,
                              secondaryBadgeText: event.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                }
              />
              <Row
                label="Text colors"
                description="Tune title, meta, description, and price colors for the featured card."
                field={
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledField label="Title">
                      <ColorField
                        value={featuredSection.cardDesign.titleColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  titleColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Meta">
                      <ColorField
                        value={featuredSection.cardDesign.metaColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  metaColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Description">
                      <ColorField
                        value={featuredSection.cardDesign.descriptionColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  descriptionColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Price">
                      <ColorField
                        value={featuredSection.cardDesign.priceColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  priceColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Compare price">
                      <ColorField
                        value={featuredSection.cardDesign.compareAtColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  compareAtColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                  </div>
                }
              />
              <Row
                label="Badge colors"
                description="Style both left and right featured badges."
                field={
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledField label="Left badge bg">
                      <ColorField
                        value={featuredSection.cardDesign.badgeBackgroundColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  badgeBackgroundColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Left badge text">
                      <ColorField
                        value={featuredSection.cardDesign.badgeTextColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  badgeTextColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Right badge bg">
                      <ColorField
                        value={featuredSection.cardDesign.secondaryBadgeBackgroundColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  secondaryBadgeBackgroundColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Right badge text">
                      <ColorField
                        value={featuredSection.cardDesign.secondaryBadgeTextColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              featured: {
                                ...featuredSection,
                                cardDesign: {
                                  ...featuredSection.cardDesign,
                                  secondaryBadgeTextColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                  </div>
                }
              />
              <Row
                label="Card toggles"
                description="Show or hide individual card parts for this featured design."
                field={
                  <CardDesignToggleGrid
                    design={featuredSection.cardDesign}
                    onChange={(nextDesign) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          featured: {
                            ...featuredSection,
                            cardDesign: nextDesign,
                          },
                        },
                      })
                    }
                  />
                }
              />
            </TableCard>
            <PreviewCard
              eyebrow="Single card preview"
              title="Featured card designer"
              summary="This single-card preview uses the same live featured product card and updates across breakpoints."
              className="xl:sticky xl:top-24"
              showHeader={false}
            >
              <SingleFeaturedCardPreview
                section={featuredSection}
                item={featuredPreviewItems[0] ?? null}
              />
            </PreviewCard>
          </div>
        </div>
      ),
    }

    const categories: AnimatedContentTab = {
      label: "Categories",
      value: "categories",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the categories section."
            checked={draft.visibility.categories}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, categories: checked } })
            }
          />
          <TableCard>
            <SectionCopyFields
              section={categoriesSection}
              onChange={(next) =>
                setDraft({
                  ...draft,
                  sections: { ...draft.sections, categories: next },
                })
              }
              description="Set the category section eyebrow, heading, supporting copy, and the optional action button shown above the category grid."
            />
            <Row
              label="Preview Layout"
              description="Choose how many category cards and rows to show in the storefront category grid."
              field={
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Cards in row
                    </p>
                    <Select
                      value={String(categoriesSection.cardsPerRow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            categories: {
                              ...categoriesSection,
                              cardsPerRow: Number(value) as FeaturedCardRowVariant,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category row variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">CategoryCard-3</SelectItem>
                        <SelectItem value="4">CategoryCard-4</SelectItem>
                        <SelectItem value="5">CategoryCard-5</SelectItem>
                        <SelectItem value="6">CategoryCard-6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Rows to show
                    </p>
                    <Select
                      value={String(categoriesSection.rowsToShow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            categories: {
                              ...categoriesSection,
                              rowsToShow: Number(value) as 1 | 2 | 3,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select category row count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Row</SelectItem>
                        <SelectItem value="2">2 Rows</SelectItem>
                        <SelectItem value="3">3 Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="Categories preview"
            title="Category grid"
            summary={`This preview uses the live storefront category cards in the CategoryCard-${categoriesSection.cardsPerRow} layout across ${categoriesSection.rowsToShow} row${categoriesSection.rowsToShow > 1 ? "s" : ""}.`}
          >
            <CategoryGridPreview section={categoriesSection} items={categoryPreviewItems} />
          </PreviewCard>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,0.88fr)_minmax(360px,0.62fr)] xl:items-start">
            <TableCard className="xl:max-w-[52rem]">
              <Row
                label="Button label"
                description="Control the category card action label."
                field={
                  <Input
                    value={categoriesSection.cardDesign.buttonLabel}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          categories: {
                            ...categoriesSection,
                            cardDesign: {
                              ...categoriesSection.cardDesign,
                              buttonLabel: event.target.value,
                            },
                          },
                        },
                      })
                    }
                  />
                }
              />
              <Row
                label="Text colors"
                description="Tune title, count, and description colors for the category card."
                field={
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledField label="Title">
                      <ColorField
                        value={categoriesSection.cardDesign.titleColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              categories: {
                                ...categoriesSection,
                                cardDesign: {
                                  ...categoriesSection.cardDesign,
                                  titleColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Count">
                      <ColorField
                        value={categoriesSection.cardDesign.metaColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              categories: {
                                ...categoriesSection,
                                cardDesign: {
                                  ...categoriesSection.cardDesign,
                                  metaColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Description">
                      <ColorField
                        value={categoriesSection.cardDesign.descriptionColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              categories: {
                                ...categoriesSection,
                                cardDesign: {
                                  ...categoriesSection.cardDesign,
                                  descriptionColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                  </div>
                }
              />
              <Row
                label="Button colors"
                description="Style the category card action button."
                field={
                  <div className="grid gap-3 md:grid-cols-2">
                    <LabeledField label="Button bg">
                      <ColorField
                        value={categoriesSection.cardDesign.buttonBackgroundColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              categories: {
                                ...categoriesSection,
                                cardDesign: {
                                  ...categoriesSection.cardDesign,
                                  buttonBackgroundColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                    <LabeledField label="Button text">
                      <ColorField
                        value={categoriesSection.cardDesign.buttonTextColor}
                        onChange={(value) =>
                          setDraft({
                            ...draft,
                            sections: {
                              ...draft.sections,
                              categories: {
                                ...categoriesSection,
                                cardDesign: {
                                  ...categoriesSection.cardDesign,
                                  buttonTextColor: value,
                                },
                              },
                            },
                          })
                        }
                      />
                    </LabeledField>
                  </div>
                }
              />
              <Row
                label="Card toggles"
                description="Show or hide category card parts for this section."
                field={
                  <CategoryCardDesignToggleGrid
                    design={categoriesSection.cardDesign}
                    onChange={(nextDesign) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          categories: {
                            ...categoriesSection,
                            cardDesign: nextDesign,
                          },
                        },
                      })
                    }
                  />
                }
              />
            </TableCard>
            <PreviewCard
              eyebrow="Single card preview"
              title="Category card designer"
              summary="This single-card preview uses the same live category card and updates across breakpoints."
              className="xl:sticky xl:top-24"
              showHeader={false}
            >
              <SingleCategoryCardPreview
                section={categoriesSection}
                item={
                  categoryPreviewItems[0]
                    ? {
                        ...categoryPreviewItems[0],
                        href: storefrontPaths.catalog(),
                      }
                    : null
                }
              />
            </PreviewCard>
          </div>
        </div>
      ),
    }

    const newArrivals: AnimatedContentTab = {
      label: "New Arrivals",
      value: "new-arrivals",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the new arrivals section."
            checked={draft.visibility.newArrivals}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, newArrivals: checked } })
            }
          />
          <TableCard>
            <SectionCopyFields
              section={newArrivalsSection}
              onChange={(next) =>
                setDraft({
                  ...draft,
                  sections: { ...draft.sections, newArrivals: next },
                })
              }
              description="Eyebrow, title, summary, and optional CTA for the new arrivals lane."
            />
            <Row
              label="Preview Layout"
              description="Choose how many product cards appear per row and how many rows the storefront should show."
              field={
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Cards in row
                    </p>
                    <Select
                      value={String(newArrivalsSection.cardsPerRow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            newArrivals: {
                              ...newArrivalsSection,
                              cardsPerRow: Number(value) as StorefrontProductLaneCardsPerRow,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product card row variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ProductCard-1</SelectItem>
                        <SelectItem value="2">ProductCard-2</SelectItem>
                        <SelectItem value="3">ProductCard-3</SelectItem>
                        <SelectItem value="4">ProductCard-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Rows to show
                    </p>
                    <Select
                      value={String(newArrivalsSection.rowsToShow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            newArrivals: {
                              ...newArrivalsSection,
                              rowsToShow: Number(value) as StorefrontProductLaneRowsToShow,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select preview row count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Row</SelectItem>
                        <SelectItem value="2">2 Rows</SelectItem>
                        <SelectItem value="3">3 Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="New arrivals preview"
            title="New arrivals lane"
            summary={`This preview uses the live storefront new arrivals in the ProductCard-${newArrivalsSection.cardsPerRow} layout across ${newArrivalsSection.rowsToShow} row${newArrivalsSection.rowsToShow > 1 ? "s" : ""}.`}
          >
            <StorefrontProductLanePreview
              section={newArrivalsSection}
              items={newArrivalPreviewItems}
            />
          </PreviewCard>
        </div>
      ),
    }

    const bestSellers: AnimatedContentTab = {
      label: "Best Sellers",
      value: "best-sellers",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the best sellers section."
            checked={draft.visibility.bestSellers}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, bestSellers: checked } })
            }
          />
          <TableCard>
            <SectionCopyFields
              section={bestSellersSection}
              onChange={(next) =>
                setDraft({
                  ...draft,
                  sections: { ...draft.sections, bestSellers: next },
                })
              }
              description="Eyebrow, title, summary, and optional CTA for the best seller lane."
            />
            <Row
              label="Preview Layout"
              description="Choose how many product cards appear per row and how many rows the storefront should show."
              field={
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Cards in row
                    </p>
                    <Select
                      value={String(bestSellersSection.cardsPerRow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            bestSellers: {
                              ...bestSellersSection,
                              cardsPerRow: Number(value) as StorefrontProductLaneCardsPerRow,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select product card row variant" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">ProductCard-1</SelectItem>
                        <SelectItem value="2">ProductCard-2</SelectItem>
                        <SelectItem value="3">ProductCard-3</SelectItem>
                        <SelectItem value="4">ProductCard-4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      Rows to show
                    </p>
                    <Select
                      value={String(bestSellersSection.rowsToShow)}
                      onValueChange={(value) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            bestSellers: {
                              ...bestSellersSection,
                              rowsToShow: Number(value) as StorefrontProductLaneRowsToShow,
                            },
                          },
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select preview row count" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Row</SelectItem>
                        <SelectItem value="2">2 Rows</SelectItem>
                        <SelectItem value="3">3 Rows</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="Best sellers preview"
            title="Best sellers lane"
            summary={`This preview uses the live storefront best sellers in the ProductCard-${bestSellersSection.cardsPerRow} layout across ${bestSellersSection.rowsToShow} row${bestSellersSection.rowsToShow > 1 ? "s" : ""}.`}
          >
            <StorefrontProductLanePreview
              section={bestSellersSection}
              items={bestSellerPreviewItems}
            />
          </PreviewCard>
        </div>
      ),
    }

    const campaign: AnimatedContentTab = {
      label: "Campaign",
      value: "campaign",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the campaign CTA block."
            checked={draft.visibility.cta}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, cta: checked } })
            }
          />
          <TableCard>
            <Row
              label="Campaign CTA"
              description="Bottom campaign block with both actions."
              field={
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={ctaSection.eyebrow}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: { ...ctaSection, eyebrow: event.target.value },
                          },
                        })
                      }
                    />
                    <Input
                      value={ctaSection.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: { ...ctaSection, title: event.target.value },
                          },
                        })
                      }
                    />
                  </div>
                  <Textarea
                    value={ctaSection.summary}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          cta: { ...ctaSection, summary: event.target.value },
                        },
                      })
                    }
                    rows={3}
                  />
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Input
                      value={ctaSection.primaryCtaLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: {
                              ...ctaSection,
                              primaryCtaLabel: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      value={ctaSection.primaryCtaHref}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: {
                              ...ctaSection,
                              primaryCtaHref: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      value={ctaSection.secondaryCtaLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: {
                              ...ctaSection,
                              secondaryCtaLabel: event.target.value,
                            },
                          },
                        })
                      }
                    />
                    <Input
                      value={ctaSection.secondaryCtaHref}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            cta: {
                              ...ctaSection,
                              secondaryCtaHref: event.target.value,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </div>
              }
            />
          </TableCard>
          <PreviewCard
            eyebrow="Campaign preview"
            title="Bottom campaign block"
            summary="This preview matches the storefront campaign CTA card."
          >
            <CampaignPreview section={ctaSection} />
          </PreviewCard>
        </div>
      ),
    }

    const trust: AnimatedContentTab = {
      label: "Trust",
      value: "trust",
      content: (
        <div className="space-y-4">
          <VisibilityRow
            label="Visibility"
            description="Show or hide the trust cards."
            checked={draft.visibility.trust}
            onCheckedChange={(checked) =>
              setDraft({ ...draft, visibility: { ...draft.visibility, trust: checked } })
            }
          />
          <TableCard>
            {draft.trustNotes.map((note) => (
              <Row
                key={note.id}
                label={note.title}
                description="Trust card title, summary, and icon."
                field={
                  <div className="grid gap-3">
                    <Input
                      value={note.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          trustNotes: draft.trustNotes.map((item) =>
                            item.id === note.id
                              ? { ...item, title: event.target.value }
                              : item
                          ),
                        })
                      }
                    />
                    <Textarea
                      value={note.summary}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          trustNotes: draft.trustNotes.map((item) =>
                            item.id === note.id
                              ? { ...item, summary: event.target.value }
                              : item
                          ),
                        })
                      }
                      rows={3}
                    />
                    <Select
                      value={note.iconKey}
                      onValueChange={(value: "sparkles" | "truck" | "shield") =>
                        setDraft({
                          ...draft,
                          trustNotes: draft.trustNotes.map((item) =>
                            item.id === note.id ? { ...item, iconKey: value } : item
                          ),
                        })
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sparkles">Sparkles</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="shield">Shield</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                }
              />
            ))}
          </TableCard>
          <PreviewCard
            eyebrow="Trust preview"
            title="Trust cards"
            summary="This preview matches the storefront reassurance cards beside the campaign block."
          >
            <TrustPreview notes={draft.trustNotes} />
          </PreviewCard>
        </div>
      ),
    }

    return [
      announcement,
      hero,
      search,
      support,
      featured,
      categories,
      newArrivals,
      bestSellers,
      campaign,
      trust,
    ]
  }, [draft, shellData])

  if (isLoading) {
    return <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm"><CardContent className="p-5 text-sm text-muted-foreground">Loading storefront settings...</CardContent></Card>
  }

  if (error || !draft) {
    return <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm"><CardContent className="p-5 text-sm text-destructive">{error ?? "Storefront settings are unavailable."}</CardContent></Card>
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">{tabs.length} tabs</Badge>
        <Button type="button" className="rounded-full" disabled={isSaving} onClick={async () => {
          if (!accessToken) {
            setError("Admin session is required.")
            return
          }
          setIsSaving(true)
          setSaveMessage(null)
          setError(null)
          try {
            const validatedDraft = storefrontSettingsSchema.safeParse(draft)
            if (!validatedDraft.success) {
              const firstIssue = validatedDraft.error.issues[0]
              const issuePath = firstIssue?.path.join(".") ?? "payload"
              setError(`${issuePath}: ${firstIssue?.message ?? "Invalid value."}`)
              setIsSaving(false)
              return
            }
            const saved = await storefrontApi.updateStorefrontSettings(accessToken, validatedDraft.data)
            setDraft(saved)
            invalidateStorefrontShellData()
            await refreshShellData().catch(() => null)
            setSaveMessage("Storefront settings saved.")
            showRecordToast({
              entity: "Storefront Settings",
              action: "saved",
              recordName: "Storefront",
              recordId: saved.id,
            })
          } catch (saveError) {
            const message =
              saveError instanceof Error ? saveError.message : "Failed to save storefront settings."
            setError(message)
            showAppToast({
              variant: "error",
              title: "Storefront settings save failed.",
              description: message,
            })
          } finally {
            setIsSaving(false)
          }
        }}>{isSaving ? "Saving..." : "Save storefront"}</Button>
        <Button asChild variant="outline" className="rounded-full"><a href={storefrontPaths.home()} target="_blank" rel="noreferrer">Open storefront</a></Button>
        {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
      </div>
      {error ? <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm"><CardContent className="p-5 text-sm text-destructive">{error}</CardContent></Card> : null}
      <AnimatedTabs defaultTabValue="announcement" tabs={tabs} />
    </div>
  )
}

