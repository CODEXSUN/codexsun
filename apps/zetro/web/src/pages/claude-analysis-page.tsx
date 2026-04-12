import { zetroClaudeSignals, zetroStaticPlaybooks } from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { CardContent, CardDescription, CardHeader } from "@/components/ui/card"

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroClaudeAnalysisPage() {
  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Reference"
        title="Claude capability map"
        description="Use Claude Code as a capability reference while reimplementing playbooks, review lanes, guardrails, and output profiles as Codexsun-owned Zetro code."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {zetroClaudeSignals.map((signal) => (
          <ZetroPanel key={signal.id}>
            <CardHeader className="space-y-2 p-5">
              <Badge variant="secondary" className="w-fit rounded-md">
                {signal.label}
              </Badge>
              <CardDescription className="text-sm leading-6">
                {signal.source}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0">
              <p className="text-sm leading-6 text-foreground">{signal.adaption}</p>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>

      <ZetroPanel>
        <CardContent className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
          {zetroStaticPlaybooks.map((playbook) => (
            <div key={playbook.id} className="rounded-md border border-border/70 bg-background p-4">
              <Badge variant="outline" className="rounded-md">
                {playbook.family}
              </Badge>
              <p className="mt-3 font-semibold text-foreground">{playbook.name}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{playbook.summary}</p>
            </div>
          ))}
        </CardContent>
      </ZetroPanel>
    </div>
  )
}
