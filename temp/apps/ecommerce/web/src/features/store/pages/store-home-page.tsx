import type { CommonModuleItem } from "@shared/index"
import { useEffect, useMemo, useState } from "react"
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, TruckIcon } from "lucide-react"
import { Link } from "react-router-dom"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CategoryGrid } from "@/features/store/components/product/CategoryGrid"
import { DealBanner } from "@/features/store/components/product/DealBanner"
import { HeroSlider } from "@/features/store/components/product/HeroSlider"
import { ProductGrid } from "@/features/store/components/product/ProductGrid"
import type { StorefrontProduct } from "@/features/store/types/storefront"
import { VendorCarousel } from "@/features/store/components/product/VendorCarousel"
import { useStorefront } from "@/features/store/context/storefront-context"
import { HttpError, listCommonModuleItems } from "@/shared/api/client"
import { showInfoToast } from "@/shared/notifications/toast"

type HomeTemplateCode =
  | "home-category"
  | "home-featured"
  | "home-new-arrivals"
  | "home-bestsellers"
  | "home-featured-labels"
  | "home-cta"
  | "trust-editorial"
  | "trust-delivery"
  | "trust-shell"

type HomeSectionTemplate = {
  badgeText: string | null
  title: string
  description: string | null
  primaryCtaLabel: string | null
  primaryCtaHref: string | null
  secondaryCtaLabel: string | null
  secondaryCtaHref: string | null
  iconKey: string | null
  themeKey: string | null
}

const fallbackTemplates: Record<HomeTemplateCode, HomeSectionTemplate> = {
  "home-category": {
    badgeText: "Shop by Category",
    title: "Category groupings now come from the live product catalog.",
    description: "The store navigation, category rail, and category cards derive from active backend product and storefront profile records.",
    primaryCtaLabel: "Explore the full catalog",
    primaryCtaHref: "/search",
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: null,
    themeKey: "neutral",
  },
  "home-featured": {
    badgeText: "Featured Edit",
    title: "Feature-section products curated in the product publishing profile.",
    description: "These cards stay fully backend-driven, including category mapping, prices, inventory, and real product imagery.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: null,
    themeKey: "neutral",
  },
  "home-new-arrivals": {
    badgeText: "New Arrivals",
    title: "New arrivals curated directly from publishing options.",
    description: "Fresh storefront introductions are driven by active backend publishing rows rather than static page content.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: null,
    themeKey: "sand",
  },
  "home-bestsellers": {
    badgeText: "Bestsellers",
    title: "Best sellers highlighted through backend storefront flags.",
    description: "This section groups products using the real storefront best-seller flag and live inventory-ready products.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: null,
    themeKey: "mist",
  },
  "home-featured-labels": {
    badgeText: "Featured Labels",
    title: "Brand labels assembled from flagged live products.",
    description: "This area groups brands from the actual catalog instead of fixed sample content.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: null,
    themeKey: "neutral",
  },
  "home-cta": {
    badgeText: "Storefront Ready",
    title: "Storefront browsing is now running on the backend product catalog.",
    description: "Home sections, category browsing, product detail, brand highlights, and catalog filters derive from backend storefront data with a safe fallback copy path.",
    primaryCtaLabel: "Start browsing",
    primaryCtaHref: "/search",
    secondaryCtaLabel: "Review cart",
    secondaryCtaHref: "/cart",
    iconKey: null,
    themeKey: "cta",
  },
  "trust-editorial": {
    badgeText: null,
    title: "Editorial curation",
    description: "Built as a premium storefront with backend-driven product curation, polished hierarchy, and campaign-style entry sections.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: "sparkles",
    themeKey: "trust",
  },
  "trust-delivery": {
    badgeText: null,
    title: "Design-first flow",
    description: "Cart and checkout stay styled for the shopper journey while product discovery and merchandising run on live catalog data.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: "truck",
    themeKey: "trust",
  },
  "trust-shell": {
    badgeText: null,
    title: "Shell preserved",
    description: "The menu, category rail, footer, and storefront sections stay aligned while reading dynamic copy and product data from the backend.",
    primaryCtaLabel: null,
    primaryCtaHref: null,
    secondaryCtaLabel: null,
    secondaryCtaHref: null,
    iconKey: "shield",
    themeKey: "trust",
  },
}

