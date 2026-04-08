import {
  ArrowLeftIcon,
  ExternalLinkIcon,
  EyeIcon,
  MailCheck,
  PencilLineIcon,
  RefreshCw,
  ShieldAlert,
  Users,
} from "lucide-react"
import { type ReactNode, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import type {
  StorefrontCustomerAdminReport,
  StorefrontCustomerAdminResponse,
  StorefrontCustomerAdminView,
  StorefrontCustomerLifecycleAction,
} from "@ecommerce/shared"
import { useAuth } from "@cxapp/web/src/auth/auth-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { MasterList } from "@/components/blocks/master-list"
import { RecordActionMenu } from "@/components/blocks/record-action-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"

type LifecycleFilterValue = "all" | "active" | "blocked" | "deleted" | "anonymized"
type PresenceFilterValue = "all" | "yes" | "no"

const permanentDeleteConfirmationText = "DELETE PERMANENTLY"

function formatDateTime(value: string | null) {
  if (!value) {
    return "-"
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
}

function formatNullable(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : "-"
}

function formatLifecycleLabel(value: StorefrontCustomerAdminView["lifecycleState"]) {
  return value === "deleted" ? "deactivated" : value.replaceAll("_", " ")
}

function matchesPresenceFilter(filter: PresenceFilterValue, value: boolean) {
  if (filter === "all") {
    return true
  }

  return filter === "yes" ? value : !value
}

function normalizeNote(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function requireAdminAccessToken() {
  const accessToken = getStoredAccessToken()
  if (!accessToken) {
    throw new Error("Admin access token is required.")
  }

  return accessToken
}

async function loadCustomersReport() {
  return storefrontApi.getCustomersReport(requireAdminAccessToken())
}

async function loadCustomerAccount(customerId: string) {
  return storefrontApi.getCustomerAccount(requireAdminAccessToken(), customerId)
}

function SummaryCard({
  title,
  value,
  description,
  active = false,
  onSelect,
}: {
  title: string
  value: string
  description: string
  active?: boolean
  onSelect?: () => void
}) {
  const content = (
    <Card
      className={
        active
          ? "rounded-[1.4rem] border-primary/30 bg-primary/5 py-0 shadow-sm ring-1 ring-primary/20"
          : "rounded-[1.4rem] border-border/70 py-0 shadow-sm transition-colors hover:border-primary/25 hover:bg-muted/30"
      }
    >
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )

  if (!onSelect) {
    return content
  }

  return (
    <button type="button" className="w-full text-left" onClick={onSelect}>
      {content}
    </button>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
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

function SectionShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="space-y-4">
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Users className="size-3.5" />
            Customers
          </div>
          <div className="space-y-2">
            <CardTitle>{title}</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-7">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

function DetailField({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="text-sm leading-6 text-foreground">{value}</p>
    </div>
  )
}

function LifecycleBadge({ state }: { state: StorefrontCustomerAdminView["lifecycleState"] }) {
  const className =
    state === "active"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : state === "blocked"
        ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
        : state === "deleted"
          ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
          : "border-slate-500/30 bg-slate-500/10 text-slate-700"

  return (
    <Badge variant="outline" className={className}>
      {formatLifecycleLabel(state)}
    </Badge>
  )
}

function VerificationBadge({ verifiedAt }: { verifiedAt: string | null }) {
  return (
    <Badge
      variant="outline"
      className={
        verifiedAt
          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
          : "border-amber-500/30 bg-amber-500/10 text-amber-700"
      }
    >
      {verifiedAt ? "email verified" : "email pending"}
    </Badge>
  )
}

function SecurityBadge({ openCount }: { openCount: number }) {
  if (openCount <= 0) {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700">
        security clear
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-700">
      {openCount} suspicious event{openCount === 1 ? "" : "s"}
    </Badge>
  )
}

function WelcomeMailBadge({
  status,
}: {
  status: StorefrontCustomerAdminView["welcomeMailStatus"]
}) {
  const className =
    status === "sent"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
      : status === "failed"
        ? "border-rose-500/30 bg-rose-500/10 text-rose-700"
        : status === "queued"
          ? "border-amber-500/30 bg-amber-500/10 text-amber-700"
          : "border-slate-500/30 bg-slate-500/10 text-slate-700"

  return (
    <Badge variant="outline" className={className}>
      {status === "sent"
        ? "welcome mail sent"
        : status === "failed"
          ? "welcome mail failed"
          : status === "queued"
            ? "welcome mail queued"
            : "welcome mail not sent"}
    </Badge>
  )
}

function CustomerEventList({
  events,
  emptyMessage,
}: {
  events: StorefrontCustomerAdminResponse["suspiciousLoginEvents"]
  emptyMessage: string
}) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <div className="grid gap-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="rounded-2xl border border-border/70 bg-card/60 p-4 text-sm"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{event.action.replaceAll("_", " ")}</Badge>
            <Badge variant="outline">{event.level}</Badge>
            <span className="text-muted-foreground">{formatDateTime(event.createdAt)}</span>
          </div>
          <p className="mt-2 font-medium text-foreground">{event.message}</p>
          <p className="mt-1 text-muted-foreground">
            IP {formatNullable(event.ipAddress)} | Agent {formatNullable(event.userAgent)}
          </p>
        </div>
      ))}
    </div>
  )
}

