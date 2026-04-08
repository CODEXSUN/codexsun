import { useEffect, useState } from "react"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, CreditCard, LayoutTemplate, Package, ShoppingBag, Users } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import type { ProductListResponse } from "@core/shared"
import type { ProductResponse } from "@core/shared"
import type { StorefrontOverviewKpiReport } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import {
  CommonModulesSection as ExactCoreCommonModulesSection,
  ProductShowSection as ExactCoreProductShowSection,
  ProductsSection as ExactCoreProductsSection,
} from "@core/web/src/workspace-sections"
import { getCoreCommonModuleMenuItem } from "@core/shared"
import { MasterList } from "@/components/blocks/master-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { ProductUpsertSection as CoreProductUpsertSection } from "@core/web/src/features/product/product-upsert-section"
import { HomeSliderSection } from "./features/storefront-admin/home-slider-section"
import { StorefrontCampaignSection as StorefrontCampaignDesignerSection } from "./features/storefront-admin/storefront-campaign-section"
import { StorefrontCouponBannerSection } from "./features/storefront-admin/storefront-coupon-banner-section"
import { StorefrontFooterSection } from "./features/storefront-admin/storefront-footer-section"
import { StorefrontFloatingContactSection } from "./features/storefront-admin/storefront-floating-contact-section"
import { StorefrontPickupSection } from "./features/storefront-admin/storefront-pickup-section"
import { StorefrontGiftCornerSection } from "./features/storefront-admin/storefront-gift-corner-section"
import { StorefrontBrandShowcaseSection } from "./features/storefront-admin/storefront-brand-showcase-section"
import { StorefrontCommunicationsSection } from "./features/storefront-admin/storefront-communications-section"
import {
  StorefrontCustomerShowSection,
  StorefrontCustomersSection,
  StorefrontCustomerUpsertSection,
} from "./features/storefront-admin/storefront-customers-section"
import { StorefrontOrdersSection } from "./features/storefront-admin/storefront-orders-section"
import { StorefrontPaymentsSection } from "./features/storefront-admin/storefront-payments-section"
import { StorefrontSupportSection } from "./features/storefront-admin/storefront-support-section"
import { StorefrontTrendingSectionSection } from "./features/storefront-admin/storefront-trending-section"
import { useStorefrontDesignerAccess } from "./features/storefront-admin/storefront-designer-access"
import { ShippingSettingsSection } from "./features/storefront-admin/shipping-settings-section"
import { EcommerceSettingsSection } from "./features/storefront-admin/ecommerce-settings-section"
import { StorefrontSettingsSection } from "./features/storefront-admin/storefront-settings-section"

import { storefrontPaths } from "./lib/storefront-routes"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

type StatusFilterValue = "all" | "active" | "inactive"

function matchesStatusFilter(statusFilter: StatusFilterValue, isActive: boolean) {
  if (statusFilter === "all") {
    return true
  }

  return statusFilter === "active" ? isActive : !isActive
}

function buildStatusFilters(
  statusFilter: StatusFilterValue,
  onChange: (value: StatusFilterValue) => void
) {
  return {
    options: [
      {
        key: "all",
        label: "All products",
        isActive: statusFilter === "all",
        onSelect: () => onChange("all"),
      },
      {
        key: "active",
        label: "Active only",
        isActive: statusFilter === "active",
        onSelect: () => onChange("active"),
      },
      {
        key: "inactive",
        label: "Inactive only",
        isActive: statusFilter === "inactive",
        onSelect: () => onChange("inactive"),
      },
    ],
    activeFilters:
      statusFilter === "all"
        ? []
        : [
            {
              key: "status",
              label: "Status",
              value: statusFilter === "active" ? "Active only" : "Inactive only",
            },
          ],
    onRemoveFilter: (key: string) => {
      if (key === "status") {
        onChange("all")
      }
    },
    onClearAllFilters: () => onChange("all"),
  }
}

async function requestJson<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null
    const message =
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    throw new Error(message)
  }

  return (await response.json()) as T
}

