import { useEffect, useMemo, useState } from "react"
import {
  CircleAlertIcon,
  CircleCheckBigIcon,
  ClipboardCheckIcon,
  RefreshCcwIcon,
  ShieldCheckIcon,
} from "lucide-react"

import type {
  SecurityReviewDashboard,
  SecurityReviewItem,
  SecurityReviewRun,
} from "../../../../../framework/shared/database-operations"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

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
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

type SecurityReviewItemDraft = {
  status: SecurityReviewItem["status"]
  evidence: string
  notes: string
  reviewedBy: string
}

type SecurityReviewItemUpdateResponse = {
  item: SecurityReviewItem
}

type SecurityReviewCompleteResponse = {
  run: SecurityReviewRun
}

const securityReviewStatuses: Array<{
  label: string
  value: SecurityReviewItem["status"]
}> = [
  { label: "Not started", value: "not_started" },
  { label: "In review", value: "in_review" },
  { label: "Passed", value: "passed" },
  { label: "Failed", value: "failed" },
  { label: "Not applicable", value: "not_applicable" },
]

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })
  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not reviewed"
  }

  return new Date(value).toLocaleString()
}

function createDraft(item: SecurityReviewItem): SecurityReviewItemDraft {
  return {
    status: item.status,
    evidence: item.evidence ?? "",
    notes: item.notes ?? "",
    reviewedBy: item.reviewedBy ?? "",
  }
}