function buildCustomerFilters(
  lifecycleFilter: LifecycleFilterValue,
  verificationFilter: PresenceFilterValue,
  securityFilter: PresenceFilterValue,
  onLifecycleChange: (value: LifecycleFilterValue) => void,
  onVerificationChange: (value: PresenceFilterValue) => void,
  onSecurityChange: (value: PresenceFilterValue) => void
) {
  const activeFilters = [
    lifecycleFilter === "all"
      ? null
      : {
          key: "lifecycle",
          label: "Lifecycle",
          value: lifecycleFilter === "deleted" ? "deactivated" : lifecycleFilter.replaceAll("_", " "),
        },
    verificationFilter === "all"
      ? null
      : {
          key: "verification",
          label: "Email",
          value: verificationFilter === "yes" ? "Verified" : "Pending",
        },
    securityFilter === "all"
      ? null
      : {
          key: "security",
          label: "Security",
          value: securityFilter === "yes" ? "Needs review" : "Clear",
        },
  ].filter((value): value is NonNullable<typeof value> => value !== null)

  return {
    buttonLabel: "Customer filters",
    options: [
      {
        key: "lifecycle-all",
        label: "All lifecycle states",
        isActive: lifecycleFilter === "all",
        onSelect: () => onLifecycleChange("all"),
      },
      {
        key: "lifecycle-active",
        label: "Active",
        isActive: lifecycleFilter === "active",
        onSelect: () => onLifecycleChange("active"),
      },
      {
        key: "lifecycle-blocked",
        label: "Blocked",
        isActive: lifecycleFilter === "blocked",
        onSelect: () => onLifecycleChange("blocked"),
      },
      {
        key: "lifecycle-deleted",
        label: "Deactivated",
        isActive: lifecycleFilter === "deleted",
        onSelect: () => onLifecycleChange("deleted"),
      },
      {
        key: "lifecycle-anonymized",
        label: "Anonymized",
        isActive: lifecycleFilter === "anonymized",
        onSelect: () => onLifecycleChange("anonymized"),
      },
      {
        key: "verification-verified",
        label: "Verified email",
        isActive: verificationFilter === "yes",
        onSelect: () => onVerificationChange("yes"),
      },
      {
        key: "verification-pending",
        label: "Email pending",
        isActive: verificationFilter === "no",
        onSelect: () => onVerificationChange("no"),
      },
      {
        key: "security-review",
        label: "Needs security review",
        isActive: securityFilter === "yes",
        onSelect: () => onSecurityChange("yes"),
      },
      {
        key: "security-clear",
        label: "Security clear",
        isActive: securityFilter === "no",
        onSelect: () => onSecurityChange("no"),
      },
    ],
    activeFilters,
    onRemoveFilter: (key: string) => {
      if (key === "lifecycle") {
        onLifecycleChange("all")
      }
      if (key === "verification") {
        onVerificationChange("all")
      }
      if (key === "security") {
        onSecurityChange("all")
      }
    },
    onClearAllFilters: () => {
      onLifecycleChange("all")
      onVerificationChange("all")
      onSecurityChange("all")
    },
  }
}

