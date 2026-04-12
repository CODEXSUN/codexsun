import { zetroRolloutSteps } from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroRolloutPlanPage() {
  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Plan"
        title="Build rollout"
        description="Move from static catalog to persistence, internal API, manual run console, advisory runner, approved CLI runner, and review automation."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {zetroRolloutSteps.map((step) => (
          <ZetroPanel key={step.id}>
            <CardContent className="space-y-3 p-5">
              <Badge variant="outline" className="w-fit rounded-md">
                {step.label}
              </Badge>
              <p className="text-sm leading-6 text-foreground">{step.scope}</p>
              <div className="rounded-md border border-border/70 bg-background p-3">
                <p className="text-sm leading-6 text-muted-foreground">{step.exitCheck}</p>
              </div>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