function useJsonResource<T>(path: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })
  useGlobalLoading(state.isLoading)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await requestJson<T>(path)
        if (!cancelled) {
          setState({ data, error: null, isLoading: false })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            data: null,
            error: error instanceof Error ? error.message : "Failed to load section data.",
            isLoading: false,
          })
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [path])

  return state
}

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardHeader>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          {eyebrow}
        </p>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="max-w-3xl text-sm leading-7">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function MetricCard({
  icon: Icon,
  title,
  summary,
}: {
  icon: LucideIcon
  title: string
  summary: string
}) {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-3 p-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
          <Icon className="size-5 text-accent" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

function ActionLink({
  href,
  label,
}: {
  href: string
  label: string
}) {
  return (
    <Button asChild variant="outline" className="justify-between rounded-full">
      <Link to={href} className="gap-2">
        {label}
        <ArrowUpRight className="size-4" />
      </Link>
    </Button>
  )
}

function LoadingStateCard({ message }: { message: string }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="h-4 w-36 animate-pulse rounded bg-muted" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="space-y-3 rounded-2xl border border-border/70 bg-card/70 p-4"
            >
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted/80" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-muted/80" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function OverviewSection() {
  const { canViewStorefrontDesigner } = useStorefrontDesignerAccess()
  const { data, error, isLoading } = useJsonResource<StorefrontOverviewKpiReport>(
    "/internal/v1/ecommerce/overview-report"
  )

  if (isLoading) {
    return <LoadingStateCard message="Loading ecommerce dashboard KPIs..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Ecommerce KPI data is unavailable."} />
  }

  const kpis = data.summary

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Ecommerce"
        title="Commerce admin overview"
        description="The ecommerce app owns storefront delivery, customer accounts, checkout, orders, tracking, and payment behavior. Shared products and contacts stay in core, while this overview concentrates the current commerce KPI baseline."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={ShoppingBag}
          title="Order count"
          summary={`${kpis.orderCount} total orders are currently tracked in ecommerce.`}
        />
        <MetricCard
          icon={CreditCard}
          title="Paid vs failed"
          summary={`${kpis.paidOrderCount} paid orders, ${kpis.failedOrderCount} failed orders, and ${kpis.pendingOrderCount} pending orders need tracking.`}
        />
        <MetricCard
          icon={LayoutTemplate}
          title="Conversion and AOV"
          summary={`${kpis.conversionRate.toFixed(1)}% paid-order conversion with ${formatMoney(kpis.averageOrderValue, data.currency)} average order value.`}
        />
        <MetricCard
          icon={Package}
          title="Fulfilment aging"
          summary={`${kpis.fulfilmentAgingCount} active fulfilment items, with ${kpis.fulfilmentOver72HoursCount} older than 72 hours.`}
        />
        <MetricCard
          icon={Users}
          title="Refund aging"
          summary={`${kpis.refundAgingCount} active refund items, with ${kpis.refundOver72HoursCount} older than 72 hours.`}
        />
        <MetricCard
          icon={CreditCard}
          title="Finance focus"
          summary="Use the payments workspace for settlement visibility, failed-payment recovery, refund exports, and aging drill-down."
        />
      </div>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Operational focus</CardTitle>
          <CardDescription>
            Work revenue leakage first, then aging fulfilment and refund backlogs.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Revenue capture
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Conversion is {kpis.conversionRate.toFixed(1)}%, with {kpis.failedOrderCount} failed orders still reducing captured revenue.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Fulfilment backlog
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {kpis.fulfilmentOver72HoursCount} fulfilment items have crossed 72 hours and should be escalated before routine packing work.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Refund backlog
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {kpis.refundOver72HoursCount} refund items are older than 72 hours and should be reviewed with support and settlement queues.
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>KPI destinations</CardTitle>
          <CardDescription>
            Move from the overview into the detailed commerce operations queues.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionLink href="/dashboard/apps/ecommerce/payments" label="Open payments operations" />
          <ActionLink href="/dashboard/apps/ecommerce/orders" label="Open order queue" />
          <ActionLink href="/dashboard/apps/ecommerce/support" label="Open support queue" />
          <ActionLink href={storefrontPaths.trackOrder()} label="Track order page" />
        </CardContent>
      </Card>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>
            Open the public commerce flow without leaving the admin workspace context.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionLink href={storefrontPaths.home()} label="Open storefront" />
          {canViewStorefrontDesigner ? (
            <ActionLink href="/dashboard/apps/ecommerce/home-slider" label="Home slider designer" />
          ) : null}
          <ActionLink href={storefrontPaths.catalog()} label="Open catalog" />
          <ActionLink href={storefrontPaths.accountLogin()} label="Customer login" />
        </CardContent>
      </Card>
    </div>
  )
}