function CustomerIdentityCard({ customer }: { customer: StorefrontCustomerAdminView }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle>Identity</CardTitle>
        <CardDescription>Portal identity, contact linkage, and company markers.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
        <DetailField label="Display Name" value={customer.displayName} />
        <DetailField label="Email" value={customer.email} />
        <DetailField label="Phone Number" value={customer.phoneNumber} />
        <DetailField label="Company Name" value={formatNullable(customer.companyName)} />
        <DetailField label="GSTIN" value={formatNullable(customer.gstin)} />
        <DetailField label="Core Contact Id" value={customer.coreContactId} />
        <DetailField label="Auth User Id" value={formatNullable(customer.authUserId)} />
        <DetailField label="Email Verified At" value={formatDateTime(customer.emailVerifiedAt)} />
      </CardContent>
    </Card>
  )
}

function CustomerActivityCard({ customer }: { customer: StorefrontCustomerAdminView }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
        <CardDescription>Operational volume and recent storefront engagement.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
        <DetailField label="Orders" value={String(customer.orderCount)} />
        <DetailField label="Support Cases" value={String(customer.supportCaseCount)} />
        <DetailField label="Requests" value={String(customer.requestCount)} />
        <DetailField label="Open Security Events" value={String(customer.suspiciousLoginOpenCount)} />
        <DetailField label="Last Login" value={formatDateTime(customer.lastLoginAt)} />
        <DetailField label="Last Order" value={formatDateTime(customer.lastOrderAt)} />
        <DetailField
          label="Latest Suspicious Login"
          value={formatDateTime(customer.latestSuspiciousLoginAt)}
        />
        <DetailField label="Updated At" value={formatDateTime(customer.updatedAt)} />
      </CardContent>
    </Card>
  )
}

function CustomerLifecycleCard({ customer }: { customer: StorefrontCustomerAdminView }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle>Lifecycle</CardTitle>
        <CardDescription>Access state, privacy actions, and review timestamps.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
        <DetailField label="State" value={formatLifecycleLabel(customer.lifecycleState)} />
        <DetailField label="Active" value={customer.isActive ? "Yes" : "No"} />
        <DetailField label="Lifecycle Note" value={formatNullable(customer.lifecycleNote)} />
        <DetailField
          label="Security Review Note"
          value={formatNullable(customer.suspiciousLoginReviewNote)}
        />
        <DetailField label="Blocked At" value={formatDateTime(customer.blockedAt)} />
        <DetailField label="Deactivated At" value={formatDateTime(customer.deletedAt)} />
        <DetailField label="Anonymized At" value={formatDateTime(customer.anonymizedAt)} />
        <DetailField
          label="Security Reviewed At"
          value={formatDateTime(customer.suspiciousLoginReviewedAt)}
        />
      </CardContent>
    </Card>
  )
}

function CustomerCommunicationCard({ customer }: { customer: StorefrontCustomerAdminView }) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle>Communication</CardTitle>
        <CardDescription>Welcome mail delivery state and latest delivery details.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Welcome mail
          </p>
          <div>
            <WelcomeMailBadge status={customer.welcomeMailStatus} />
          </div>
        </div>
        <DetailField
          label="Last Attempt"
          value={formatDateTime(customer.welcomeMailLastAttemptAt)}
        />
        <DetailField label="Sent At" value={formatDateTime(customer.welcomeMailSentAt)} />
        <DetailField label="Failed At" value={formatDateTime(customer.welcomeMailFailedAt)} />
        <DetailField
          label="Failure Note"
          value={formatNullable(customer.welcomeMailErrorMessage)}
        />
      </CardContent>
    </Card>
  )
}

function CustomerOverviewCards({ customer }: { customer: StorefrontCustomerAdminView }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <SummaryCard
        title="Lifecycle"
        value={formatLifecycleLabel(customer.lifecycleState)}
        description="Current access and privacy state for this storefront account."
      />
      <SummaryCard
        title="Orders"
        value={String(customer.orderCount)}
        description="Completed customer order count currently linked to this account."
      />
      <SummaryCard
        title="Email"
        value={customer.emailVerifiedAt ? "Verified" : "Pending"}
        description="Verification status for portal login and communication readiness."
      />
      <SummaryCard
        title="Welcome mail"
        value={
          customer.welcomeMailStatus === "sent"
            ? "Sent"
            : customer.welcomeMailStatus === "failed"
              ? "Failed"
              : customer.welcomeMailStatus === "queued"
                ? "Queued"
                : "Not sent"
        }
        description="Latest delivery state for the storefront welcome communication."
      />
      <SummaryCard
        title="Security"
        value={customer.suspiciousLoginOpenCount > 0 ? "Needs review" : "Clear"}
        description="Open suspicious-login activity still waiting on admin review."
      />
    </div>
  )
}

