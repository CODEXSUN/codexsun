import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ArrowRight,
  Blocks,
  Boxes,
  Building2,
  PackageCheck,
  PlugZap,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react"
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"

import type { DemoInstallJob, DemoInstallJobPayload, DemoInstallTarget, DemoInstallVariant, DemoModuleSummary, DemoSummaryResponse } from "@demo/shared"
import { queryKeys } from "@cxapp/web/src/query/query-keys"
import { demoApi } from "./api/demo-api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

type InstallJobRequest = {
  target: DemoInstallTarget
  variant: DemoInstallVariant
  count?: number
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
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
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
  title,
  value,
  detail,
}: {
  title: string
  value: string
  detail: string
}) {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function LoadingState() {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-border/70 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-muted" />
            <div className="h-7 w-16 animate-pulse rounded bg-muted/90" />
            <div className="h-3 w-full animate-pulse rounded bg-muted/70" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ModuleCard({
  module,
  icon: Icon,
}: {
  module: DemoModuleSummary
  icon: typeof Building2
}) {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{module.name}</p>
            <p className="text-sm leading-6 text-muted-foreground">{module.summary}</p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-2xl bg-accent/10">
            <Icon className="size-5 text-accent" />
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current</p>
            <p className="mt-1 text-lg font-semibold">{module.currentCount}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Default</p>
            <p className="mt-1 text-lg font-semibold">{module.defaultCount}</p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Demo</p>
            <p className="mt-1 text-lg font-semibold">{module.demoCount}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            {module.supportsDemo ? "Demo extras available" : "Default fallback only"}
          </Badge>
          {module.items.length > 0 ? (
            <Badge variant="secondary">{module.items.length} sub sections</Badge>
          ) : null}
        </div>
        {module.items.length > 0 ? (
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {module.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/70 bg-card/60 p-3">
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Current {item.currentCount} · Default {item.defaultCount} · Demo {item.demoCount}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function JobProgressCard({ job }: { job: DemoInstallJob }) {
  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Install progress</CardTitle>
        <CardDescription>{job.message}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Progress value={job.percent}>
          <ProgressLabel>{`${job.target} / ${job.variant}`}</ProgressLabel>
        </Progress>
        <p className="text-sm text-muted-foreground">{`${job.processed}/${job.total}`}</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{job.status}</Badge>
          <Badge variant="secondary">{job.percent}%</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function InstallActionCard({
  title,
  description,
  buttonLabel,
  defaultCount = 10,
  isRunning,
  onInstall,
}: {
  title: string
  description: string
  buttonLabel: string
  defaultCount?: number
  isRunning: boolean
  onInstall: (count: number) => void
}) {
  const [count, setCount] = useState(String(defaultCount))

  return (
    <Card className="rounded-[1.3rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Count
          </p>
          <Input
            inputMode="numeric"
            min={1}
            max={200}
            type="number"
            value={count}
            onChange={(event) => setCount(event.target.value)}
          />
        </div>
        <Button
          type="button"
          className="w-full justify-between rounded-full"
          disabled={isRunning}
          onClick={() => onInstall(Math.max(1, Number(count || 1)))}
        >
          {isRunning ? "Installing..." : buttonLabel}
          <ArrowRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  )
}

function useDemoSummary() {
  const queryClient = useQueryClient()
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [handledJobKey, setHandledJobKey] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: queryKeys.demoSummary,
    queryFn: () => demoApi.getSummary(),
  })

  const activeJobQuery = useQuery({
    queryKey: queryKeys.demoJob(activeJobId),
    enabled: activeJobId != null,
    queryFn: async () => {
      const response = await demoApi.getJob(activeJobId!)

      return response.item
    },
    refetchInterval: (query) => {
      const job = query.state.data as DemoInstallJob | undefined

      if (!job || job.status === "queued" || job.status === "running") {
        return 700
      }

      return false
    },
  })

  useGlobalLoading(summaryQuery.isLoading)

  useEffect(() => {
    const activeJob = activeJobQuery.data

    if (!activeJob?.finishedAt) {
      return
    }

    const jobKey = `${activeJob.id}:${activeJob.finishedAt}`

    if (handledJobKey === jobKey) {
      return
    }

    setHandledJobKey(jobKey)
    setMessage(activeJob.message)

    if (activeJob.status === "completed") {
      if (activeJob.summary) {
        queryClient.setQueryData(queryKeys.demoSummary, activeJob.summary)
      } else {
        void queryClient.invalidateQueries({ queryKey: queryKeys.demoSummary })
      }
      window.dispatchEvent(new CustomEvent("demo-summary-updated"))
    }
  }, [activeJobQuery.data, handledJobKey, queryClient])

  const startInstallMutation = useMutation({
    mutationFn: (payload: DemoInstallJobPayload) => demoApi.startJob(payload),
    onMutate: () => {
      setMessage(null)
    },
    onSuccess: (response) => {
      setActiveJobId(response.item.id)
      setHandledJobKey(null)
      queryClient.setQueryData(queryKeys.demoJob(response.item.id), response.item)
    },
    onError: (error) => {
      setMessage(error instanceof Error ? error.message : "Install failed.")
    },
  })

  async function startInstall(request: InstallJobRequest) {
    const payload: DemoInstallJobPayload = {
      target: request.target,
      variant: request.variant,
      count: request.count ?? 1,
    }

    await startInstallMutation.mutateAsync(payload)
  }

  return {
    data: summaryQuery.data ?? null,
    error:
      summaryQuery.error instanceof Error
        ? summaryQuery.error.message
        : activeJobQuery.error instanceof Error
          ? activeJobQuery.error.message
          : null,
    isLoading: summaryQuery.isLoading,
    activeJob: activeJobQuery.data ?? null,
    message,
    startInstall,
  }
}

const moduleIconMap = {
  companies: Building2,
  common: Blocks,
  contacts: Users,
  products: PackageCheck,
  categories: Boxes,
  customers: Users,
  orders: ShoppingBag,
  billing: ReceiptText,
  frappe: PlugZap,
} as const

function OverviewSection({
  summary,
  activeJob,
  message,
  startInstall,
}: {
  summary: DemoSummaryResponse
  activeJob: DemoInstallJob | null
  message: string | null
  startInstall: (request: InstallJobRequest) => void
}) {
  const modulesWithDemoExtras = summary.modules.filter((module) => module.supportsDemo).length

  return (
    <div className="space-y-4">
      <SectionIntro
        eyebrow="Demo"
        title="Suite demo-data control room"
        description="Install default or richer demo records into the current suite without breaking app ownership. Use page-level installers for contacts, products, categories, and customer accounts when you only want one slice."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Modules"
          value={String(summary.modules.length)}
          detail="Current suite modules tracked by the installer and summary view."
        />
        <MetricCard
          title="Profiles"
          value={String(summary.profiles.length)}
          detail="Default plus richer demo profile, both available from the same control surface."
        />
        <MetricCard
          title="Demo Extras"
          value={String(modulesWithDemoExtras)}
          detail="Modules that currently gain additional showcase data beyond the baseline profile."
        />
        <MetricCard
          title="Updated"
          value={new Date(summary.generatedAt).toLocaleTimeString("en-IN")}
          detail="Live counts refresh after every install action."
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <InstallActionCard
          title="Install default profile"
          description="Reset the suite to the baseline engineering dataset."
          buttonLabel="Install default"
          defaultCount={1}
          isRunning={activeJob?.status === "queued" || activeJob?.status === "running"}
          onInstall={() => startInstall({ target: "profile", variant: "default", count: 1 })}
        />
        <InstallActionCard
          title="Install demo profile"
          description="Install the richer walkthrough dataset with demo additions."
          buttonLabel="Install demo"
          defaultCount={1}
          isRunning={activeJob?.status === "queued" || activeJob?.status === "running"}
          onInstall={() => startInstall({ target: "profile", variant: "demo", count: 1 })}
        />
      </div>
      {activeJob ? <JobProgressCard job={activeJob} /> : null}
      {message ? <StateCard message={message} /> : null}
      <div className="grid gap-4 xl:grid-cols-2">
        {summary.modules.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            icon={moduleIconMap[module.id as keyof typeof moduleIconMap] ?? Sparkles}
          />
        ))}
      </div>
    </div>
  )
}

function ModuleSection({
  eyebrow,
  title,
  description,
  module,
  actions,
  activeJob,
  message,
}: {
  eyebrow: string
  title: string
  description: string
  module: DemoModuleSummary
  actions?: ReactNode
  activeJob: DemoInstallJob | null
  message: string | null
}) {
  return (
    <div className="space-y-4">
      <SectionIntro eyebrow={eyebrow} title={title} description={description} />
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard title="Current" value={String(module.currentCount)} detail="Live count from the current database." />
        <MetricCard title="Default" value={String(module.defaultCount)} detail="Projected count after installing the default profile." />
        <MetricCard title="Demo" value={String(module.demoCount)} detail="Projected count after installing the richer demo profile." />
      </div>
      {actions}
      {activeJob ? <JobProgressCard job={activeJob} /> : null}
      {message ? <StateCard message={message} /> : null}
      <ModuleCard
        module={module}
        icon={moduleIconMap[module.id as keyof typeof moduleIconMap] ?? Sparkles}
      />
    </div>
  )
}

export function DemoWorkspaceSection({ sectionId }: { sectionId?: string }) {
  const { activeJob, data, error, isLoading, message, startInstall } = useDemoSummary()
  const moduleMap = useMemo(
    () => new Map((data?.modules ?? []).map((module) => [module.id, module])),
    [data]
  )

  if (isLoading && !data) {
    return <LoadingState />
  }

  if (!data || error) {
    return <StateCard message={error ?? "Demo summary is unavailable."} />
  }
  const isRunning = activeJob?.status === "queued" || activeJob?.status === "running"

  switch (sectionId ?? "overview") {
    case "install":
    case "overview":
      return (
        <OverviewSection
          summary={data}
          activeJob={activeJob}
          message={message}
          startInstall={startInstall}
        />
      )
    case "contacts":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Contacts"
          description="Install customer or supplier demo contacts in controlled batches. The installer numbers names like customer-1 and supplier-1, while reusing the current suite masters for type references."
          module={moduleMap.get("contacts")!}
          activeJob={activeJob}
          message={message}
          actions={
            <div className="grid gap-4 md:grid-cols-2">
              <InstallActionCard
                title="Customer contacts"
                description="Create numbered customer contacts with customer reference naming."
                buttonLabel="Install customers"
                isRunning={isRunning}
                onInstall={(count) => startInstall({ target: "contacts", variant: "customer", count })}
              />
              <InstallActionCard
                title="Supplier contacts"
                description="Create numbered supplier contacts with supplier reference naming."
                buttonLabel="Install suppliers"
                isRunning={isRunning}
                onInstall={(count) => startInstall({ target: "contacts", variant: "supplier", count })}
              />
            </div>
          }
        />
      )
    case "products":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Products"
          description="Install numbered demo catalog products one by one, mapped against the currently available common product masters where possible."
          module={moduleMap.get("products")!}
          activeJob={activeJob}
          message={message}
          actions={
            <InstallActionCard
              title="Catalog products"
              description="Create new product-1, product-2 style records with random common-master mapping."
              buttonLabel="Install products"
              isRunning={isRunning}
              onInstall={(count) => startInstall({ target: "products", variant: "catalog", count })}
            />
          }
        />
      )
    case "categories":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Categories"
          description="Install numbered storefront categories into core common modules so the ecommerce top menu and catalog can pick them up immediately."
          module={moduleMap.get("categories")!}
          activeJob={activeJob}
          message={message}
          actions={
            <InstallActionCard
              title="Storefront categories"
              description="Create category-1, category-2 style common product categories with placeholder imagery."
              buttonLabel="Install categories"
              isRunning={isRunning}
              onInstall={(count) =>
                startInstall({ target: "categories", variant: "storefront", count })
              }
            />
          }
        />
      )
    case "customers":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Customers"
          description="Install ecommerce customer accounts in batches. Each account is linked through a numbered contact record so the portal and checkout flows have clean demo identities."
          module={moduleMap.get("customers")!}
          activeJob={activeJob}
          message={message}
          actions={
            <InstallActionCard
              title="Portal customers"
              description="Create customer portal accounts with linked numbered contact records."
              buttonLabel="Install customer accounts"
              isRunning={isRunning}
              onInstall={(count) => startInstall({ target: "customers", variant: "portal", count })}
            />
          }
        />
      )
    case "companies":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Companies"
          description="Preview company counts and compare what the default and demo profiles install into the cxapp company master."
          module={moduleMap.get("companies")!}
          activeJob={activeJob}
          message={message}
        />
      )
    case "common":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Common masters"
          description="Track the shared core common-module masters that feed the rest of the suite, including product, contact, location, and operations masters."
          module={moduleMap.get("common")!}
          activeJob={activeJob}
          message={message}
        />
      )
    case "orders":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Orders"
          description="Review ecommerce-owned order counts and compare the baseline profile with the richer demo order timeline set."
          module={moduleMap.get("orders")!}
          activeJob={activeJob}
          message={message}
        />
      )
    case "billing":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Billing"
          description="Review billing master and voucher counts prepared for accounting walkthroughs and ledger/report validation."
          module={moduleMap.get("billing")!}
          activeJob={activeJob}
          message={message}
        />
      )
    case "frappe":
      return (
        <ModuleSection
          eyebrow="Demo"
          title="Frappe"
          description="Review connector sample settings, todos, items, receipts, and sync logs prepared for ERP integration demos."
          module={moduleMap.get("frappe")!}
          activeJob={activeJob}
          message={message}
        />
      )
    default:
      return (
        <OverviewSection
          summary={data}
          activeJob={activeJob}
          message={message}
          startInstall={startInstall}
        />
      )
  }
}
