import { useEffect, useState } from "react"

import type { CommonModuleSummaryListResponse } from "@core/shared"
import type {
  CommerceOrderListResponse,
  CommerceOrderWorkflowListResponse,
  CustomerHelpdeskDetailListResponse,
  CustomerHelpdeskListResponse,
  EcommercePricingSettingsResponse,
  ProductListResponse,
  StorefrontCatalogResponse,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { EcommerceWorkspaceTabs } from "./components/ecommerce-workspace-tabs"

type ResourceState<T> = {
  data: T | null
  error: string | null
  isLoading: boolean
}

async function fetchJson<T>(path: string): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers: accessToken
      ? {
          authorization: `Bearer ${accessToken}`,
        }
      : undefined,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`)
  }

  return (await response.json()) as T
}

function useJsonResource<T>(path: string): ResourceState<T> {
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      setState({ data: null, error: null, isLoading: true })

      try {
        const data = await fetchJson<T>(path)
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

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint: string
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  )
}

function OverviewSection() {
  const [state, setState] = useState<{
    products: ProductListResponse | null
    orders: CommerceOrderListResponse | null
    customers: CustomerHelpdeskListResponse | null
    settings: EcommercePricingSettingsResponse | null
    error: string | null
    isLoading: boolean
  }>({
    products: null,
    orders: null,
    customers: null,
    settings: null,
    error: null,
    isLoading: true,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [products, orders, customers, settings] = await Promise.all([
          fetchJson<ProductListResponse>("/internal/v1/ecommerce/products"),
          fetchJson<CommerceOrderListResponse>("/internal/v1/ecommerce/orders"),
          fetchJson<CustomerHelpdeskListResponse>("/internal/v1/ecommerce/customers"),
          fetchJson<EcommercePricingSettingsResponse>(
            "/internal/v1/ecommerce/settings/pricing"
          ),
        ])

        if (!cancelled) {
          setState({
            products,
            orders,
            customers,
            settings,
            error: null,
            isLoading: false,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            products: null,
            orders: null,
            customers: null,
            settings: null,
            error:
              error instanceof Error
                ? error.message
                : "Failed to load the ecommerce overview.",
            isLoading: false,
          })
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (state.isLoading) {
    return <StateCard message="Loading commerce overview." />
  }

  if (!state.products || !state.orders || !state.customers || !state.settings || state.error) {
    return <StateCard message={state.error ?? "Commerce overview data is unavailable."} />
  }

  const activeProducts = state.products.items.filter((item) => item.isActive).length

  return (
    <SectionShell
      title="Commerce Overview"
      description="Go-live catalog, customer, and order operations powered by the ecommerce app boundary."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Products"
          value={state.products.items.length}
          hint={`${activeProducts} active catalog products are ready for storefront projection.`}
        />
        <MetricCard
          label="Orders"
          value={state.orders.items.length}
          hint="Operational order records currently exposed by the workflow service."
        />
        <MetricCard
          label="Customers"
          value={state.customers.items.length}
          hint="Support-visible customer profiles linked to storefront orders."
        />
        <MetricCard
          label="Pricing Formula"
          value={`${state.settings.settings.purchaseToSellPercent}%`}
          hint={`Purchase-to-MRP baseline: ${state.settings.settings.purchaseToMrpPercent}%`}
        />
      </div>
    </SectionShell>
  )
}

function CatalogSection() {
  const { data, error, isLoading } =
    useJsonResource<ProductListResponse>("/internal/v1/ecommerce/products")

  if (isLoading) {
    return <StateCard message="Loading catalog." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Catalog data is unavailable."} />
  }

  return (
    <SectionShell
      title="Catalog"
      description="Product publishing and assortment records adopted into the ecommerce boundary."
    >
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Storefront</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.brandName ?? "Unbranded"} · {product.sku}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.categoryName ?? "Catalog"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {product.basePrice.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {product.homeSliderEnabled ? <Badge variant="outline">Hero</Badge> : null}
                      {product.featureSectionEnabled ? (
                        <Badge variant="outline">Feature</Badge>
                      ) : null}
                      {product.promoSliderEnabled ? (
                        <Badge variant="outline">Promo</Badge>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </SectionShell>
  )
}

function StorefrontSection() {
  const { data, error, isLoading } =
    useJsonResource<StorefrontCatalogResponse>("/public/v1/storefront/catalog")

  if (isLoading) {
    return <StateCard message="Loading storefront projection." />
  }

  if (error || !data) {
    return <StateCard message={error ?? "Storefront data is unavailable."} />
  }

  return (
    <SectionShell
      title="Storefront"
      description="Public storefront projection served from the ecommerce backend surface."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Categories"
          value={data.categories.length}
          hint="Public menu and catalog groupings derived from active products."
        />
        <MetricCard
          label="Brands"
          value={data.brands.length}
          hint="Public brand rails generated from storefront-ready products."
        />
        <MetricCard
          label="Reviews"
          value={data.reviews.length}
          hint="Storefront review records exposed to shopper-facing surfaces."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Catalog Products</CardTitle>
          <CardDescription>Public-facing product cards derived from the storefront route.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data.products.slice(0, 3).map((product) => (
            <div
              key={product.id}
              className="rounded-xl border border-border/70 bg-card/70 p-4"
            >
              <div className="overflow-hidden rounded-xl border border-border/70 bg-muted/30">
                <img
                  src={product.images[0] ?? ""}
                  alt={product.name}
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap gap-2">
                  {product.catalogBadge ? <Badge variant="outline">{product.catalogBadge}</Badge> : null}
                  <Badge variant="outline">{product.department}</Badge>
                </div>
                <p className="font-medium text-foreground">{product.name}</p>
                <p className="text-sm text-muted-foreground">
                  {product.brand} · {product.categoryName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Rs. {product.price.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-start">
        <Button asChild>
          <a href="/public/v1/storefront/catalog" target="_blank" rel="noreferrer">
            Open public catalog JSON
          </a>
        </Button>
      </div>
    </SectionShell>
  )
}

function OrdersSection() {
  const workflows = useJsonResource<CommerceOrderWorkflowListResponse>(
    "/internal/v1/ecommerce/order-workflows"
  )

  if (workflows.isLoading) {
    return <StateCard message="Loading order workflows." />
  }

  if (workflows.error || !workflows.data) {
    return <StateCard message={workflows.error ?? "Order data is unavailable."} />
  }

  return (
    <SectionShell
      title="Orders"
      description="Operational order workflows with shipment and invoice state."
    >
      <Accordion type="single" collapsible className="space-y-3">
        {workflows.data.items.map((workflow) => (
          <AccordionItem
            key={workflow.order.id}
            value={workflow.order.id}
            className="rounded-xl border border-border/70 bg-card/70 px-4"
          >
            <AccordionTrigger>
              <div className="flex flex-col items-start gap-1 text-left">
                <p className="font-medium text-foreground">{workflow.order.orderNumber}</p>
                <p className="text-sm text-muted-foreground">
                  {workflow.order.firstName} {workflow.order.lastName} · {workflow.order.status}
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Total"
                  value={`Rs. ${workflow.order.totalAmount.toLocaleString("en-IN")}`}
                  hint={`Payment: ${workflow.order.paymentStatus}`}
                />
                <MetricCard
                  label="Shipment"
                  value={workflow.shipment?.status ?? "Pending"}
                  hint={workflow.shipment?.trackingNumber ?? "No tracking number yet."}
                />
                <MetricCard
                  label="Invoice"
                  value={workflow.invoice?.status ?? "Pending"}
                  hint={workflow.invoice?.invoiceNumber ?? "Invoice not issued yet."}
                />
              </div>
              <div className="space-y-2">
                {workflow.events.map((event) => (
                  <div
                    key={event.id}
                    className="rounded-xl border border-border/70 bg-background/80 p-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-muted-foreground">{event.description ?? "No description"}</p>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  )
}

function CustomersSection() {
  const customers = useJsonResource<CustomerHelpdeskDetailListResponse>(
    "/internal/v1/ecommerce/customer-details"
  )

  if (customers.isLoading) {
    return <StateCard message="Loading customer helpdesk records." />
  }

  if (customers.error || !customers.data) {
    return <StateCard message={customers.error ?? "Customer data is unavailable."} />
  }

  return (
    <SectionShell
      title="Customers"
      description="Customer helpdesk records including delivery addresses, issues, and linked orders."
    >
      <Accordion type="single" collapsible className="space-y-3">
        {customers.data.items.map((detail) => (
          <AccordionItem
            key={detail.customer.id}
            value={detail.customer.id}
            className="rounded-xl border border-border/70 bg-card/70 px-4"
          >
            <AccordionTrigger>
              <div className="flex flex-col items-start gap-1 text-left">
                <p className="font-medium text-foreground">{detail.customer.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  {detail.customer.email} · {detail.customer.orderCount} order(s)
                </p>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <MetricCard
                  label="Total spent"
                  value={`Rs. ${detail.customer.totalSpent.toLocaleString("en-IN")}`}
                  hint={detail.customer.defaultAddressSummary ?? "No default address"}
                />
                <MetricCard
                  label="Issues"
                  value={detail.issues.length}
                  hint={detail.issues[0]?.title ?? "No active issues."}
                />
              </div>
              <div className="space-y-2">
                {detail.issues.length === 0 ? (
                  <StateCard message="No support issues are currently flagged for this customer." />
                ) : (
                  detail.issues.map((issue) => (
                    <div
                      key={issue.code}
                      className="rounded-xl border border-border/70 bg-background/80 p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{issue.severity}</Badge>
                        <p className="font-medium text-foreground">{issue.title}</p>
                      </div>
                      <p className="mt-2 text-muted-foreground">{issue.description}</p>
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </SectionShell>
  )
}

function SettingsSection() {
  const pricing = useJsonResource<EcommercePricingSettingsResponse>(
    "/internal/v1/ecommerce/settings/pricing"
  )
  const dependencies = useJsonResource<CommonModuleSummaryListResponse>(
    "/internal/v1/core/common-modules/summary"
  )

  if (pricing.isLoading || dependencies.isLoading) {
    return <StateCard message="Loading commerce settings." />
  }

  if (pricing.error || dependencies.error || !pricing.data || !dependencies.data) {
    return (
      <StateCard
        message={pricing.error ?? dependencies.error ?? "Commerce settings are unavailable."}
      />
    )
  }

  const requiredKeys = new Set([
    "productCategories",
    "brands",
    "storefrontTemplates",
    "sliderThemes",
    "warehouses",
  ])

  const requiredDependencies = dependencies.data.items.filter((item) =>
    requiredKeys.has(item.key)
  )

  return (
    <SectionShell
      title="Settings"
      description="Commerce pricing defaults and shared master dependencies required for storefront delivery."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <MetricCard
          label="Purchase to Sell"
          value={`${pricing.data.settings.purchaseToSellPercent}%`}
          hint="Default selling uplift for pricing baselines."
        />
        <MetricCard
          label="Purchase to MRP"
          value={`${pricing.data.settings.purchaseToMrpPercent}%`}
          hint="Default MRP uplift for catalog publishing."
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Core Dependencies</CardTitle>
          <CardDescription>
            Shared masters that the ecommerce workspace expects from core.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {requiredDependencies.map((dependency) => (
            <div
              key={dependency.key}
              className="rounded-xl border border-border/70 bg-card/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-foreground">{dependency.label}</p>
                <Badge variant={dependency.itemCount > 0 ? "default" : "outline"}>
                  {dependency.itemCount > 0 ? "Ready" : "Empty"}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {dependency.activeCount} active records available.
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function EcommerceWorkspaceSection({ sectionId }: { sectionId?: string }) {
  return (
    <EcommerceWorkspaceTabs
      sectionId={sectionId}
      sections={{
        overview: <OverviewSection />,
        catalog: <CatalogSection />,
        storefront: <StorefrontSection />,
        orders: <OrdersSection />,
        customers: <CustomersSection />,
        settings: <SettingsSection />,
      }}
    />
  )
}
