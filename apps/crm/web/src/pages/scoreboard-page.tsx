import { useEffect, useMemo, useState } from "react"

import { readStoredAuthSession } from "@cxapp/web/src/auth/session-storage"
import { TechnicalNameBadge } from "../../../../ui/src/components/system/technical-name-badge"

type LeadScore = {
  leadId: string
  companyName: string
  contactName: string
  status: string
  source: string | null
  leadScore: number
  engagementScore: number
  riskScore: number
  interactionCount: number
  openTaskCount: number
  completedTaskCount: number
  overdueReminderCount: number
  latestInteractionAt: string | null
  reasons: string[]
}

type OwnerLeaderboardRow = {
  ownerKey: string
  ownerName: string
  assignedTaskCount: number
  openTaskCount: number
  completedTaskCount: number
  overdueReminderCount: number
  reassignmentCount: number
  auditEventCount: number
  outputScore: number
}

type Scoreboard = {
  summary: {
    rankedLeadCount: number
    highIntentLeadCount: number
    atRiskLeadCount: number
    ownerCount: number
    averageLeadScore: number
    averageEngagementScore: number
  }
  leadScores: LeadScore[]
  ownerLeaderboard: OwnerLeaderboardRow[]
  generatedAt: string
}

function getHeaders() {
  const token = readStoredAuthSession()?.accessToken

  return {
    "Content-Type": "application/json",
    ...(token ? { authorization: `Bearer ${token}` } : {}),
  }
}

function scoreTone(score: number, reverse = false) {
  if ((!reverse && score >= 70) || (reverse && score <= 20)) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
  }

  if ((!reverse && score >= 40) || (reverse && score <= 45)) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
  }

  return "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-200"
}

function formatDate(value: string | null) {
  if (!value) {
    return "No recent interaction"
  }

  return new Date(value).toLocaleString()
}

export function CrmScoreboardPage() {
  const [scoreboard, setScoreboard] = useState<Scoreboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadScoreboard() {
      try {
        const response = await fetch("/internal/v1/crm/scoreboard", { headers: getHeaders() })
        const payload = await response.json()
        setScoreboard(payload.item ?? null)
      } catch (error) {
        console.error("Failed to load CRM scoreboard", error)
      } finally {
        setLoading(false)
      }
    }

    void loadScoreboard()
  }, [])

  const topLeads = useMemo(() => (scoreboard?.leadScores ?? []).slice(0, 8), [scoreboard])
  const ownerRows = useMemo(() => (scoreboard?.ownerLeaderboard ?? []).slice(0, 8), [scoreboard])

  if (loading) {
    return (
      <div
        className="relative space-y-3 rounded-lg border border-border/60 bg-card p-5 shadow-sm"
        data-technical-name="page.crm.scoreboard"
      >
        <TechnicalNameBadge name="page.crm.scoreboard" className="absolute -top-3 right-4" />
        <div className="h-3 w-40 animate-pulse rounded-full bg-muted" />
        <div className="h-28 animate-pulse rounded-lg bg-muted/60" />
      </div>
    )
  }

  return (
    <div className="relative space-y-4" data-technical-name="page.crm.scoreboard">
      <TechnicalNameBadge name="page.crm.scoreboard" className="absolute -top-3 right-4 z-20" />

      <div className="rounded-lg border border-border/60 bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase text-muted-foreground">CRM</p>
        <h1 className="mt-1 text-xl font-bold text-foreground">Scoreboard</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Rank lead quality, engagement, risk, and owner output from local CRM work already recorded.
        </p>
      </div>

      {!scoreboard ? (
        <div className="rounded-lg border border-border/60 bg-card p-8 text-center shadow-sm">
          <p className="text-sm font-semibold text-foreground">No scoreboard data available.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add leads, interactions, and follow-up work to generate CRM scores.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            {[
              { label: "Ranked leads", value: scoreboard.summary.rankedLeadCount },
              { label: "High intent", value: scoreboard.summary.highIntentLeadCount },
              { label: "At risk", value: scoreboard.summary.atRiskLeadCount },
              { label: "Owners", value: scoreboard.summary.ownerCount },
              { label: "Avg lead score", value: scoreboard.summary.averageLeadScore },
              { label: "Avg engagement", value: scoreboard.summary.averageEngagementScore },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-border/60 bg-card px-4 py-4 shadow-sm">
                <p className="text-xs uppercase text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-bold text-foreground">{item.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Lead Ranking</p>
                  <h2 className="mt-1 text-base font-bold text-foreground">Score and engagement</h2>
                </div>
                <p className="text-xs text-muted-foreground">
                  Generated {new Date(scoreboard.generatedAt).toLocaleString()}
                </p>
              </div>

              <div className="mt-4 space-y-3">
                {topLeads.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No leads to score.</p>
                ) : (
                  topLeads.map((lead) => (
                    <article key={lead.leadId} className="rounded-lg border border-border/50 bg-background p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{lead.companyName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {lead.contactName} | {lead.status} | {lead.source ?? "Manual"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Latest interaction: {formatDate(lead.latestInteractionAt)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${scoreTone(lead.leadScore)}`}>
                            Lead {lead.leadScore}
                          </span>
                          <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${scoreTone(lead.engagementScore)}`}>
                            Engagement {lead.engagementScore}
                          </span>
                          <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${scoreTone(lead.riskScore, true)}`}>
                            Risk {lead.riskScore}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                        <span>{lead.interactionCount} interactions</span>
                        <span>{lead.openTaskCount} open tasks</span>
                        <span>{lead.completedTaskCount} completed</span>
                        <span>{lead.overdueReminderCount} overdue</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {lead.reasons.slice(0, 4).map((reason) => (
                          <span key={reason} className="rounded-lg border border-border bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-lg border border-border/60 bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Owner Leaderboard</p>
              <h2 className="mt-1 text-base font-bold text-foreground">Output and workload</h2>

              <div className="mt-4 space-y-3">
                {ownerRows.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No owner activity recorded.</p>
                ) : (
                  ownerRows.map((owner, index) => (
                    <article key={owner.ownerKey} className="rounded-lg border border-border/50 bg-background p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {index + 1}. {owner.ownerName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{owner.ownerKey}</p>
                        </div>
                        <span className={`rounded-lg border px-2 py-1 text-xs font-semibold ${scoreTone(owner.outputScore)}`}>
                          {owner.outputScore}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                        <span>{owner.assignedTaskCount} assigned</span>
                        <span>{owner.openTaskCount} open</span>
                        <span>{owner.completedTaskCount} completed</span>
                        <span>{owner.overdueReminderCount} overdue</span>
                        <span>{owner.reassignmentCount} reassignments</span>
                        <span>{owner.auditEventCount} audit events</span>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