export function StorefrontCustomersSection() {
  const navigate = useNavigate()
  const [report, setReport] = useState<StorefrontCustomerAdminReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilterValue>("all")
  const [verificationFilter, setVerificationFilter] = useState<PresenceFilterValue>("all")
  const [securityFilter, setSecurityFilter] = useState<PresenceFilterValue>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  useGlobalLoading(isLoading)

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      setReport(await loadCustomersReport())
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load ecommerce customer accounts."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  if (isLoading) {
    return <LoadingCard message="Loading ecommerce customer accounts..." />
  }

  if (error || !report) {
    return <StateCard message={error ?? "Customer account data is unavailable."} />
  }

  const normalizedSearch = searchValue.trim().toLowerCase()
  const filteredCustomers = report.items.filter((customer) => {
    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        customer.displayName,
        customer.email,
        customer.phoneNumber,
        customer.companyName ?? "",
        customer.coreContactId,
      ].some((value) => value.toLowerCase().includes(normalizedSearch))

    return (
      matchesSearch &&
      (lifecycleFilter === "all" || customer.lifecycleState === lifecycleFilter) &&
      matchesPresenceFilter(verificationFilter, Boolean(customer.emailVerifiedAt)) &&
      matchesPresenceFilter(securityFilter, customer.suspiciousLoginOpenCount > 0)
    )
  })
  const totalRecords = filteredCustomers.length
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const paginatedCustomers = filteredCustomers.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  )
  const activeFilterCard = getActiveCustomerFilterCard({
    lifecycleFilter,
    verificationFilter,
    securityFilter,
  })

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="All customers"
          value={String(report.summary.totalCustomers)}
          description="Reset the list and review every storefront customer account in one queue."
          active={activeFilterCard === "all"}
          onSelect={() => {
            setLifecycleFilter("all")
            setVerificationFilter("all")
            setSecurityFilter("all")
            setCurrentPage(1)
          }}
        />
        <SummaryCard
          title="Active"
          value={String(report.summary.activeCount)}
          description="Focus the table on customers with live storefront access."
          active={activeFilterCard === "active"}
          onSelect={() => {
            setLifecycleFilter("active")
            setVerificationFilter("all")
            setSecurityFilter("all")
            setCurrentPage(1)
          }}
        />
        <SummaryCard
          title="Verified"
          value={String(report.summary.verifiedCount)}
          description="Show only customers whose email is already confirmed for login."
          active={activeFilterCard === "verified"}
          onSelect={() => {
            setLifecycleFilter("all")
            setVerificationFilter("yes")
            setSecurityFilter("all")
            setCurrentPage(1)
          }}
        />
        <SummaryCard
          title="Security review"
          value={String(report.summary.suspiciousReviewCount)}
          description="Jump straight to customers that still need security follow-up."
          active={activeFilterCard === "security"}
          onSelect={() => {
            setLifecycleFilter("all")
            setVerificationFilter("all")
            setSecurityFilter("yes")
            setCurrentPage(1)
          }}
        />
      </div>

      <MasterList
        header={{
          pageTitle: "Customers",
          pageDescription:
            "Review storefront customers with the same product-style flow: filter from the headline metrics, scan the table, and open a record page for lifecycle or security actions.",
          actions: (
            <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          ),
        }}
        search={{
          value: searchValue,
          onChange: (value) => {
            setSearchValue(value)
            setCurrentPage(1)
          },
          placeholder: "Search customer, email, phone, company, or contact id",
        }}
        filters={buildCustomerFilters(
          lifecycleFilter,
          verificationFilter,
          securityFilter,
          (value) => {
            setLifecycleFilter(value)
            setCurrentPage(1)
          },
          (value) => {
            setVerificationFilter(value)
            setCurrentPage(1)
          },
          (value) => {
            setSecurityFilter(value)
            setCurrentPage(1)
          }
        )}
        table={{
          columns: [
            {
              id: "customer",
              header: "Customer",
              sortable: true,
              accessor: (customer) =>
                `${customer.displayName} ${customer.email} ${customer.phoneNumber}`,
              cell: (customer) => (
                <div className="space-y-1 text-left">
                  <Link
                    className="font-medium text-foreground underline-offset-2 hover:underline"
                    to={`/dashboard/apps/ecommerce/customers/${encodeURIComponent(customer.id)}`}
                  >
                    {customer.displayName}
                  </Link>
                  <p className="text-xs text-muted-foreground">{customer.email}</p>
                  <p className="text-xs text-muted-foreground">{customer.phoneNumber}</p>
                </div>
              ),
            },
            {
              id: "company",
              header: "Company",
              sortable: true,
              accessor: (customer) => `${customer.companyName ?? ""} ${customer.gstin ?? ""}`,
              cell: (customer) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{formatNullable(customer.companyName)}</p>
                  <p className="text-xs">GSTIN {formatNullable(customer.gstin)}</p>
                  <p className="text-xs">Contact {customer.coreContactId}</p>
                </div>
              ),
            },
            {
              id: "access",
              header: "Access",
              sortable: true,
              accessor: (customer) =>
                `${customer.lifecycleState} ${customer.emailVerifiedAt ?? ""} ${customer.welcomeMailStatus} ${customer.suspiciousLoginOpenCount}`,
              cell: (customer) => (
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <LifecycleBadge state={customer.lifecycleState} />
                    <VerificationBadge verifiedAt={customer.emailVerifiedAt} />
                    <WelcomeMailBadge status={customer.welcomeMailStatus} />
                    <SecurityBadge openCount={customer.suspiciousLoginOpenCount} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last login {formatDateTime(customer.lastLoginAt)}
                  </p>
                </div>
              ),
            },
            {
              id: "activity",
              header: "Activity",
              sortable: true,
              accessor: (customer) =>
                customer.orderCount + customer.supportCaseCount + customer.requestCount,
              cell: (customer) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Orders {customer.orderCount}</p>
                  <p>Support {customer.supportCaseCount}</p>
                  <p>Requests {customer.requestCount}</p>
                </div>
              ),
            },
            {
              id: "updated",
              header: "Updated",
              sortable: true,
              accessor: (customer) => customer.updatedAt,
              cell: (customer) => (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{formatDateTime(customer.updatedAt)}</p>
                  <p className="text-xs">Last order {formatDateTime(customer.lastOrderAt)}</p>
                </div>
              ),
            },
            {
              id: "actions",
              header: "Actions",
              cell: (customer) => (
                <RecordActionMenu
                  itemLabel={customer.displayName}
                  editLabel="Edit customer"
                  customItems={[
                    {
                      key: "view",
                      label: "View customer",
                      icon: <EyeIcon className="size-4" />,
                      onSelect: () => {
                        void navigate(
                          `/dashboard/apps/ecommerce/customers/${encodeURIComponent(customer.id)}`
                        )
                      },
                    },
                  ]}
                  onEdit={() => {
                    void navigate(
                      `/dashboard/apps/ecommerce/customers/${encodeURIComponent(customer.id)}/edit`
                    )
                  }}
                />
              ),
              className: "w-20 min-w-20 text-right",
              headerClassName: "w-20 min-w-20 text-right",
            },
          ],
          data: paginatedCustomers,
          rowKey: (customer) => customer.id,
          emptyMessage: "No customer accounts match the current filters.",
        }}
        pagination={{
          currentPage: safeCurrentPage,
          pageSize,
          totalRecords,
          onPageChange: (page) => setCurrentPage(page),
          onPageSizeChange: (nextPageSize) => {
            setPageSize(nextPageSize)
            setCurrentPage(1)
          },
          pageSizeOptions: [10, 20, 50, 100],
        }}
      />
    </div>
  )
}