function StorefrontSection() {
  return <StorefrontSettingsSection />
}

function HomeSliderDesignerSection() {
  return <HomeSliderSection />
}

function CampaignDesignerSection() {
  return <StorefrontCampaignDesignerSection />
}

function CouponBannerDesignerSection() {
  return <StorefrontCouponBannerSection />
}

function GiftCornerDesignerSection() {
  return <StorefrontGiftCornerSection />
}

function PickupDesignerSection() {
  return <StorefrontPickupSection />
}

function TrendingSectionDesignerSection() {
  return <StorefrontTrendingSectionSection />
}

function BrandShowcaseDesignerSection() {
  return <StorefrontBrandShowcaseSection />
}

function ProductsSection() {
  return <ExactCoreProductsSection routeBase="/dashboard/apps/ecommerce/products" />

  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { data, error, isLoading } = useJsonResource<ProductListResponse>("/internal/v1/core/products")

  if (isLoading) {
    return <LoadingStateCard message="Loading core products used by ecommerce..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Product data is unavailable."} />
  }

  const safeData = data!
  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredProducts = safeData.items.filter((product) => {
    const matchesSearch = [
      product.code,
      product.name,
      product.sku,
      product.brandName ?? "",
      product.categoryName ?? "",
      product.tagNames.join(" "),
    ].some((value) => value.toLowerCase().includes(normalizedSearch))

    return matchesSearch && matchesStatusFilter(statusFilter, product.isActive)
  })

  const totalRecords = filteredProducts.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )
  const activeProducts = safeData.items.filter((product) => product.isActive).length
  const merchandisedProducts = safeData.items.filter(
    (product) =>
      product.homeSliderEnabled ||
      product.promoSliderEnabled ||
      product.featureSectionEnabled ||
      product.isNewArrival ||
      product.isBestSeller ||
      product.isFeaturedLabel
  ).length
  const storefrontReadyProducts = safeData.items.filter(
    (product) => product.isActive && Boolean(product.slug) && Boolean(product.primaryImageUrl)
  ).length

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Products"
        title="Core products consumed by ecommerce"
        description="Products remain owned by core. Ecommerce reads those product masters and uses their merchandising, category, pricing, image, and storefront metadata to shape discovery, PDP, cart, and checkout behavior."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          icon={Package}
          title="Shared products"
          summary={`${safeData.items.length} total shared products are available to the ecommerce storefront boundary.`}
        />
        <MetricCard
          icon={LayoutTemplate}
          title="Storefront-ready"
          summary={`${storefrontReadyProducts} active products already have slug and primary image data for storefront delivery.`}
        />
        <MetricCard
          icon={ShoppingBag}
          title="Merchandised"
          summary={`${merchandisedProducts} products currently carry ecommerce-facing merchandising flags or feature placement.`}
        />
      </div>
      <MasterList
        header={{
          pageTitle: "Products",
          pageDescription:
            "Review the core product masters ecommerce currently consumes. Create or edit shared products in core, then return here to validate their ecommerce-facing merchandising fields.",
          addLabel: "New Product",
          onAddClick: () => {
            void navigate("/dashboard/apps/ecommerce/products/new")
          },
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search products, brands, categories, or tags",
        }}
        filters={buildStatusFilters(statusFilter, (value) => {
          setStatusFilter(value)
          setCurrentPage(1)
        })}
        table={{
          columns: [
            {
              id: "product",
              header: "Product",
              sortable: true,
              accessor: (product) => `${product.code} ${product.name} ${product.sku}`,
              cell: (product) => (
                <button
                  type="button"
                  className="text-left"
                  onClick={() => {
                    void navigate(`/dashboard/apps/ecommerce/products/${encodeURIComponent(product.id)}`)
                  }}
                >
                  <p className="font-medium text-foreground hover:underline hover:underline-offset-2">
                    {product.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.code} {product.sku ? `• ${product.sku}` : ""}
                  </p>
                </button>
              ),
            },
            {
              id: "classification",
              header: "Classification",
              sortable: true,
              accessor: (product) =>
                `${product.categoryName ?? ""} ${product.productGroupName ?? ""} ${product.brandName ?? ""}`,
              cell: (product) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{product.categoryName ?? "-"}</p>
                  <p>{product.brandName ?? "-"}</p>
                </div>
              ),
            },
            {
              id: "pricing",
              header: "Pricing",
              sortable: true,
              accessor: (product) => product.basePrice,
              cell: (product) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Selling: {product.basePrice.toLocaleString("en-IN")}</p>
                  <p>Cost: {product.costPrice.toLocaleString("en-IN")}</p>
                </div>
              ),
            },
            {
              id: "ecommerce",
              header: "Ecommerce",
              sortable: true,
              accessor: (product) =>
                `${product.storefrontDepartment ?? ""} ${product.tagNames.join(" ")}`,
              cell: (product) => (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {product.storefrontDepartment ?? "No department"}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {product.isNewArrival ? <Badge variant="secondary">New arrival</Badge> : null}
                    {product.isBestSeller ? <Badge variant="secondary">Best seller</Badge> : null}
                    {product.isFeaturedLabel ? <Badge variant="secondary">Featured</Badge> : null}
                    {product.homeSliderEnabled ? <Badge variant="outline">Home slider</Badge> : null}
                    {product.featureSectionEnabled ? <Badge variant="outline">Feature rail</Badge> : null}
                    {!product.isNewArrival &&
                    !product.isBestSeller &&
                    !product.isFeaturedLabel &&
                    !product.homeSliderEnabled &&
                    !product.featureSectionEnabled ? (
                      <Badge variant="outline">Standard</Badge>
                    ) : null}
                  </div>
                </div>
              ),
            },
            {
              id: "storefront",
              header: "Storefront",
              cell: (product) => (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      void navigate(`/dashboard/apps/ecommerce/products/${encodeURIComponent(product.id)}`)
                    }}
                  >
                    Core master
                  </Button>
                  <Button asChild variant="outline" className="h-8 rounded-full px-3 text-xs">
                    <Link to={storefrontPaths.product(product.slug)}>
                      PDP
                    </Link>
                  </Button>
                </div>
              ),
            },
            {
              id: "status",
              header: "Status",
              sortable: true,
              accessor: (product) => (product.isActive ? "active" : "inactive"),
              cell: (product) => (
                <Badge variant={product.isActive ? "secondary" : "outline"}>
                  {product.isActive ? "Active" : "Inactive"}
                </Badge>
              ),
            },
          ],
          data: paginatedProducts,
          emptyMessage: "No products found for ecommerce.",
          rowKey: (product) => product.id,
        }}
        footer={{
          content: (
            <div className="flex flex-wrap items-center gap-4">
              <span>
                Total products: <span className="font-medium text-foreground">{totalRecords}</span>
              </span>
              <span>
                Active products: <span className="font-medium text-foreground">{activeProducts}</span>
              </span>
            </div>
          ),
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: setCurrentPage,
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100, 200],
        }}
      />
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Product actions</CardTitle>
          <CardDescription>
            Ecommerce consumes the shared product master. Use core for product authoring and the storefront for public validation.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionLink href="/dashboard/apps/ecommerce/products" label="Open ecommerce products" />
          <ActionLink href="/dashboard/apps/ecommerce/products/new" label="Create product" />
          <ActionLink href={storefrontPaths.catalog()} label="Open storefront catalog" />
        </CardContent>
      </Card>
    </div>
  )
}

