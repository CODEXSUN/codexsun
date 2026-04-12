import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { useZetroFindingsQuery } from "../api/zetro-api"

import { ZetroDataState, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroFindingsPage() {
  const findingsQuery = useZetroFindingsQuery()
  const findings = findingsQuery.data ?? []

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Findings"
        title="Review findings board"
        description="Persisted findings keep severity, confidence, category, status, run linkage, and follow-up readiness."
      />

      <ZetroDataState error={findingsQuery.error} isLoading={findingsQuery.isLoading} />

      <div className="grid gap-4 md:grid-cols-2">
        {findings.map((finding) => (
          <ZetroPanel key={finding.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{finding.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.summary}</p>
                </div>
                <Badge variant={finding.severity === "high" ? "destructive" : "outline"} className="rounded-md">
                  {finding.severity}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-md">{finding.category}</Badge>
                <Badge variant="secondary" className="rounded-md">{finding.confidence}% confidence</Badge>
                <Badge variant="outline" className="rounded-md">{finding.status}</Badge>
                {finding.runId ? (
                  <Badge variant="outline" className="rounded-md">{finding.runId}</Badge>
                ) : null}
              </div>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
