import { useEffect, useState } from "react"
import { CopyIcon, KeyRoundIcon, RefreshCwIcon } from "lucide-react"

import type { GeneratedMonitorSecretResponse } from "../../../../../framework/shared/remote-server-status"
import type { RuntimeSettingsSnapshot } from "../../../../../framework/shared/runtime-settings"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

const keyGeneratorShellTechnicalName = "shell.framework.remote-server-key-generator"

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

export function FrameworkRemoteServerKeyGeneratorSection() {
  const [generatedSecret, setGeneratedSecret] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  useGlobalLoading(isLoading)

  async function loadRuntimeSecret() {
    setIsLoading(true)
    setError(null)

    try {
      const snapshot = await requestJson<RuntimeSettingsSnapshot>(
        "/internal/v1/cxapp/runtime-settings"
      )
      setGeneratedSecret(String(snapshot.values.SERVER_MONITOR_SHARED_SECRET ?? ""))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to read runtime settings.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadRuntimeSecret()
  }, [])

  async function handleGenerate() {
    setIsLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<GeneratedMonitorSecretResponse>(
        "/internal/v1/framework/remote-server-secret/generate",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )

      setGeneratedSecret(String(response.snapshot.values.SERVER_MONITOR_SHARED_SECRET ?? ""))
      setMessage(
        "New secret generated and saved to .env. The value shown here is the current runtime env value."
      )
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to generate key.")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCopy() {
    if (!generatedSecret) {
      return
    }

    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setError("Clipboard access is not available in this browser.")
      return
    }

    try {
      await navigator.clipboard.writeText(generatedSecret)
      setMessage("Generated secret copied.")
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to copy secret.")
    }
  }

  return (
    <div className="space-y-5" data-technical-name={keyGeneratorShellTechnicalName}>
      <div className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/90 p-6 shadow-sm">
        <div className="absolute right-0 top-0 z-[70] flex max-w-[calc(100%-1rem)] flex-wrap justify-end gap-2">
          <TechnicalNameBadge name={keyGeneratorShellTechnicalName} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Framework Operations
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-foreground">
            Generate Server Key
          </h1>
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            Generate the server monitor key for this runtime, auto-save it into{" "}
            <code>.env</code>, and copy the same saved value for use on the remote server and in
            matching Live Server targets.
          </p>
        </div>
        {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
      </div>

      <Card className="border-border/70 bg-card/90">
        <CardHeader>
          <CardTitle>Key Generator</CardTitle>
          <CardDescription>
            Generate updates <code>SERVER_MONITOR_SHARED_SECRET</code> in runtime <code>.env</code>
            first, then this page reads the saved env snapshot back and shows the same value.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="generated-remote-monitor-secret">Generated Secret</Label>
            <Input
              id="generated-remote-monitor-secret"
              value={generatedSecret}
              readOnly
              placeholder="No runtime server monitor secret saved yet"
            />
            <p className="text-xs text-muted-foreground">
              Displayed value source: current runtime <code>.env</code>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button className="h-10 gap-2 bg-slate-950 text-white hover:bg-slate-800" onClick={() => void handleGenerate()} disabled={isLoading}>
              {generatedSecret ? <RefreshCwIcon className="size-4" /> : <KeyRoundIcon className="size-4" />}
              {generatedSecret ? "Regenerate Key" : "Generate Key"}
            </Button>
            <Button variant="outline" className="h-10 gap-2" onClick={() => void loadRuntimeSecret()} disabled={isLoading}>
              <RefreshCwIcon className="size-4" />
              Refresh from .env
            </Button>
            <Button variant="outline" className="h-10 gap-2" onClick={() => void handleCopy()} disabled={!generatedSecret || isLoading}>
              <CopyIcon className="size-4" />
              Copy Key
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
