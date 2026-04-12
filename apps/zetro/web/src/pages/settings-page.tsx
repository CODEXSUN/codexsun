import { zetroDefaultOutputMode, zetroOutputModes } from "@zetro/shared"
import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"

import { ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

const runnerModes = [
  {
    id: "manual",
    name: "Manual",
    summary: "Store plans, run events, and findings with no command execution.",
    active: true,
  },
  {
    id: "advisory",
    name: "Advisory",
    summary: "Propose commands and review actions without executing them.",
    active: false,
  },
  {
    id: "approved-cli",
    name: "Approved CLI",
    summary: "Run allowlisted commands after explicit approval and output capture.",
    active: false,
  },
] as const

export function ZetroSettingsPage() {
  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Settings"
        title="Output and runner policy"
        description="Phase 1 keeps settings static. Phase 2 persists them and Phase 5 starts advisory command proposals."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ZetroPanel>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-foreground">Output modes</p>
              <Badge variant="secondary" className="rounded-md">
                default: {zetroDefaultOutputMode}
              </Badge>
            </div>
            <div className="grid gap-3">
              {zetroOutputModes.map((mode) => (
                <div key={mode.id} className="rounded-md border border-border/70 bg-background p-3">
                  <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{mode.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </ZetroPanel>

        <ZetroPanel>
          <CardContent className="space-y-4 p-5">
            <p className="font-semibold text-foreground">Runner modes</p>
            <div className="grid gap-3">
              {runnerModes.map((mode) => (
                <div key={mode.id} className="rounded-md border border-border/70 bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                    {mode.active ? (
                      <Badge variant="secondary" className="rounded-md">active</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-md">planned</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{mode.summary}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </ZetroPanel>
      </div>
    </div>
  )
}
