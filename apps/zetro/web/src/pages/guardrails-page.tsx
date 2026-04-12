import { zetroGuardrailTemplates } from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

export function ZetroGuardrailsPage() {
  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Guardrails"
        title="Runner safety rules"
        description="Guardrails start as advisory templates. Blocking mode only becomes active after persistence, approvals, and runner policy are implemented."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {zetroGuardrailTemplates.map((guardrail) => (
          <ZetroPanel key={guardrail.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{guardrail.name}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{guardrail.summary}</p>
                </div>
                <Badge variant={guardrail.severity === "blocking" ? "destructive" : "outline"} className="rounded-md">
                  {guardrail.severity}
                </Badge>
              </div>
              <Badge variant="secondary" className="rounded-md">
                {guardrail.event}
              </Badge>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
