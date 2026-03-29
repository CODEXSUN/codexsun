import type { AppManifest } from "@framework/application/app-manifest"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AppWorkspacePreviewProps = {
  manifest: AppManifest
  accent: string
  capabilities: string[]
}

export function AppWorkspacePreview({
  manifest,
  accent,
  capabilities,
}: AppWorkspacePreviewProps) {
  const workspaceRoots = [
    { label: "Backend", value: manifest.workspace.backendRoot },
    { label: "Frontend", value: manifest.workspace.frontendRoot },
    { label: "Helper", value: manifest.workspace.helperRoot },
    { label: "Shared", value: manifest.workspace.sharedRoot },
    { label: "Migrations", value: manifest.workspace.migrationRoot },
    { label: "Seeders", value: manifest.workspace.seederRoot },
  ]

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.05),_transparent_38%),linear-gradient(180deg,_#fafaf9_0%,_#f5f5f4_100%)] px-6 py-8 text-foreground lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Card className="border border-border/70 bg-background/90 shadow-sm backdrop-blur">
          <CardHeader className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
              {accent}
            </p>
            <div className="space-y-2">
              <CardTitle className="font-heading text-3xl tracking-tight">
                {manifest.name}
              </CardTitle>
              <CardDescription className="max-w-3xl text-base leading-7">
                {manifest.description}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {workspaceRoots.map((root) => (
                <div
                  key={root.label}
                  className="rounded-xl border border-border/70 bg-background px-4 py-3"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {root.label}
                  </p>
                  <p className="mt-2 font-mono text-xs text-foreground">
                    {root.value}
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Dependencies
                </p>
                <p className="mt-2 text-sm text-foreground">
                  {manifest.dependencies.length > 0
                    ? manifest.dependencies.join(", ")
                    : "none"}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Capabilities
                </p>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {capabilities.map((capability) => (
                    <li key={capability}>{capability}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
