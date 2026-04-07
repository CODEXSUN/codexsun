import { RefreshCw, Search, ShieldAlert, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type {
  StorefrontCustomerAdminReport,
  StorefrontCustomerAdminView,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"

type LifecycleFilterValue = "all" | "active" | "blocked" | "deleted" | "anonymized"

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

function SummaryCard({
  title,
  value,
  description,
}: {
  title: string
  value: string
  description: string
}) {
  return (
    <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
      <CardContent className="space-y-2 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {title}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
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
      {state.replaceAll("_", " ")}
    </Badge>
  )
}

export function StorefrontCustomersSection() {
  const [report, setReport] = useState<StorefrontCustomerAdminReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [lifecycleFilter, setLifecycleFilter] = useState<LifecycleFilterValue>("all")
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<StorefrontCustomerAdminView | null>(null)
  const [lifecycleNote, setLifecycleNote] = useState("")
  const [pendingAction, setPendingAction] = useState<string | null>(null)
  useGlobalLoading(isLoading || Boolean(pendingAction))

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const nextReport = await storefrontApi.getCustomersReport(accessToken)
      setReport(nextReport)

      const nextSelectedId =
        selectedCustomerId && nextReport.items.some((item) => item.id === selectedCustomerId)
          ? selectedCustomerId
          : nextReport.items[0]?.id ?? null

      setSelectedCustomerId(nextSelectedId)
      if (nextSelectedId) {
        const response = await storefrontApi.getCustomerAccount(accessToken, nextSelectedId)
        setSelectedCustomer(response.item)
        setLifecycleNote(response.item.lifecycleNote ?? "")
      } else {
        setSelectedCustomer(null)
        setLifecycleNote("")
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load ecommerce customer operations."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleSelectCustomer(customerAccountId: string) {
    setSelectedCustomerId(customerAccountId)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.getCustomerAccount(accessToken, customerAccountId)
      setSelectedCustomer(response.item)
      setLifecycleNote(response.item.lifecycleNote ?? "")
    } catch (loadError) {
      showAppToast({
        variant: "error",
        title: "Customer details failed to load.",
        description:
          loadError instanceof Error ? loadError.message : "Failed to load customer details.",
      })
    }
  }

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return (report?.items ?? []).filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [item.displayName, item.email, item.phoneNumber, item.companyName ?? ""].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        )

      const matchesLifecycle =
        lifecycleFilter === "all" || item.lifecycleState === lifecycleFilter

      return matchesSearch && matchesLifecycle
    })
  }, [lifecycleFilter, report?.items, searchValue])

  async function handleLifecycleAction(
    action: "activate" | "block" | "mark_deleted" | "anonymize"
  ) {
    if (!selectedCustomer) {
      return
    }

    setPendingAction(action)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.applyCustomerLifecycleAction(accessToken, {
        customerAccountId: selectedCustomer.id,
        action,
        note: lifecycleNote,
      })

      setSelectedCustomer(response.item)
      setLifecycleNote(response.item.lifecycleNote ?? "")
      setReport((current) => {
        if (!current) {
          return current
        }

        const nextItems = current.items
          .map((item) => (item.id === response.item.id ? response.item : item))
          .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))

        return {
          ...current,
          items: nextItems,
          summary: {
            totalCustomers: nextItems.length,
            activeCount: nextItems.filter((item) => item.lifecycleState === "active").length,
            blockedCount: nextItems.filter((item) => item.lifecycleState === "blocked").length,
            deletedCount: nextItems.filter((item) => item.lifecycleState === "deleted").length,
            anonymizedCount: nextItems.filter((item) => item.lifecycleState === "anonymized").length,
          },
        }
      })

      showRecordToast({
        entity: "Customer account",
        action: "updated",
        recordName: response.item.displayName,
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

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Users className="size-3.5" />
            Customer lifecycle
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Customer accounts, portal access, and lifecycle state</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">
                Review registered storefront customers, block compromised accounts, mark deleted
                records, or anonymize identity data without disturbing order history.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          title="Total customers"
          value={String(report?.summary.totalCustomers ?? 0)}
          description="All storefront-linked customer accounts."
        />
        <SummaryCard
          title="Active"
          value={String(report?.summary.activeCount ?? 0)}
          description="Portal-ready customer accounts with normal access."
        />
        <SummaryCard
          title="Blocked"
          value={String(report?.summary.blockedCount ?? 0)}
          description="Customers currently prevented from logging in."
        />
        <SummaryCard
          title="Deleted"
          value={String(report?.summary.deletedCount ?? 0)}
          description="Soft-deleted customer accounts retained for operations history."
        />
        <SummaryCard
          title="Anonymized"
          value={String(report?.summary.anonymizedCount ?? 0)}
          description="Identity-scrubbed records kept only for transactional retention."
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardHeader className="border-b border-border/70">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  placeholder="Search customer, email, phone, or company"
                  className="pl-9"
                />
              </div>
              <Select
                value={lifecycleFilter}
                onValueChange={(value) => setLifecycleFilter(value as LifecycleFilterValue)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All lifecycle states" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All lifecycle states</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="deleted">Deleted</SelectItem>
                  <SelectItem value="anonymized">Anonymized</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border/70 p-0">
            {filteredItems.length === 0 ? (
              <div className="p-5 text-sm text-muted-foreground">
                No customer accounts match the current filters.
              </div>
            ) : (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="grid w-full gap-3 px-5 py-4 text-left transition hover:bg-muted/30 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
                  onClick={() => void handleSelectCustomer(item.id)}
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{item.displayName}</p>
                      <LifecycleBadge state={item.lifecycleState} />
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {item.email} | {item.phoneNumber}
                    </p>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {item.companyName ?? "No company name"} | Orders {item.orderCount} | Support{" "}
                      {item.supportCaseCount}
                    </p>
                  </div>
                  <div className="space-y-1 text-sm text-muted-foreground xl:text-right">
                    <p>Last login: {formatDateTime(item.lastLoginAt)}</p>
                    <p>Last order: {formatDateTime(item.lastOrderAt)}</p>
                    <p>Updated: {formatDateTime(item.updatedAt)}</p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardHeader className="border-b border-border/70">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-border/70 bg-muted/50 p-2">
                <ShieldAlert className="size-4 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <CardTitle>Customer lifecycle controls</CardTitle>
                <CardDescription>
                  {selectedCustomer
                    ? "Review customer state and apply access or privacy actions."
                    : "Select a customer account to review lifecycle state."}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-5">
            {selectedCustomer ? (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">
                      {selectedCustomer.displayName}
                    </p>
                    <LifecycleBadge state={selectedCustomer.lifecycleState} />
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.phoneNumber}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Company</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCustomer.companyName ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">GSTIN</p>
                    <p className="mt-1 text-muted-foreground">{selectedCustomer.gstin ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Orders</p>
                    <p className="mt-1 text-muted-foreground">{selectedCustomer.orderCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Support / Requests</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCustomer.supportCaseCount} / {selectedCustomer.requestCount}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>Created: {formatDateTime(selectedCustomer.createdAt)}</p>
                  <p>Last login: {formatDateTime(selectedCustomer.lastLoginAt)}</p>
                  <p>Blocked at: {formatDateTime(selectedCustomer.blockedAt)}</p>
                  <p>Deleted at: {formatDateTime(selectedCustomer.deletedAt)}</p>
                  <p>Anonymized at: {formatDateTime(selectedCustomer.anonymizedAt)}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground" htmlFor="customer-lifecycle-note">
                    Lifecycle note
                  </label>
                  <Textarea
                    id="customer-lifecycle-note"
                    value={lifecycleNote}
                    onChange={(event) => setLifecycleNote(event.target.value)}
                    placeholder="Record the reason for blocking, deletion, or anonymization."
                    rows={4}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLifecycleAction("activate")}
                    disabled={pendingAction !== null || selectedCustomer.lifecycleState === "anonymized"}
                  >
                    Activate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLifecycleAction("block")}
                    disabled={pendingAction !== null || selectedCustomer.lifecycleState === "anonymized"}
                  >
                    Block
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLifecycleAction("mark_deleted")}
                    disabled={pendingAction !== null || selectedCustomer.lifecycleState === "anonymized"}
                  >
                    Mark deleted
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Choose a customer from the left to inspect their lifecycle state and portal access.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