const iconByKey = {
  sparkles: SparklesIcon,
  truck: TruckIcon,
  shield: ShieldCheckIcon,
} as const

function normalizeTemplateText(value: unknown, fallback: string | null) {
  if (typeof value !== "string") {
    return fallback
  }

  const trimmed = value.trim()
  if (trimmed.length === 0 || trimmed === "-") {
    return fallback
  }

  return trimmed
}

function toHomeTemplate(item: CommonModuleItem | undefined, fallback: HomeSectionTemplate): HomeSectionTemplate {
  return {
    badgeText: normalizeTemplateText(item?.badge_text, fallback.badgeText),
    title: normalizeTemplateText(item?.title, fallback.title) ?? fallback.title,
    description: normalizeTemplateText(item?.description, fallback.description),
    primaryCtaLabel: normalizeTemplateText(item?.cta_primary_label, fallback.primaryCtaLabel),
    primaryCtaHref: normalizeTemplateText(item?.cta_primary_href, fallback.primaryCtaHref),
    secondaryCtaLabel: normalizeTemplateText(item?.cta_secondary_label, fallback.secondaryCtaLabel),
    secondaryCtaHref: normalizeTemplateText(item?.cta_secondary_href, fallback.secondaryCtaHref),
    iconKey: normalizeTemplateText(item?.icon_key, fallback.iconKey),
    themeKey: normalizeTemplateText(item?.theme_key, fallback.themeKey),
  }
}