export function StorefrontCustomerShowSection({ customerId }: { customerId: string }) {
  const navigate = useNavigate()
  const [customerResponse, setCustomerResponse] = useState<StorefrontCustomerAdminResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSendingWelcomeMail, setIsSendingWelcomeMail] = useState(false)
  useGlobalLoading(isLoading || isSendingWelcomeMail)

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      setCustomerResponse(await loadCustomerAccount(customerId))
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load customer details."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [customerId])

  async function handleSendWelcomeMail() {
    if (!customerResponse) {
      return
    }

    setIsSendingWelcomeMail(true)

    try {
      const response = await storefrontApi.sendCustomerWelcomeMail(
        requireAdminAccessToken(),
        customerResponse.item.id
      )

      setCustomerResponse(response.customer)

      if (response.deliveryStatus === "queued" || response.deliveryStatus === "sent") {
        showRecordToast({
          entity: "Welcome mail",
          action: response.deliveryStatus === "queued" ? "queued" : "sent",
          recordName: customerResponse.item.displayName,
        })
      } else {
        showAppToast({
          variant: "error",
          title: "Welcome mail send failed.",
          description: response.message,
        })
      }
    } catch (actionError) {
      showAppToast({
        variant: "error",
        title: "Welcome mail send failed.",
        description:
          actionError instanceof Error
            ? actionError.message
            : "Failed to send welcome mail.",
      })
    } finally {
      setIsSendingWelcomeMail(false)
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading ecommerce customer details..." />
  }

  if (error || !customerResponse) {
    return <StateCard message={error ?? "Customer details are unavailable."} />
  }

  const customer = customerResponse.item

  return (
    <SectionShell
      title={customer.displayName}
      description="Customer account details, lifecycle state, and storefront activity captured in a dedicated record view."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            void navigate("/dashboard/apps/ecommerce/customers")
          }}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => void handleSendWelcomeMail()}
            disabled={isSendingWelcomeMail}
          >
            <MailCheck className="size-4" />
            {isSendingWelcomeMail ? "Sending..." : "Send welcome mail"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void navigate(
                `/dashboard/apps/core/contacts/${encodeURIComponent(customer.coreContactId)}`
              )
            }}
          >
            <ExternalLinkIcon className="size-4" />
            Open contact
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void navigate(
                `/dashboard/apps/ecommerce/customers/${encodeURIComponent(customer.id)}/edit`
              )
            }}
          >
            <PencilLineIcon className="size-4" />
            Edit
          </Button>
        </div>
      </div>

      <CustomerOverviewCards customer={customer} />
      <CustomerIdentityCard customer={customer} />
      <CustomerActivityCard customer={customer} />
      <CustomerCommunicationCard customer={customer} />
      <CustomerLifecycleCard customer={customer} />

      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-border/70 bg-muted/50 p-2">
              <ShieldAlert className="size-4 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <CardTitle>Suspicious login events</CardTitle>
              <CardDescription>
                Review recent failed, blocked, or rejected portal login activity for this customer.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <CustomerEventList
            events={customerResponse.suspiciousLoginEvents}
            emptyMessage="No suspicious-login activity is recorded for this customer."
          />
        </CardContent>
      </Card>
    </SectionShell>
  )
}

