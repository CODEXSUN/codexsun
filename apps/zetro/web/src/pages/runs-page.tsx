import { zetroSampleRuns, zetroStaticPlaybooks } from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroRunsPage() {
  const playbookNameById = new Map(zetroStaticPlaybooks.map((playbook) => [playbook.id, playbook.name]))

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Runs"
        title="Manual run console preview"
        description="Phase 1 shows the run shape without persistence or command execution. Phase 4 turns this into a reloadable run console."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {zetroSampleRuns.map((run) => (
          <ZetroPanel key={run.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{run.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{run.summary}</p>
                </div>
                <Badge variant="outline" className="rounded-md">
                  {run.status}
                </Badge>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Playbook</p>
                  <p className="mt-1 text-sm text-foreground">{playbookNameById.get(run.playbookId) ?? run.playbookId}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Output mode</p>
                  <p className="mt-1 text-sm text-foreground">{run.outputMode}</p>
                </div>
              </div>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