function ProductShowSection({ productId }: { productId: string }) {
  return (
    <ExactCoreProductShowSection
      productId={productId}
      routeBase="/dashboard/apps/ecommerce/products"
    />
  )

  const navigate = useNavigate()
  const { data, error, isLoading } = useJsonResource<ProductResponse>(
    `/internal/v1/core/product?id=${encodeURIComponent(productId)}`
  )

  if (isLoading) {
    return <LoadingStateCard message="Loading ecommerce product detail..." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Product detail is unavailable."} />
  }

  const product = data!.item

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Products"
        title={product.name}
        description="This product remains owned by core, but you are reviewing it inside ecommerce because its merchandising, pricing, imagery, and storefront metadata directly drive the shopping experience."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Package}
          title="SKU and code"
          summary={`${product.code} • ${product.sku}`}
        />
        <MetricCard
          icon={CreditCard}
          title="Pricing"
          summary={`Selling ${product.basePrice.toLocaleString("en-IN")} and cost ${product.costPrice.toLocaleString("en-IN")}.`}
        />
        <MetricCard
          icon={LayoutTemplate}
          title="Storefront"
          summary={product.storefrontDepartment ? `Placed in ${product.storefrontDepartment}.` : "No storefront department assigned yet."}
        />
        <MetricCard
          icon={ShoppingBag}
          title="Variants"
          summary={`${product.variantCount} variants and ${product.tagCount} tags available for commerce use.`}
        />
      </div>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Commerce-facing details</CardTitle>
          <CardDescription>
            The ecommerce storefront consumes these shared core product attributes directly.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Classification
            </p>
            <p className="text-sm text-foreground">{product.categoryName ?? "-"}</p>
            <p className="text-sm text-muted-foreground">{product.brandName ?? "-"}</p>
          </div>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Merchandising
            </p>
            <div className="flex flex-wrap gap-1">
              {product.homeSliderEnabled ? <Badge variant="outline">Home slider</Badge> : null}
              {product.promoSliderEnabled ? <Badge variant="outline">Promo slider</Badge> : null}
              {product.featureSectionEnabled ? <Badge variant="outline">Feature rail</Badge> : null}
              {product.isNewArrival ? <Badge variant="secondary">New arrival</Badge> : null}
              {product.isBestSeller ? <Badge variant="secondary">Best seller</Badge> : null}
              {product.isFeaturedLabel ? <Badge variant="secondary">Featured</Badge> : null}
              {!product.homeSliderEnabled &&
              !product.promoSliderEnabled &&
              !product.featureSectionEnabled &&
              !product.isNewArrival &&
              !product.isBestSeller &&
              !product.isFeaturedLabel ? (
                <Badge variant="outline">Standard</Badge>
              ) : null}
            </div>
          </div>
          <div className="space-y-2 rounded-2xl border border-border/70 bg-card/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Status
            </p>
            <Badge variant={product.isActive ? "secondary" : "outline"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
            <p className="text-sm text-muted-foreground">
              {product.primaryImageUrl ? "Primary image is present for storefront rendering." : "Primary image is missing."}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActionLink href="/dashboard/apps/ecommerce/products" label="Back to products" />
          <ActionLink href={`/dashboard/apps/ecommerce/products/${encodeURIComponent(product.id)}/edit`} label="Edit in ecommerce" />
          <ActionLink href={storefrontPaths.product(product.slug)} label="Open PDP" />
          <Button
            type="button"
            variant="outline"
            className="justify-between rounded-full"
            onClick={() => {
              void navigate(`/dashboard/apps/ecommerce/products/${encodeURIComponent(product.id)}/edit`)
            }}
          >
            Edit product
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function ProductUpsertSection({ productId }: { productId?: string }) {
  return (
    <CoreProductUpsertSection
      commonRouteBase="/dashboard/apps/ecommerce"
      productId={productId}
      routeBase="/dashboard/apps/ecommerce/products"
    />
  )
}

function CustomersSection() {
  return <StorefrontCustomersSection />
}

function CustomerShowSection({ customerId }: { customerId: string }) {
  return <StorefrontCustomerShowSection customerId={customerId} />
}

function CustomerUpsertSection({ customerId }: { customerId: string }) {
  return <StorefrontCustomerUpsertSection customerId={customerId} />
}

function OrdersSection() {
  return <StorefrontOrdersSection />
}

function CommunicationsSection() {
  return <StorefrontCommunicationsSection />
}

function SupportSection() {
  return <StorefrontSupportSection />
}

function PaymentsSection() {
  return <StorefrontPaymentsSection />
}

function CheckoutSection() {
  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Checkout"
        title="Cart and payment flow"
        description="Cart state lives in the ecommerce frontend, shipping totals derive from ecommerce storefront settings, and checkout hands off to Razorpay or mock verification depending on runtime config."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          icon={ShoppingBag}
          title="Cart UX"
          summary="Cart drawer and dedicated cart page both lead into the same checkout flow and subtotal logic."
        />
        <MetricCard
          icon={CreditCard}
          title="Gateway readiness"
          summary="Razorpay keys and enablement stay in runtime settings. Missing keys keep the local mock checkout path available."
        />
      </div>
      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <CardTitle>Commerce actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <ActionLink href={storefrontPaths.cart()} label="Open cart" />
          <ActionLink href={storefrontPaths.checkout()} label="Open checkout" />
          <ActionLink href="/dashboard/settings/core-settings" label="Runtime settings" />
        </CardContent>
      </Card>
    </div>
  )
}

