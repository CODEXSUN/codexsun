import { Headphones, MessageSquarePlus, RefreshCw, Search } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import type { StorefrontSupportCaseView, StorefrontSupportQueueReport } from "@ecommerce/shared"
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
import { StorefrontAdminOrderOperationsDialog } from "./storefront-admin-order-operations-dialog"

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

function toLabel(value: string) {
  return value.replaceAll("_", " ")
}

function SupportSummaryCard({
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

export function StorefrontSupportSection() {
  const [report, setReport] = useState<StorefrontSupportQueueReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchValue, setSearchValue] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [selectedCase, setSelectedCase] = useState<StorefrontSupportCaseView | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState("")
  useGlobalLoading(isLoading || Boolean(updatingCaseId))

  async function load() {
    setIsLoading(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const nextReport = await storefrontApi.getSupportReport(accessToken)
      setReport(nextReport)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load ecommerce support queue."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase()

    return (report?.items ?? []).filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [
          item.caseNumber,
          item.subject,
          item.customerName,
          item.customerEmail,
          item.orderNumber ?? "",
        ].some((value) => value.toLowerCase().includes(normalizedSearch))

      const matchesStatus = statusFilter === "all" || item.status === statusFilter
      const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [priorityFilter, report?.items, searchValue, statusFilter])

  async function handleUpdateSupportCase(
    item: StorefrontSupportCaseView,
    status: "open" | "in_progress" | "waiting_customer" | "resolved" | "closed"
  ) {
    setUpdatingCaseId(item.id)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.updateSupportCase(accessToken, {
        caseId: item.id,
        status,
        priority: item.priority,
        adminNote: selectedCase?.id === item.id ? adminNote : item.adminNote,
      })

      setReport((current) => {
        if (!current) {
          return current
        }

        const nextItems = current.items.map((entry) =>
          entry.id === response.item.id ? response.item : entry
        )

        return {
          ...current,
          items: nextItems.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)),
          summary: {
            totalCases: nextItems.length,
            openCount: nextItems.filter((entry) => entry.status === "open").length,
            inProgressCount: nextItems.filter((entry) => entry.status === "in_progress").length,
            waitingCustomerCount: nextItems.filter((entry) => entry.status === "waiting_customer").length,
            resolvedCount: nextItems.filter((entry) => ["resolved", "closed"].includes(entry.status)).length,
            urgentCount: nextItems.filter((entry) => entry.priority === "urgent").length,
            rmaLinkedCount: nextItems.filter((entry) => Boolean(entry.orderRequestId)).length,
            financeOwnedCount: nextItems.filter((entry) => entry.assignedTeam === "finance").length,
          },
        }
      })
      setSelectedCase(response.item)
      setAdminNote(response.item.adminNote ?? "")
      showRecordToast({
        entity: "Support case",
        action: "updated",
        recordName: response.item.caseNumber,
      })
    } catch (updateError) {
      showAppToast({
        variant: "error",
        title: "Support case update failed.",
        description:
          updateError instanceof Error
            ? updateError.message
            : "Failed to update support case.",
      })
    } finally {
      setUpdatingCaseId(null)
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
            <Headphones className="size-3.5" />
            Customer service
          </div>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-2">
              <CardTitle>Support queue linked to storefront orders</CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-7">
                Review portal-created customer support cases, move them through service status,
                and jump into the linked order when operational action is needed.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={() => void load()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SupportSummaryCard
          title="Total cases"
          value={String(report?.summary.totalCases ?? 0)}
          description="All active and closed support requests created from the customer portal."
        />
        <SupportSummaryCard
          title="Open"
          value={String(report?.summary.openCount ?? 0)}
          description="Fresh cases waiting for first operational response."
        />
        <SupportSummaryCard
          title="In progress"
          value={String(report?.summary.inProgressCount ?? 0)}
          description="Cases actively being handled by the support or operations desk."
        />
        <SupportSummaryCard
          title="Urgent"
          value={String(report?.summary.urgentCount ?? 0)}
          description="Priority escalations that should not wait in the queue."
        />
      </div>

      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Search case, customer, subject, or order"
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="divide-y divide-border/70 p-0">
          {filteredItems.length === 0 ? (
            <div className="p-5 text-sm text-muted-foreground">
              No support cases match the current queue filters.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="grid gap-4 px-5 py-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_auto]"
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-foreground">{item.caseNumber}</p>
                    <Badge variant="outline">{toLabel(item.category)}</Badge>
                    <Badge variant={item.priority === "urgent" ? "destructive" : "secondary"}>
                      {item.priority}
                    </Badge>
                    <Badge variant="outline">{toLabel(item.status)}</Badge>
                  </div>
                  <p className="font-medium text-foreground">{item.subject}</p>
                  <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.customerName} | {item.customerEmail} | Updated {formatDateTime(item.updatedAt)}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Order: {item.orderNumber ?? "Not linked"}</p>
                  <p>Order status: {item.orderStatus ? toLabel(item.orderStatus) : "-"}</p>
                  <p>Payment: {item.paymentStatus ?? "-"}</p>
                  {item.orderTotalAmount != null && item.currency ? (
                    <p>
                      Value:{" "}
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: item.currency,
                        maximumFractionDigits: 2,
                      }).format(item.orderTotalAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-start gap-2 xl:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedCase(item)
                      setAdminNote(item.adminNote ?? "")
                    }}
                  >
                    Open case
                  </Button>
                  {item.orderId ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderId(item.orderId)}
                    >
                      View order
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleUpdateSupportCase(item, "in_progress")}
                    disabled={updatingCaseId === item.id || item.status === "in_progress"}
                  >
                    {updatingCaseId === item.id ? "Saving..." : "In progress"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleUpdateSupportCase(item, "resolved")}
                    disabled={updatingCaseId === item.id || item.status === "resolved"}
                  >
                    Resolve
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquarePlus className="size-4 text-primary" />
            <CardTitle className="text-[1.1rem] tracking-tight">
              {selectedCase ? `Case ${selectedCase.caseNumber}` : "Select a support case"}
            </CardTitle>
          </div>
          <CardDescription>
            Keep the case note updated here before moving it to waiting customer, resolved, or closed.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {selectedCase ? (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Status</p>
                  <Select
                    value={selectedCase.status}
                    onValueChange={(value) =>
                      setSelectedCase({
                        ...selectedCase,
                        status: value as StorefrontSupportCaseView["status"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In progress</SelectItem>
                      <SelectItem value="waiting_customer">Waiting customer</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Priority</p>
                  <Select
                    value={selectedCase.priority}
                    onValueChange={(value) =>
                      setSelectedCase({
                        ...selectedCase,
                        priority: value as StorefrontSupportCaseView["priority"],
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="text-sm font-medium text-foreground">Customer</p>
                  <p>{selectedCase.customerName}</p>
                  <p>{selectedCase.customerEmail}</p>
                  <p>{selectedCase.customerPhone}</p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Admin note</p>
                <Textarea
                  rows={4}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Record the support action, customer callback note, or operational dependency."
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() =>
                    void handleUpdateSupportCase(selectedCase, selectedCase.status)
                  }
                  disabled={updatingCaseId === selectedCase.id}
                >
                  Save case
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleUpdateSupportCase(selectedCase, "waiting_customer")}
                  disabled={updatingCaseId === selectedCase.id}
                >
                  Waiting customer
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void handleUpdateSupportCase(selectedCase, "closed")}
                  disabled={updatingCaseId === selectedCase.id}
                >
                  Close case
                </Button>
                {selectedCase.orderId ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedOrderId(selectedCase.orderId)}
                  >
                    Open linked order
                  </Button>
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Pick a case from the queue above to update the service status and internal note.
            </p>
          )}
        </CardContent>
      </Card>

      <StorefrontAdminOrderOperationsDialog
        orderId={selectedOrderId}
        open={Boolean(selectedOrderId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrderId(null)
          }
        }}
        onOrderUpdated={async () => {
          await load()
        }}
      />
    </div>
  )
}