export function StorefrontCustomerUpsertSection({ customerId }: { customerId: string }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const [customerResponse, setCustomerResponse] = useState<StorefrontCustomerAdminResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  const [lifecycleNote, setLifecycleNote] = useState("")
  const [securityReviewNote, setSecurityReviewNote] = useState("")
  const [isPermanentDeleteDialogOpen, setIsPermanentDeleteDialogOpen] = useState(false)
  const [permanentDeleteConfirmationValue, setPermanentDeleteConfirmationValue] = useState("")
  useGlobalLoading(isLoading || Boolean(pendingAction))

  function applyCustomerResponse(nextResponse: StorefrontCustomerAdminResponse) {
    setCustomerResponse(nextResponse)
    setLifecycleNote(nextResponse.item.lifecycleNote ?? "")
    setSecurityReviewNote(nextResponse.item.suspiciousLoginReviewNote ?? "")
  }

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      applyCustomerResponse(await loadCustomerAccount(customerId))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load customer operations."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [customerId])

  async function handleLifecycleAction(action: StorefrontCustomerLifecycleAction) {
    if (!customerResponse) {
      return
    }

    setPendingAction(action)

    try {
      const nextResponse = await storefrontApi.applyCustomerLifecycleAction(
        requireAdminAccessToken(),
        {
          customerAccountId: customerResponse.item.id,
          action,
          note: normalizeNote(lifecycleNote),
        }
      )

      applyCustomerResponse(nextResponse)
      showRecordToast({
        entity: "Customer account",
        action: "updated",
        recordName: nextResponse.item.displayName,
      })
    } catch (actionError) {
      showAppToast({
        variant: "error",
        title: "Customer lifecycle update failed.",
        description:
          actionError instanceof Error
            ? actionError.message
            : "Failed to update customer lifecycle.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function handleSecurityReview() {
    if (!customerResponse) {
      return
    }

    setPendingAction("mark_security_reviewed")

    try {
      const nextResponse = await storefrontApi.markCustomerSecurityReview(
        requireAdminAccessToken(),
        {
          customerAccountId: customerResponse.item.id,
          note: normalizeNote(securityReviewNote),
        }
      )

      applyCustomerResponse(nextResponse)
      showRecordToast({
        entity: "Customer security review",
        action: "updated",
        recordName: nextResponse.item.displayName,
      })
    } catch (actionError) {
      showAppToast({
        variant: "error",
        title: "Security review update failed.",
        description:
          actionError instanceof Error
            ? actionError.message
            : "Failed to update customer security review.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  async function handlePermanentDelete() {
    if (!customerResponse) {
      return
    }

    setPendingAction("permanent_delete")

    try {
      await storefrontApi.permanentlyDeleteCustomerAccount(
        requireAdminAccessToken(),
        {
          customerAccountId: customerResponse.item.id,
          note: normalizeNote(lifecycleNote),
        }
      )

      showRecordToast({
        entity: "Customer account",
        action: "deleted",
        recordName: customerResponse.item.displayName,
      })
      setIsPermanentDeleteDialogOpen(false)
      setPermanentDeleteConfirmationValue("")
      void navigate("/dashboard/apps/ecommerce/customers")
    } catch (actionError) {
      showAppToast({
        variant: "error",
        title: "Customer permanent delete failed.",
        description:
          actionError instanceof Error
            ? actionError.message
            : "Failed to permanently delete customer account.",
      })
    } finally {
      setPendingAction(null)
    }
  }

  function handlePermanentDeleteDialogOpenChange(nextOpen: boolean) {
    if (pendingAction === "permanent_delete" && !nextOpen) {
      return
    }

    setIsPermanentDeleteDialogOpen(nextOpen)

    if (!nextOpen) {
      setPermanentDeleteConfirmationValue("")
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading ecommerce customer operations..." />
  }

  if (error || !customerResponse) {
    return <StateCard message={error ?? "Customer operations are unavailable."} />
  }

  const customer = customerResponse.item
  const canPermanentlyDelete =
    auth.user?.isSuperAdmin === true &&
    customer.orderCount === 0 &&
    customer.supportCaseCount === 0 &&
    customer.requestCount === 0
  const tabs: AnimatedContentTab[] = [
    {
      label: "Overview",
      value: "overview",
      content: (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
            Customer identity fields are storefront-owned. This admin surface manages lifecycle
            access, privacy actions, and suspicious-login review without introducing a separate
            backend edit model.
          </div>
          <CustomerOverviewCards customer={customer} />
          <CustomerIdentityCard customer={customer} />
          <CustomerActivityCard customer={customer} />
          <CustomerCommunicationCard customer={customer} />
        </div>
      ),
      contentClassName: "space-y-4",
    },
    {
      label: "Lifecycle",
      value: "lifecycle",
      content: (
        <div className="space-y-4">
          <CustomerLifecycleCard customer={customer} />
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Lifecycle note</CardTitle>
              <CardDescription>
                Record why access was changed, a customer was deactivated, or privacy scrubbing
                was required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="customer-lifecycle-note">Lifecycle note</Label>
                <Textarea
                  id="customer-lifecycle-note"
                  value={lifecycleNote}
                  onChange={(event) => setLifecycleNote(event.target.value)}
                  rows={5}
                  placeholder="Record the reason for blocking, deactivation, or anonymization."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleLifecycleAction("activate")}
                  disabled={pendingAction !== null || customer.lifecycleState === "anonymized"}
                >
                  Activate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleLifecycleAction("block")}
                  disabled={pendingAction !== null || customer.lifecycleState === "anonymized"}
                >
                  Block
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleLifecycleAction("mark_deleted")}
                  disabled={pendingAction !== null || customer.lifecycleState === "anonymized"}
                >
                  Deactivate
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => void handleLifecycleAction("anonymize")}
                  disabled={pendingAction !== null}
                >
                  Anonymize
                </Button>
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Admin delete rules: customer self-delete and admin deactivation both mark the account as deactivated.
                Permanent delete is reserved for super admins and only when orders, support cases, and requests are all zero.
              </div>
              {auth.user?.isSuperAdmin ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-destructive">Permanent delete</p>
                    <p className="text-destructive/80">
                      {canPermanentlyDelete
                        ? "This customer has no linked records and can be permanently removed."
                        : "This customer cannot be permanently deleted because linked records still exist."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => handlePermanentDeleteDialogOpenChange(true)}
                    disabled={!canPermanentlyDelete || pendingAction !== null}
                  >
                    Delete permanently
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ),
      contentClassName: "space-y-4",
    },
    {
      label: "Security",
      value: "security",
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Suspicious login review</CardTitle>
              <CardDescription>
                Review recent failed or blocked customer logins and record the outcome of the
                investigation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="customer-security-note">Security review note</Label>
                <Textarea
                  id="customer-security-note"
                  value={securityReviewNote}
                  onChange={(event) => setSecurityReviewNote(event.target.value)}
                  rows={4}
                  placeholder="Record how this login pattern was reviewed."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleSecurityReview()}
                  disabled={pendingAction !== null}
                >
                  Mark reviewed
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Recorded events</CardTitle>
              <CardDescription>
                Security events linked to this customer account and available for admin follow-up.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5">
              <CustomerEventList
                events={customerResponse.suspiciousLoginEvents}
                emptyMessage="No suspicious-login activity is recorded for this customer."
              />
            </CardContent>
          </Card>
        </div>
      ),
      contentClassName: "space-y-4",
    },
  ]

  return (
    <SectionShell
      title={`Manage ${customer.displayName}`}
      description="Admin operations surface for storefront customer lifecycle changes and suspicious-login review."
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="gap-2"
          onClick={() => {
            void navigate(`/dashboard/apps/ecommerce/customers/${encodeURIComponent(customer.id)}`)
          }}
        >
          <ArrowLeftIcon className="size-4" />
          Back
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
            <RefreshCw className="size-4" />
            Refresh
          </Button>
          <Button
            type="button"
            variant="outline"
            className="gap-2"
            onClick={() => {
              void navigate(
                `/dashboard/apps/core/contacts/${encodeURIComponent(customer.coreContactId)}`
              )
            }}
          >
            <ExternalLinkIcon className="size-4" />
            Open contact
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <LifecycleBadge state={customer.lifecycleState} />
        <VerificationBadge verifiedAt={customer.emailVerifiedAt} />
        <WelcomeMailBadge status={customer.welcomeMailStatus} />
        <SecurityBadge openCount={customer.suspiciousLoginOpenCount} />
      </div>

      <AnimatedTabs defaultTabValue="overview" tabs={tabs} />

      <AlertDialog
        open={isPermanentDeleteDialogOpen}
        onOpenChange={handlePermanentDeleteDialogOpenChange}
      >
        <AlertDialogContent size="default">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">
              Permanently delete customer?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">
                This permanently removes{" "}
                <span className="font-medium text-foreground">{customer.displayName}</span>{" "}
                from the storefront customer accounts list.
              </span>
              <span className="block">
                Type{" "}
                <span className="font-mono font-semibold text-foreground">
                  {permanentDeleteConfirmationText}
                </span>{" "}
                to confirm.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label htmlFor="customer-permanent-delete-confirmation">
              Confirmation text
            </Label>
            <Input
              id="customer-permanent-delete-confirmation"
              value={permanentDeleteConfirmationValue}
              onChange={(event) =>
                setPermanentDeleteConfirmationValue(event.target.value)
              }
              placeholder={permanentDeleteConfirmationText}
              disabled={pendingAction === "permanent_delete"}
            />
          </div>
          <AlertDialogFooter className="border-destructive/15 bg-destructive/5">
            <AlertDialogCancel disabled={pendingAction === "permanent_delete"}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => void handlePermanentDelete()}
              disabled={
                pendingAction === "permanent_delete" ||
                permanentDeleteConfirmationValue.trim() !==
                  permanentDeleteConfirmationText
              }
            >
              {pendingAction === "permanent_delete"
                ? "Deleting..."
                : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SectionShell>
  )
}

function getActiveCustomerFilterCard(input: {
  lifecycleFilter: LifecycleFilterValue
  verificationFilter: PresenceFilterValue
  securityFilter: PresenceFilterValue
}) {
  if (
    input.lifecycleFilter === "all" &&
    input.verificationFilter === "all" &&
    input.securityFilter === "all"
  ) {
    return "all"
  }

  if (
    input.lifecycleFilter === "active" &&
    input.verificationFilter === "all" &&
    input.securityFilter === "all"
  ) {
    return "active"
  }

  if (
    input.lifecycleFilter === "all" &&
    input.verificationFilter === "yes" &&
    input.securityFilter === "all"
  ) {
    return "verified"
  }

  if (
    input.lifecycleFilter === "all" &&
    input.verificationFilter === "all" &&
    input.securityFilter === "yes"
  ) {
    return "security"
  }

  return null
}
