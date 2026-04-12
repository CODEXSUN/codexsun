import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  zetroDefaultOutputMode,
  zetroGuardrailTemplates,
  zetroOutputModes,
  zetroSampleFindings,
  zetroSampleRuns,
  zetroStaticPlaybooks,
  zetroWorkspaceItems,
} from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"

import { ZetroMetricPanel, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

const overviewMetrics = [
  {
    label: "Playbooks",
    value: String(zetroStaticPlaybooks.length),
    detail: "Static maximum-output catalog entries ready for persistence in Phase 2.",
  },
  {
    label: "Output default",
    value: zetroDefaultOutputMode,
    detail: "Planning starts in maximum mode unless a playbook overrides it.",
  },
  {
    label: "Guardrails",
    value: String(zetroGuardrailTemplates.length),
    detail: "Advisory and blocking rule templates before live runner work begins.",
  },
  {
    label: "Sample runs",
    value: String(zetroSampleRuns.length),
    detail: "Run console shape without shell execution or database dependency.",
  },
  {
    label: "Findings",
    value: String(zetroSampleFindings.length),
    detail: "Review output format for the future persisted findings board.",
  },
  {
    label: "Output modes",
    value: String(zetroOutputModes.length),
    detail: "Brief, normal, detailed, maximum, and audit profiles.",
  },
] as const

export function ZetroOverviewPage() {
  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Zetro"
        title="High-output agent operations"
        description="Plan, review, guard, and eventually execute Codexsun work through app-owned playbooks with visible output modes and approval gates."
      />

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
