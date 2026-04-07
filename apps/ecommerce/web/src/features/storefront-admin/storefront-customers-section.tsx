import { RefreshCw, Search, ShieldAlert, Users } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type {
  StorefrontCustomerAdminResponse,
  StorefrontCustomerAdminReport,
  StorefrontCustomerAdminView,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
      {openCount} suspicious event{openCount > 1 ? "s" : ""}
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
  const [selectedCustomer, setSelectedCustomer] = useState<StorefrontCustomerAdminResponse | null>(null)
  const [lifecycleNote, setLifecycleNote] = useState("")
  const [securityReviewNote, setSecurityReviewNote] = useState("")
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
        setSelectedCustomer(response)
        setLifecycleNote(response.item.lifecycleNote ?? "")
        setSecurityReviewNote(response.item.suspiciousLoginReviewNote ?? "")
      } else {
        setSelectedCustomer(null)
        setLifecycleNote("")
        setSecurityReviewNote("")
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
      setSelectedCustomer(response)
      setLifecycleNote(response.item.lifecycleNote ?? "")
      setSecurityReviewNote(response.item.suspiciousLoginReviewNote ?? "")
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
    if (!selectedCustomer?.item) {
      return
    }

    setPendingAction(action)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.applyCustomerLifecycleAction(accessToken, {
        customerAccountId: selectedCustomer.item.id,
        action,
        note: lifecycleNote,
      })

      setSelectedCustomer(response)
      setLifecycleNote(response.item.lifecycleNote ?? "")
      setSecurityReviewNote(response.item.suspiciousLoginReviewNote ?? "")
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
            verifiedCount: nextItems.filter((item) => Boolean(item.emailVerifiedAt)).length,
            suspiciousReviewCount: nextItems.filter((item) => item.suspiciousLoginOpenCount > 0).length,
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

  async function handleSecurityReview() {
    if (!selectedCustomer?.item) {
      return
    }

    setPendingAction("mark_security_reviewed")

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.markCustomerSecurityReview(accessToken, {
        customerAccountId: selectedCustomer.item.id,
        note: securityReviewNote,
      })

      setSelectedCustomer(response)
      setSecurityReviewNote(response.item.suspiciousLoginReviewNote ?? "")
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
            ...current.summary,
            verifiedCount: nextItems.filter((item) => Boolean(item.emailVerifiedAt)).length,
            suspiciousReviewCount: nextItems.filter((item) => item.suspiciousLoginOpenCount > 0).length,
          },
        }
      })

      showRecordToast({
        entity: "Customer security review",
        action: "updated",
        recordName: response.item.displayName,
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
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
        <SummaryCard
          title="Verified"
          value={String(report?.summary.verifiedCount ?? 0)}
          description="Customers whose email is already confirmed for portal access."
        />
        <SummaryCard
          title="Security review"
          value={String(report?.summary.suspiciousReviewCount ?? 0)}
          description="Accounts with suspicious-login events that still need review."
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
                      <VerificationBadge verifiedAt={item.emailVerifiedAt} />
                      <SecurityBadge openCount={item.suspiciousLoginOpenCount} />
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
            {selectedCustomer?.item ? (
              <>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold text-foreground">
                      {selectedCustomer.item.displayName}
                    </p>
                    <LifecycleBadge state={selectedCustomer.item.lifecycleState} />
                    <VerificationBadge verifiedAt={selectedCustomer.item.emailVerifiedAt} />
                    <SecurityBadge openCount={selectedCustomer.item.suspiciousLoginOpenCount} />
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.item.email}</p>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.item.phoneNumber}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Company</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCustomer.item.companyName ?? "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">GSTIN</p>
                    <p className="mt-1 text-muted-foreground">{selectedCustomer.item.gstin ?? "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Orders</p>
                    <p className="mt-1 text-muted-foreground">{selectedCustomer.item.orderCount}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Support / Requests</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCustomer.item.supportCaseCount} / {selectedCustomer.item.requestCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Email verified</p>
                    <p className="mt-1 text-muted-foreground">
                      {formatDateTime(selectedCustomer.item.emailVerifiedAt)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-sm">
                    <p className="font-medium text-foreground">Suspicious login</p>
                    <p className="mt-1 text-muted-foreground">
                      {selectedCustomer.item.suspiciousLoginOpenCount} open | latest{" "}
                      {formatDateTime(selectedCustomer.item.latestSuspiciousLoginAt)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2 text-sm text-muted-foreground">
                  <p>Created: {formatDateTime(selectedCustomer.item.createdAt)}</p>
                  <p>Last login: {formatDateTime(selectedCustomer.item.lastLoginAt)}</p>
                  <p>Blocked at: {formatDateTime(selectedCustomer.item.blockedAt)}</p>
                  <p>Deleted at: {formatDateTime(selectedCustomer.item.deletedAt)}</p>
                  <p>Anonymized at: {formatDateTime(selectedCustomer.item.anonymizedAt)}</p>
                  <p>Security reviewed: {formatDateTime(selectedCustomer.item.suspiciousLoginReviewedAt)}</p>
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
                    disabled={
                      pendingAction !== null || selectedCustomer.item.lifecycleState === "anonymized"
                    }
                  >
                    Activate
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLifecycleAction("block")}
                    disabled={
                      pendingAction !== null || selectedCustomer.item.lifecycleState === "anonymized"
                    }
                  >
                    Block
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleLifecycleAction("mark_deleted")}
                    disabled={
                      pendingAction !== null || selectedCustomer.item.lifecycleState === "anonymized"
                    }
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

                <div className="space-y-3 rounded-[1.5rem] border border-border/70 bg-muted/15 p-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Suspicious login review</p>
                    <p className="text-sm text-muted-foreground">
                      Review recent failed or blocked customer logins and record your outcome.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-security-note">Security review note</Label>
                    <Textarea
                      id="customer-security-note"
                      value={securityReviewNote}
                      onChange={(event) => setSecurityReviewNote(event.target.value)}
                      placeholder="Record how this login pattern was reviewed."
                      rows={3}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleSecurityReview()}
                    disabled={pendingAction !== null}
                  >
                    Mark reviewed
                  </Button>
                  <div className="space-y-2">
                    {selectedCustomer.suspiciousLoginEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No suspicious-login activity is recorded for this customer.
                      </p>
                    ) : (
                      selectedCustomer.suspiciousLoginEvents.map((event) => (
                        <div
                          key={event.id}
                          className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">{event.action.replaceAll("_", " ")}</Badge>
                            <span className="text-muted-foreground">{formatDateTime(event.createdAt)}</span>
                          </div>
                          <p className="mt-2 font-medium text-foreground">{event.message}</p>
                          <p className="mt-1 text-muted-foreground">
                            IP {event.ipAddress ?? "-"} | Agent {event.userAgent ?? "-"}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
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
