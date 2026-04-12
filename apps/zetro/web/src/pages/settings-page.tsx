import { Badge } from "@/components/ui/badge"
import { CardContent } from "@/components/ui/card"
import { useZetroSettingsQuery } from "../api/zetro-api"

import { ZetroDataState, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

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
  const settingsQuery = useZetroSettingsQuery()
  const settings = settingsQuery.data

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Settings"
        title="Output and runner policy"
        description="Persisted settings keep output modes and the runner lock visible before model or command providers are enabled."
      />

      <ZetroDataState error={settingsQuery.error} isLoading={settingsQuery.isLoading} />

      <div className="grid gap-4 xl:grid-cols-2">
        <ZetroPanel>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-foreground">Output modes</p>
              <Badge variant="secondary" className="rounded-md">
                default: {settings?.outputModes.defaultOutputMode ?? "loading"}
              </Badge>
            </div>
            <div className="grid gap-3">
              {(settings?.outputModes.modes ?? []).map((mode) => (
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-semibold text-foreground">Runner modes</p>
              <Badge variant="secondary" className="rounded-md">
                {settings?.runtimeLock.commandExecution ?? "disabled"}
              </Badge>
            </div>
            <div className="grid gap-3">
              {runnerModes.map((mode) => (
                <div key={mode.id} className="rounded-md border border-border/70 bg-background p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{mode.name}</p>
                    {mode.id === settings?.runtimeLock.runnerMode ? (
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