function gradientByTheme(themeKey: string | null | undefined) {
  switch (themeKey) {
    case "sand":
      return "bg-[linear-gradient(135deg,rgba(255,249,242,0.98)_0%,rgba(244,233,218,0.96)_100%)]"
    case "mist":
      return "bg-[linear-gradient(135deg,rgba(245,244,251,0.98)_0%,rgba(228,220,247,0.96)_100%)]"
    default:
      return "bg-white/78"
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "Failed to load storefront design templates."
}

function CompactProductPreview({
  products,
  emptyMessage,
}: {
  products: StorefrontProduct[]
  emptyMessage: string
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-[1.2rem] border border-dashed border-border/60 bg-background/45 px-4 py-6 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {products.slice(0, 2).map((product) => (
        <Link
          key={product.id}
          to={`/product/${product.slug}`}
          className="grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.3rem] border border-border/60 bg-background/72 p-3 transition hover:border-border hover:bg-background/88"
        >
          <div className="overflow-hidden rounded-[1rem] border border-border/50 bg-muted/40">
            {product.images[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                No image
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {product.catalogBadge ? (
                <Badge variant="outline" className="rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.16em]">
                  {product.catalogBadge}
                </Badge>
              ) : null}
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{product.brand}</span>
            </div>
            <p className="line-clamp-1 text-sm font-semibold text-foreground">{product.name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{product.categoryName}</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-sm font-semibold text-foreground">{product.price.toFixed(2)}</p>
            {product.compareAtPrice ? (
              <p className="text-xs text-muted-foreground line-through">{product.compareAtPrice.toFixed(2)}</p>
            ) : null}
          </div>
        </Link>
      ))}
    </div>
  )
}

export function StoreHomePage() {
  const { categories, brands, products, isLoading, errorMessage } = useStorefront()
  const [templateItems, setTemplateItems] = useState<CommonModuleItem[]>([])
  const [templateError, setTemplateError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      try {
        const items = await listCommonModuleItems("storefrontTemplates", false)
        if (!cancelled) {
          setTemplateItems(items)
          setTemplateError(null)
        }
      } catch (error) {
        if (!cancelled) {
          setTemplateError(toErrorMessage(error))
        }
      }
    }

    void loadTemplates()
    return () => {
      cancelled = true
    }
  }, [])

  const templateByCode = useMemo(() => {
    const next = new Map<string, CommonModuleItem>()
    for (const item of templateItems) {
      const code = typeof item.code === "string" ? item.code : null
      if (code) {
        next.set(code, item)
      }
    }
    return next
  }, [templateItems])

  const homeCategory = toHomeTemplate(templateByCode.get("home-category"), fallbackTemplates["home-category"])
  const homeFeatured = toHomeTemplate(templateByCode.get("home-featured"), fallbackTemplates["home-featured"])
  const homeNewArrivals = toHomeTemplate(templateByCode.get("home-new-arrivals"), fallbackTemplates["home-new-arrivals"])
  const homeBestsellers = toHomeTemplate(templateByCode.get("home-bestsellers"), fallbackTemplates["home-bestsellers"])
  const homeFeaturedLabels = toHomeTemplate(templateByCode.get("home-featured-labels"), fallbackTemplates["home-featured-labels"])
  const homeCta = toHomeTemplate(templateByCode.get("home-cta"), fallbackTemplates["home-cta"])
  const trustNotes = (["trust-editorial", "trust-delivery", "trust-shell"] as const).map((code) => {
    const template = toHomeTemplate(templateByCode.get(code), fallbackTemplates[code])
    return {
      ...template,
      icon: iconByKey[(template.iconKey ?? fallbackTemplates[code].iconKey ?? "sparkles") as keyof typeof iconByKey] ?? SparklesIcon,
    }
  })

  const featuredProducts = products
    .filter((product) => product.featureSection)
    .sort((left, right) => left.featureSectionOrder - right.featureSectionOrder || right.rating - left.rating)
    .slice(0, 6)
  const catalogSectionCategories = categories.filter((category) => category.showInCatalogSection)
  const newArrivals = products.filter((product) => product.newArrival).slice(0, 2)
  const bestsellingProducts = products.filter((product) => product.bestseller).slice(0, 2)
  const featuredBrands = brands.filter((brand) => brand.featuredLabel)

  function handleFeatureNoteClick(title: string) {
    showInfoToast({
      title: "Feature details coming soon",
      description: `${title} will get a dedicated storefront walkthrough in a follow-up.`,
    })
  }

  if (isLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground sm:px-6">Loading storefront...</div>
  }

  if (errorMessage) {
    return <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-destructive sm:px-6">{errorMessage}</div>
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pt-2 pb-6 sm:px-6 sm:py-10">
      <HeroSlider />

      <section className="space-y-5">
        <div className="flex items-center justify-between gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            {homeCategory.badgeText ? <Badge variant="outline" className="h-8 w-fit items-center rounded-full px-3 text-[10px] uppercase tracking-[0.16em]">{homeCategory.badgeText}</Badge> : null}
            <h2 className="hidden text-3xl font-semibold tracking-tight sm:block">{homeCategory.title}</h2>
            {homeCategory.description ? (
              <p className="hidden max-w-3xl text-sm leading-6 text-muted-foreground sm:block">
                {homeCategory.description}
                {templateError ? " Fallback copy is currently active." : ""}
              </p>
            ) : null}
          </div>
          {homeCategory.primaryCtaLabel && homeCategory.primaryCtaHref ? (
            <Button asChild variant="ghost" className="mt-0 h-8 justify-end px-0 text-sm whitespace-nowrap sm:h-auto sm:justify-center sm:px-0">
              <Link to={homeCategory.primaryCtaHref}>
                {homeCategory.primaryCtaLabel}
                <ArrowRightIcon className="size-4" />
              </Link>
            </Button>
          ) : null}
        </div>
        <CategoryGrid categories={catalogSectionCategories} />
      </section>

      <div className="hidden md:block">
        <DealBanner />
      </div>

      <section className="space-y-5">
        <div className="space-y-2">
          {homeFeatured.badgeText ? <Badge variant="outline" className="w-fit">{homeFeatured.badgeText}</Badge> : null}
          <h2 className="hidden text-3xl font-semibold tracking-tight sm:block">{homeFeatured.title}</h2>
          {homeFeatured.description ? (
            <p className="hidden max-w-3xl text-sm leading-6 text-muted-foreground sm:block">{homeFeatured.description}</p>
          ) : null}
        </div>
        <ProductGrid products={featuredProducts} />
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className={`space-y-4 rounded-[1.8rem] border border-white/70 p-5 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] ${gradientByTheme(homeNewArrivals.themeKey)}`}>
          <div className="space-y-2">
            {homeNewArrivals.badgeText ? <Badge className="w-fit bg-foreground text-white">{homeNewArrivals.badgeText}</Badge> : null}
            <h2 className="text-2xl font-semibold tracking-tight">{homeNewArrivals.title}</h2>
            {homeNewArrivals.description ? (
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{homeNewArrivals.description}</p>
            ) : null}
          </div>
          <CompactProductPreview products={newArrivals} emptyMessage="No new arrivals are published yet." />
        </div>

        <div className={`space-y-4 rounded-[1.8rem] border border-white/70 p-5 shadow-[0_24px_60px_-44px_rgba(40,28,18,0.25)] ${gradientByTheme(homeBestsellers.themeKey)}`}>
          <div className="space-y-2">
            {homeBestsellers.badgeText ? <Badge className="w-fit bg-foreground text-white">{homeBestsellers.badgeText}</Badge> : null}
            <h2 className="text-2xl font-semibold tracking-tight">{homeBestsellers.title}</h2>
            {homeBestsellers.description ? (
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{homeBestsellers.description}</p>
            ) : null}
          </div>
          <CompactProductPreview products={bestsellingProducts} emptyMessage="No best sellers are published yet." />
        </div>
      </section>

      <section className="space-y-5">
        <div className="space-y-2">
          {homeFeaturedLabels.badgeText ? <Badge variant="outline" className="w-fit">{homeFeaturedLabels.badgeText}</Badge> : null}
          <h2 className="text-3xl font-semibold tracking-tight">{homeFeaturedLabels.title}</h2>
          {homeFeaturedLabels.description ? (
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{homeFeaturedLabels.description}</p>
          ) : null}
        </div>
        <VendorCarousel vendors={featuredBrands.length > 0 ? featuredBrands : brands} />
      </section>

      <section className="rounded-[2.4rem] border border-white/70 bg-[linear-gradient(135deg,#231712_0%,#3d241c_52%,#8e5d38_100%)] px-6 py-8 text-white shadow-[0_30px_90px_-54px_rgba(35,23,18,0.72)] sm:px-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-4">
            {homeCta.badgeText ? <Badge className="w-fit bg-white/12 text-white">{homeCta.badgeText}</Badge> : null}
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">{homeCta.title}</h2>
            {homeCta.description ? (
              <p className="max-w-2xl text-sm leading-7 text-white/78 sm:text-base">{homeCta.description}</p>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            {homeCta.primaryCtaLabel && homeCta.primaryCtaHref ? (
              <Button asChild size="lg" className="rounded-full bg-white px-7 text-black hover:bg-white/90">
                <Link to={homeCta.primaryCtaHref}>
                  {homeCta.primaryCtaLabel}
                  <ArrowRightIcon className="size-4" />
                </Link>
              </Button>
            ) : null}
            {homeCta.secondaryCtaLabel && homeCta.secondaryCtaHref ? (
              <Button asChild variant="outline" size="lg" className="rounded-full border-white/20 bg-transparent px-7 text-white hover:bg-white/10">
                <Link to={homeCta.secondaryCtaHref}>{homeCta.secondaryCtaLabel}</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {trustNotes.map((note) => (
          <button
            key={note.title}
            type="button"
            onClick={() => handleFeatureNoteClick(note.title)}
            className="group cursor-pointer rounded-[1.8rem] border border-white/70 bg-white/78 p-5 text-left shadow-[0_20px_50px_-40px_rgba(40,28,18,0.25)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-accent/28 hover:shadow-[0_26px_60px_-36px_rgba(40,28,18,0.34)] focus-visible:-translate-y-1 focus-visible:border-accent/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/20"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-background/88 transition-all duration-300 ease-out group-hover:bg-[var(--accent-bg)] group-hover:shadow-[0_12px_24px_-16px_color-mix(in_srgb,var(--color-accent)_55%,transparent)]">
                <note.icon className="size-5 text-foreground transition-all duration-300 ease-out group-hover:scale-110 group-hover:text-accent" />
              </div>
              <span className="pointer-events-none inline-flex items-center gap-1 text-xs font-medium tracking-[0.08em] text-accent opacity-0 transition-all duration-300 ease-out group-hover:translate-x-0.5 group-hover:opacity-100">
                Learn more
                <ArrowRightIcon className="size-3.5" />
              </span>
            </div>
            <h2 className="text-xl font-semibold tracking-tight transition-all duration-300 ease-out group-hover:-translate-y-0.5 group-hover:text-accent">
              {note.title}
            </h2>
            {note.description ? <p className="mt-2 text-sm leading-6 text-muted-foreground">{note.description}</p> : null}
          </button>
        ))}
      </section>
    </div>
  )
}
