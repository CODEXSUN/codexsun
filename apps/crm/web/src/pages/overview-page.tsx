import { PhoneCall, TrendingUp, Users } from "lucide-react"
import { Link } from "react-router-dom"

const overviewCards = [
  {
    id: "pipeline",
    title: "Lead pipeline",
    summary: "Track prospects from cold outreach through qualification and conversion.",
    icon: TrendingUp,
  },
  {
    id: "calls",
    title: "Cold calls",
    summary: "Capture outbound contact activity, notes, and next-step follow-up.",
    icon: PhoneCall,
  },
  {
    id: "relationships",
    title: "Sales relationships",
    summary: "Keep customer intent visible while the broader CRM workspace grows.",
    icon: Users,
  },
] as const

export function CrmOverviewPage() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">CRM</p>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-foreground">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Start from the CRM control surface, then move into lead pipeline and cold-call execution.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {overviewCards.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.id}
              className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent/10">
                <Icon className="size-5 text-accent" />
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
            </div>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          to="/dashboard/apps/crm/leads"
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Pipeline
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">Open lead pipeline</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Review funnel stages, inspect current prospects, and advance leads through the sales journey.
          </p>
        </Link>

        <Link
          to="/dashboard/apps/crm/cold-calls"
          className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm transition hover:-translate-y-0.5 hover:border-accent/40"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Outreach
          </p>
          <p className="mt-2 text-base font-semibold text-foreground">Open cold calls</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Register new leads, log call outcomes, and manage follow-up notes from the outbound queue.
          </p>
        </Link>
      </div>
    </div>
  )
}
