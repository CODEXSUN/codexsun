import { useState, useEffect } from "react"

interface LeadHeader {
  lead_id: string
  company_name: string
  contact_name: string
  email?: string
  phone?: string
  source?: string
  status: string
  created_at: string
}

const PIPELINE_STAGES = ["Cold", "Warm", "Qualified", "Converted", "Lost"] as const

const STAGE_CONFIG: Record<string, { color: string; bg: string; accent: string }> = {
  Cold:      { color: "text-blue-700 dark:text-blue-300",   bg: "bg-blue-50 dark:bg-blue-950/40",   accent: "border-blue-300 dark:border-blue-700" },
  Warm:      { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-950/40", accent: "border-amber-300 dark:border-amber-700" },
  Qualified: { color: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-950/40", accent: "border-green-300 dark:border-green-700" },
  Converted: { color: "text-purple-700 dark:text-purple-300",bg: "bg-purple-50 dark:bg-purple-950/40",accent:"border-purple-300 dark:border-purple-700"},
  Lost:      { color: "text-red-600 dark:text-red-400",     bg: "bg-red-50 dark:bg-red-950/40",     accent: "border-red-200 dark:border-red-700" },
}

export function LeadPipelinePage() {
  const [leads, setLeads] = useState<LeadHeader[]>([])
  const [loading, setLoading] = useState(true)

  const loadLeads = async () => {
    try {
      const res = await fetch("/api/internal/crm/leads")
      const data = await res.json()
      setLeads(data.items ?? [])
    } catch (err) {
      console.error("Failed to load leads", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLeads() }, [])

  const handleAdvance = async (lead: LeadHeader, newStatus: string) => {
    await fetch("/api/internal/crm/leads/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.lead_id, status: newStatus }),
    })
    await loadLeads()
  }

  const leadsByStage = (stage: string) =>
    leads.filter((l) => l.status === stage)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-sm text-muted-foreground">Loading pipeline…</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">Lead Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visual overview of all prospects across your sales funnel stages.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const count = leadsByStage(stage).length
          const cfg = STAGE_CONFIG[stage]
          return (
            <div
              key={stage}
              className={`rounded-xl border ${cfg.accent} ${cfg.bg} px-4 py-3`}
            >
              <p className={`text-2xl font-bold ${cfg.color}`}>{count}</p>
              <p className={`mt-0.5 text-xs font-semibold ${cfg.color}`}>{stage}</p>
            </div>
          )
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-5 gap-3 items-start">
        {PIPELINE_STAGES.map((stage) => {
          const stageLeads = leadsByStage(stage)
          const cfg = STAGE_CONFIG[stage]
          const nextStages = PIPELINE_STAGES.filter((s) => s !== stage)

          return (
            <div
              key={stage}
              className="flex flex-col rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden"
            >
              {/* Column header */}
              <div className={`px-3 py-2.5 border-b border-border/40 ${cfg.bg}`}>
                <p className={`text-xs font-bold uppercase tracking-widest ${cfg.color}`}>
                  {stage}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{stageLeads.length} lead{stageLeads.length !== 1 ? "s" : ""}</p>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 p-2 min-h-[80px]">
                {stageLeads.length === 0 ? (
                  <p className="py-4 text-center text-[11px] text-muted-foreground/60">Empty</p>
                ) : (
                  stageLeads.map((lead) => (
                    <div
                      key={lead.lead_id}
                      className={`rounded-lg border ${cfg.accent} bg-background p-3 shadow-sm space-y-1.5`}
                    >
                      <p className="text-xs font-bold text-foreground truncate">{lead.company_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{lead.contact_name}</p>
                      {lead.source && (
                        <p className="text-[10px] text-muted-foreground/60">via {lead.source}</p>
                      )}
                      {/* Move actions */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {nextStages.slice(0, 2).map((next) => (
                          <button
                            key={next}
                            onClick={() => handleAdvance(lead, next)}
                            className="rounded-md border border-border/50 bg-muted/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-accent/20 transition"
                          >
                            → {next}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {leads.length === 0 && (
        <div className="rounded-xl border border-border/40 bg-card p-8 text-center space-y-2">
          <p className="text-2xl">📋</p>
          <p className="text-sm font-medium text-foreground">No leads in the pipeline</p>
          <p className="text-xs text-muted-foreground">
            Go to Cold Calls to register your first contact.
          </p>
        </div>
      )}
    </div>
  )
}
