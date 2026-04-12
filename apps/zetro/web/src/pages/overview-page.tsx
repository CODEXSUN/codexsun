import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  zetroWorkspaceItems,
} from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { useZetroSummaryQuery } from "../api/zetro-api"

import {
  ZetroDataState,
  ZetroMetricPanel,
  ZetroPanel,
  ZetroSectionIntro,
} from "./zetro-page-shell"

export function ZetroOverviewPage() {
  const summaryQuery = useZetroSummaryQuery()
  const summary = summaryQuery.data
  const overviewMetrics = summary
    ? [
        {
          label: "Playbooks",
          value: String(summary.playbooks),
          detail: `${summary.activePlaybooks} active, ${summary.approvalRequiredPlaybooks} approval gated.`,
        },
        {
          label: "Output default",
          value: summary.defaultOutputMode,
          detail: "Planning starts with the persisted default output mode.",
        },
        {
          label: "Guardrails",
          value: String(summary.guardrails),
          detail: `Highest playbook risk: ${summary.highestPlaybookRisk ?? "none"}.`,
        },
        {
          label: "Runs",
          value: String(summary.runs),
          detail: `${summary.activeRuns} active manual runs are persisted.`,
        },
        {
          label: "Findings",
          value: String(summary.findings),
          detail: `${summary.openFindings} findings remain open.`,
        },
        {
          label: "Runner lock",
          value: summary.runnerMode,
          detail: `Command execution: ${summary.commandExecution}.`,
        },
      ]
    : []

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Zetro"
        title="High-output agent operations"
        description="Plan, review, guard, and eventually execute Codexsun work through app-owned playbooks with visible output modes and approval gates."
      />

      <ZetroDataState error={summaryQuery.error} isLoading={summaryQuery.isLoading} />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {overviewMetrics.map((metric) => (
          <ZetroMetricPanel key={metric.label} {...metric} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {zetroWorkspaceItems.slice(1).map((item) => (
          <ZetroPanel key={item.id}>
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-base font-semibold text-foreground">{item.name}</p>
                  <Badge variant="outline" className="rounded-md">
                    {item.id}
                  </Badge>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{item.summary}</p>
              </div>
              <Button asChild variant="outline" className="mt-auto w-fit rounded-md">
                <Link to={item.route}>
                  Open
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
