import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { useZetroPlaybooksQuery } from "../api/zetro-api"

import { ZetroDataState, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroPlaybooksPage() {
  const playbooksQuery = useZetroPlaybooksQuery()
  const playbooks = playbooksQuery.data ?? []

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Playbooks"
        title="Persisted maximum-output catalog"
        description="These playbooks define the current Zetro capability surface with persisted phases, output modes, risk levels, and approval gates."
      />

      <ZetroDataState error={playbooksQuery.error} isLoading={playbooksQuery.isLoading} />

      <div className="grid gap-4 xl:grid-cols-2">
        {playbooks.map((playbook) => (
          <ZetroPanel key={playbook.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-foreground">{playbook.name}</p>
                  <p className="text-sm leading-6 text-muted-foreground">{playbook.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-md">
                    {playbook.kind}
                  </Badge>
                  <Badge variant={playbook.status === "active" ? "secondary" : "outline"} className="rounded-md">
                    {playbook.status}
                  </Badge>
                  <Badge variant={playbook.riskLevel === "critical" ? "destructive" : "outline"} className="rounded-md">
                    {playbook.riskLevel}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Output</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{playbook.defaultOutputMode}</p>
                </div>
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Approval</p>
                  <p className="mt-1 text-sm font-medium text-foreground">
                    {playbook.requiresApproval ? "Required" : "Not required"}
                  </p>
                </div>
                <div className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Phases</p>
                  <p className="mt-1 text-sm font-medium text-foreground">{playbook.phases.length}</p>
                </div>
              </div>

              <div className="space-y-2">
                {playbook.phases.map((phase) => (
                  <div key={phase.id} className="rounded-md border border-border/70 bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{phase.name}</p>
                      {phase.approvalGate ? (
                        <Badge variant="outline" className="rounded-md">approval gate</Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{phase.objective}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
