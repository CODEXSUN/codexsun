import { Hammer, Loader2, RefreshCcw, Trash2 } from "lucide-react"
import { useState } from "react"

import type {
  DeveloperOperationAction,
  DeveloperOperationResponse,
} from "../../../../../framework/shared/developer-operations"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showAppToast } from "@/components/ui/app-toast"

import { requestSettingsJson } from "./settings-request-json"

const recoveryActions: Array<{
  action: DeveloperOperationAction
  description: string
  details: string
  label: string
  icon: typeof Hammer
  tone: "default" | "outline"
}> = [
  {
    action: "build_frontend",
    label: "Build Frontend",
    description: "Run the standard `npm run build` flow and schedule a restart.",
    details: "Use this when code is updated but the built frontend needs a fresh compile without forcing a full dependency reinstall.",
    icon: Hammer,
    tone: "default",
  },
  {
    action: "clear_caches",
    label: "Clear Node + App Cache",
    description: "Clear npm cache plus local frontend build and Vite cache output.",
    details: "Use this when stale cached output is suspected and you want a clean base before trying another build.",
    icon: Trash2,
    tone: "outline",
  },
  {
    action: "force_clean_rebuild",
    label: "Force Clean Rebuild",
    description: "Clear caches, run `npm ci`, rebuild, and schedule restart.",
    details: "Use this as the safe bench-build-style recovery flow when the frontend output looks broken or partial after changes.",
    icon: RefreshCcw,
    tone: "outline",
  },
]

export function DeveloperBuildRecoveryTab() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<DeveloperOperationAction | null>(null)

  async function handleAction(action: DeveloperOperationAction) {
    setPendingAction(action)
    setError(null)
    setMessage(null)

    try {
      const response = await requestSettingsJson<DeveloperOperationResponse>(
        "/internal/v1/framework/developer-operations",
        {
          method: "POST",
          body: JSON.stringify({ action }),
        }
      )

      setMessage(response.message)
      showAppToast({
        variant: "success",
        title: "Developer operation completed.",
        description: response.message,
      })

      if (response.restartScheduled) {
        window.setTimeout(() => {
          window.location.reload()
        }, 2500)
      }
    } catch (actionError) {
      const nextError =
        actionError instanceof Error
          ? actionError.message
          : "Developer build recovery action failed."

      setError(nextError)
      showAppToast({
        variant: "error",
        title: "Developer operation failed.",
        description: nextError,
      })
    } finally {
      setPendingAction(null)
    }
  }

  return (
    <div className="space-y-5">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
        <CardHeader>
          <CardTitle>Build Recovery</CardTitle>
          <CardDescription>
            Frontend rebuild and cache recovery tools for developer use when the application output
            becomes stale or partially broken.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 xl:grid-cols-3">
          {recoveryActions.map((item) => {
            const Icon = item.icon
            const isPending = pendingAction === item.action

            return (
              <div
                key={item.action}
                className="flex h-full flex-col justify-between rounded-[1.25rem] border border-border/70 bg-background/70 p-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card/70">
                      <Icon className="size-[1.125rem]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.details}</p>
                </div>
                <Button
                  type="button"
                  variant={item.tone}
                  className="mt-4"
                  disabled={pendingAction !== null}
                  onClick={() => void handleAction(item.action)}
                >
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : null}
                  {isPending ? "Running..." : item.label}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
          {message}
        </div>
      ) : null}
    </div>
  )
}
