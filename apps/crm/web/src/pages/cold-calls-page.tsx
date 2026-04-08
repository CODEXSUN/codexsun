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

interface InteractionHeader {
  interaction_id: string
  lead_id: string
  type: string
  summary: string
  sentiment?: string
  requires_followup: number
  linked_task_id?: string
  interaction_date: string
}

const STATUS_COLORS: Record<string, string> = {
  Cold: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  Warm: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  Qualified: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  Converted: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  Lost: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
}

const SENTIMENT_ICON: Record<string, string> = {
  Positive: "✅",
  Neutral: "➖",
  Negative: "❌",
}

export function ColdCallsPage() {
  const [leads, setLeads] = useState<LeadHeader[]>([])
  const [interactions, setInteractions] = useState<InteractionHeader[]>([])
  const [selectedLead, setSelectedLead] = useState<LeadHeader | null>(null)
  const [showNewLeadForm, setShowNewLeadForm] = useState(false)
  const [showInteractionForm, setShowInteractionForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form state — new lead
  const [newLead, setNewLead] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    source: "Cold Call",
    notes: "",
  })

  // Form state — new interaction / cold call
  const [newInteraction, setNewInteraction] = useState({
    type: "Cold Call" as const,
    summary: "",
    sentiment: "Neutral",
    next_steps: "",
    requires_followup: false,
    template_id: "",
  })

  const loadData = async () => {
    try {
      const [leadsRes, interactionsRes] = await Promise.all([
        fetch("/api/internal/crm/leads"),
        fetch("/api/internal/crm/interactions"),
      ])
      const [leadsData, interactionsData] = await Promise.all([
        leadsRes.json(),
        interactionsRes.json(),
      ])
      setLeads(leadsData.items ?? [])
      setInteractions(interactionsData.items ?? [])
    } catch (err) {
      console.error("CRM load error", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLead.company_name || !newLead.contact_name) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/internal/crm/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLead),
      })
      if (res.ok) {
        setShowNewLeadForm(false)
        setNewLead({ company_name: "", contact_name: "", email: "", phone: "", source: "Cold Call", notes: "" })
        await loadData()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegisterInteraction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLead || !newInteraction.summary) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/internal/crm/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: selectedLead.lead_id,
          type: newInteraction.type,
          summary: newInteraction.summary,
          sentiment: newInteraction.sentiment,
          next_steps: newInteraction.next_steps,
          requires_followup: newInteraction.requires_followup,
          template_id: newInteraction.requires_followup ? newInteraction.template_id || "default-followup" : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setShowInteractionForm(false)
        setNewInteraction({ type: "Cold Call", summary: "", sentiment: "Neutral", next_steps: "", requires_followup: false, template_id: "" })
        await loadData()
        if (data.taskId) {
          alert(`✅ Interaction saved. Task created: ${data.taskId}`)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdvanceStatus = async (lead: LeadHeader, status: string) => {
    await fetch("/api/internal/crm/leads/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: lead.lead_id, status }),
    })
    await loadData()
  }

  const selectedLeadInteractions = interactions.filter((i) => i.lead_id === selectedLead?.lead_id)

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-pulse text-slate-400 text-sm">Loading CRM pipeline…</div>
      </div>
    )
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden rounded-2xl border border-border/60 bg-background shadow-sm">
      {/* ── Left Panel: Lead List ── */}
      <div className="flex w-80 shrink-0 flex-col border-r border-border/40 bg-card">
        <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
            <h2 className="text-sm font-bold text-foreground">Cold Calls & Leads</h2>
          </div>
          <button
            onClick={() => setShowNewLeadForm(true)}
            className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition hover:opacity-90 text-xs font-bold"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {leads.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              No leads yet. Register your first cold call.
            </div>
          ) : (
            leads.map((lead) => (
              <button
                key={lead.lead_id}
                onClick={() => { setSelectedLead(lead); setShowInteractionForm(false) }}
                className={`w-full text-left px-4 py-3 transition hover:bg-accent/10 ${selectedLead?.lead_id === lead.lead_id ? "bg-accent/20" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{lead.company_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{lead.contact_name}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[lead.status] ?? "bg-muted text-muted-foreground"}`}>
                    {lead.status}
                  </span>
                </div>
                {lead.phone && (
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{lead.phone}</p>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── Right Panel: Lead Detail or Forms ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {!selectedLead && !showNewLeadForm ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <p className="text-3xl">📞</p>
              <p className="text-sm font-medium text-foreground">Select a lead or register a new cold call</p>
              <p className="text-xs text-muted-foreground">Track every engagement from first contact to close.</p>
              <button
                onClick={() => setShowNewLeadForm(true)}
                className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium shadow-sm hover:opacity-90 transition"
              >
                Register Cold Call
              </button>
            </div>
          </div>
        ) : showNewLeadForm ? (
          /* ── New Lead Form ── */
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Lead</p>
              <h2 className="text-xl font-bold text-foreground mt-1">Register Cold Call</h2>
              <p className="text-sm text-muted-foreground mt-1">Capture company details and add to the pipeline.</p>
            </div>
            <form onSubmit={handleCreateLead} className="space-y-4 max-w-lg">
              {[
                { label: "Company Name *", field: "company_name", placeholder: "Acme Corp" },
                { label: "Contact Name *", field: "contact_name", placeholder: "Jane Doe" },
                { label: "Email", field: "email", placeholder: "jane@acme.com" },
                { label: "Phone", field: "phone", placeholder: "+91 98765 43210" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={(newLead as any)[field]}
                    onChange={(e) => setNewLead((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Source</label>
                <select
                  value={newLead.source}
                  onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                >
                  {["Cold Call", "Referral", "LinkedIn", "Website", "Event", "Manual"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Initial call context…"
                  value={newLead.notes}
                  onChange={(e) => setNewLead((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Register Lead"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewLeadForm(false)}
                  className="px-4 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground hover:bg-muted transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : selectedLead ? (
          /* ── Lead Detail Panel ── */
          <div className="flex h-full flex-col overflow-hidden">
            {/* Lead header bar */}
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div>
                <h2 className="text-base font-bold text-foreground">{selectedLead.company_name}</h2>
                <p className="text-xs text-muted-foreground">{selectedLead.contact_name} · {selectedLead.phone ?? selectedLead.email ?? "No contact info"}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[selectedLead.status] ?? "bg-muted text-muted-foreground"}`}>
                  {selectedLead.status}
                </span>
                <select
                  onChange={(e) => handleAdvanceStatus(selectedLead, e.target.value)}
                  defaultValue=""
                  className="rounded-lg border border-border/60 bg-background px-2 py-1 text-xs text-muted-foreground shadow-sm"
                >
                  <option value="" disabled>Move to…</option>
                  {["Cold", "Warm", "Qualified", "Converted", "Lost"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <button
                  onClick={() => setShowInteractionForm(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold shadow-sm hover:opacity-90"
                >
                  + Log Interaction
                </button>
              </div>
            </div>

            {/* Interaction log */}
            <div className="flex-1 overflow-y-auto divide-y divide-border/20 px-5">
              {showInteractionForm && (
                <div className="py-5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Log Interaction</p>
                  <form onSubmit={handleRegisterInteraction} className="space-y-3 max-w-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Type</label>
                        <select
                          value={newInteraction.type}
                          onChange={(e) => setNewInteraction((p) => ({ ...p, type: e.target.value as any }))}
                          className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                        >
                          {["Cold Call", "Email", "Reply", "Meeting"].map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1">Sentiment</label>
                        <select
                          value={newInteraction.sentiment}
                          onChange={(e) => setNewInteraction((p) => ({ ...p, sentiment: e.target.value }))}
                          className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                        >
                          {["Positive", "Neutral", "Negative"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Summary *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="What happened during this interaction?"
                        value={newInteraction.summary}
                        onChange={(e) => setNewInteraction((p) => ({ ...p, summary: e.target.value }))}
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground mb-1">Next Steps / Reply to Customer</label>
                      <input
                        type="text"
                        placeholder="Send proposal, schedule demo…"
                        value={newInteraction.next_steps}
                        onChange={(e) => setNewInteraction((p) => ({ ...p, next_steps: e.target.value }))}
                        className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground shadow-sm"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newInteraction.requires_followup}
                        onChange={(e) => setNewInteraction((p) => ({ ...p, requires_followup: e.target.checked }))}
                        className="rounded border-border"
                      />
                      <span>Assign as Task (auto-create follow-up task in Task Board)</span>
                    </label>
                    <div className="flex gap-3 pt-1">
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold shadow-sm hover:opacity-90 transition disabled:opacity-50"
                      >
                        {submitting ? "Saving…" : "Save Interaction"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInteractionForm(false)}
                        className="px-4 py-2 rounded-lg border border-border/60 text-sm text-muted-foreground hover:bg-muted transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {selectedLeadInteractions.length === 0 && !showInteractionForm ? (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No interactions yet. Click "Log Interaction" to record the first contact.
                </div>
              ) : (
                selectedLeadInteractions.map((interaction) => (
                  <div key={interaction.interaction_id} className="py-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{interaction.type}</span>
                      {interaction.sentiment && (
                        <span className="text-xs">{SENTIMENT_ICON[interaction.sentiment]}</span>
                      )}
                      {interaction.requires_followup ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Follow-up Required
                        </span>
                      ) : null}
                      {interaction.linked_task_id && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
                          Task: {interaction.linked_task_id}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-foreground">{interaction.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(interaction.interaction_date).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