function SettingsSection() {
  return <EcommerceSettingsSection />
}

export function EcommerceWorkspaceSection({
  customerId,
  productId,
  sectionId,
}: {
  customerId?: string
  productId?: string
  sectionId?: string
}) {
  const commonModuleMenuItem = sectionId ? getCoreCommonModuleMenuItem(sectionId) : null

  switch (sectionId ?? "overview") {
    case "storefront":
      return <StorefrontSection />
    case "home-slider":
      return <HomeSliderDesignerSection />
    case "campaign":
      return <CampaignDesignerSection />
    case "coupon-banner":
      return <CouponBannerDesignerSection />
    case "gift-corner":
      return <GiftCornerDesignerSection />
    case "trending":
      return <TrendingSectionDesignerSection />
    case "branding":
      return <BrandShowcaseDesignerSection />
    case "products":
      return <ProductsSection />
    case "products-show":
      return productId ? <ProductShowSection productId={productId} /> : null
    case "products-upsert":
      return <ProductUpsertSection productId={productId} />
    case "catalog":
      return <ProductsSection />
    case "customers":
      return <CustomersSection />
    case "customers-show":
      return customerId ? <CustomerShowSection customerId={customerId} /> : null
    case "customers-upsert":
      return customerId ? <CustomerUpsertSection customerId={customerId} /> : null
    case "support":
      return <SupportSection />
    case "communications":
      return <CommunicationsSection />
    case "orders":
      return <OrdersSection />
    case "payments":
      return <PaymentsSection />
    case "checkout":
      return <CheckoutSection />
    case "shipping":
      return <ShippingSettingsSection />
    case "footer":
      return <StorefrontFooterSection />
    case "floating-contact":
      return <StorefrontFloatingContactSection />
    case "pickup":
      return <PickupDesignerSection />
    case "settings":
      return <SettingsSection />
    case "overview":
      return <OverviewSection />
    default:
      return commonModuleMenuItem ? (
        <ExactCoreCommonModulesSection
          moduleKey={commonModuleMenuItem.key}
          routeBase="/dashboard/apps/ecommerce"
        />
      ) : null
  }
}