export function FrameworkSecurityReviewSection() {
  const [dashboard, setDashboard] = useState<SecurityReviewDashboard | null>(null)
  const [drafts, setDrafts] = useState<Record<string, SecurityReviewItemDraft>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [summary, setSummary] = useState("")
  const [reviewedBy, setReviewedBy] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)
  useGlobalLoading(isLoading || Boolean(activeItemId) || isCompleting)

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const response = await requestJson<SecurityReviewDashboard>(
        "/internal/v1/framework/security-review"
      )
      setDashboard(response)
      setDrafts(
        Object.fromEntries(response.items.map((item) => [item.id, createDraft(item)]))
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to load security review."
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  async function handleSaveItem(itemId: string) {
    const draft = drafts[itemId]

    if (!draft) {
      return
    }

    setActiveItemId(itemId)
    setError(null)

    try {
      const response = await requestJson<SecurityReviewItemUpdateResponse>(
        `/internal/v1/framework/security-review/item?id=${encodeURIComponent(itemId)}`,
        {
          method: "POST",
          body: JSON.stringify({
            status: draft.status,
            evidence: draft.evidence || null,
            notes: draft.notes || null,
            reviewedBy: draft.reviewedBy || null,
          }),
        }
      )
      setDrafts((current) => ({
        ...current,
        [itemId]: createDraft(response.item),
      }))
      showRecordToast({
        entity: "Security Review",
        action: "saved",
        recordName: response.item.title,
        recordId: response.item.id,
      })
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save review item.")
    } finally {
      setActiveItemId(null)
    }
  }

  async function handleCompleteReview() {
    setIsCompleting(true)
    setError(null)

    try {
      const response = await requestJson<SecurityReviewCompleteResponse>(
        "/internal/v1/framework/security-review/complete",
        {
          method: "POST",
          body: JSON.stringify({
            reviewedBy: reviewedBy || null,
            summary,
          }),
        }
      )
      showRecordToast({
        entity: "Security Review",
        action: "saved",
        recordName: response.run.summary,
        recordId: response.run.id,
      })
      showAppToast({
        variant: response.run.overallStatus === "healthy" ? "info" : "warning",
        title:
          response.run.overallStatus === "healthy"
            ? "Security review marked healthy."
            : "Security review needs attention.",
        description: "The review run has been recorded in the framework operations ledger.",
      })
      setSummary("")
      await loadData()
    } catch (completeError) {
      setError(
        completeError instanceof Error ? completeError.message : "Failed to complete security review."
      )
    } finally {
      setIsCompleting(false)
    }
  }

  const groupedItems = useMemo(() => {
    const groups = new Map<string, SecurityReviewItem[]>()

    for (const item of dashboard?.items ?? []) {
      const current = groups.get(item.section) ?? []
      current.push(item)
      groups.set(item.section, current)
    }

    return Array.from(groups.entries())
  }, [dashboard])

  const tabs = useMemo<AnimatedContentTab[]>(() => [
    {
      value: "checklist",
      label: "Checklist",
      content: (
        <div className="space-y-6">
          {groupedItems.map(([section, items]) => (
            <Card key={section} className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>{section}</CardTitle>
                <CardDescription>OWASP ASVS-aligned checklist items for this control area.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => {
                  const draft = drafts[item.id] ?? createDraft(item)

                  return (
                    <div key={item.id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                          <p className="text-xs text-muted-foreground">Control key: {item.controlKey} / Last update: {formatTimestamp(item.updatedAt)}</p>
                        </div>
                        <div className="min-w-[220px] rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                          Reviewed: {formatTimestamp(item.reviewedAt)}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        <div className="grid gap-2">
                          <Label>Status</Label>
                          <Select
                            value={draft.status}
                            onValueChange={(value) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: {
                                  ...draft,
                                  status: value as SecurityReviewItem["status"],
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {securityReviewStatuses.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <Label>Reviewed By</Label>
                          <Input
                            value={draft.reviewedBy}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, reviewedBy: event.target.value },
                              }))
                            }
                            placeholder="security.owner@company.com"
                          />
                        </div>
                        <div className="grid gap-2 xl:col-span-2">
                          <Label>Evidence</Label>
                          <Textarea
                            value={draft.evidence}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, evidence: event.target.value },
                              }))
                            }
                            placeholder="Links, ticket ids, validation results, or screenshots."
                          />
                        </div>
                        <div className="grid gap-2 xl:col-span-2">
                          <Label>Notes</Label>
                          <Textarea
                            value={draft.notes}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [item.id]: { ...draft, notes: event.target.value },
                              }))
                            }
                            placeholder="Operator notes, blockers, or risk commentary."
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex justify-end">
                        <Button type="button" onClick={() => void handleSaveItem(item.id)} disabled={activeItemId === item.id}>
                          {activeItemId === item.id ? "Saving..." : "Save Item"}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      ),
    },
    {
      value: "complete-review",
      label: "Complete Review",
      content: (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Review Signoff</CardTitle>
            <CardDescription>Record the current checklist state as an explicit security review run.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="security-review-reviewed-by">Reviewed By</Label>
              <Input id="security-review-reviewed-by" value={reviewedBy} onChange={(event) => setReviewedBy(event.target.value)} placeholder="security.owner@company.com" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="security-review-summary">Summary</Label>
              <Textarea id="security-review-summary" value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Summarize the outcome, unresolved risks, and next review expectation." />
            </div>
            <div className="flex justify-end">
              <Button type="button" onClick={() => void handleCompleteReview()} disabled={isCompleting || !summary.trim()}>
                <ClipboardCheckIcon className="size-4" />
                {isCompleting ? "Recording..." : "Record Review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      value: "history",
      label: "History",
      content: (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle>Review History</CardTitle>
            <CardDescription>Completed security review runs recorded from the admin operations page.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!dashboard || dashboard.runs.length === 0 ? (
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">No review history is recorded yet.</div>
            ) : (
              dashboard.runs.map((run) => (
                <div key={run.id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {run.overallStatus === "healthy" ? <CircleCheckBigIcon className="size-4 text-emerald-600" /> : <CircleAlertIcon className="size-4 text-destructive" />}
                        <p className="text-sm font-semibold text-foreground">{run.summary}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Reviewer: {run.reviewedBy ?? "Not recorded"} / {run.overallStatus}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTimestamp(run.reviewedAt)}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ),
    },
  ], [dashboard, drafts, groupedItems, activeItemId, reviewedBy, summary, isCompleting])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Security Review</h1>
          <p className="text-sm text-muted-foreground">
            Track OWASP ASVS-aligned controls, evidence, notes, and review history from one framework operations surface.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => void loadData()} disabled={isLoading}>
          <RefreshCcwIcon className="size-4" />
          Refresh
        </Button>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Total Controls</p><p className="text-2xl font-semibold text-foreground">{dashboard?.counts.total ?? 0}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Passed</p><p className="text-2xl font-semibold text-foreground">{dashboard?.counts.passed ?? 0}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Failed</p><p className="text-2xl font-semibold text-foreground">{dashboard?.counts.failed ?? 0}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last Review</p><p className="text-sm font-semibold text-foreground">{formatTimestamp(dashboard?.lastReviewedAt ?? null)}</p></CardContent></Card>
      </div>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Checklist posture</p>
              <p className="text-xs text-muted-foreground">Remaining: {dashboard?.counts.remaining ?? 0} / In review: {dashboard?.counts.inReview ?? 0}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Review every admin-critical control area before release cutover.</p>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">Loading security review...</CardContent>
        </Card>
      ) : (
        <AnimatedTabs defaultTabValue="checklist" tabs={tabs} />
      )}
    </div>
  )
}
