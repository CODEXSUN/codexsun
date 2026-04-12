import { useEffect, useMemo, useState } from "react"

import type {
  FrappeConnectionVerification,
  FrappeSettings,
  FrappeSettingsUpdatePayload,
} from "@frappe/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import {
  getConnectionStatus,
  saveConnectionSettings,
  toVerificationBadge,
  triggerVerification,
  type FrappeConnectionUiState,
} from "../services/frappe"
import {
  MetricCard,
  SectionShell,
  StateCard,
  formatDateTime,
  toErrorMessage,
} from "./shared"

function toFormValues(settings: FrappeSettings): FrappeSettingsUpdatePayload {
  return {
    enabled: settings.enabled,
    baseUrl: settings.baseUrl,
    siteName: settings.siteName,
    apiKey: settings.apiKey,
    apiSecret: settings.apiSecret,
    timeoutSeconds: settings.timeoutSeconds,
    defaultCompany: settings.defaultCompany,
    defaultWarehouse: settings.defaultWarehouse,
  }
}

function hasFormChanges(
  current: FrappeSettingsUpdatePayload | null,
  baseline: FrappeSettings | null
) {
  if (!current || !baseline) {
    return false
  }

  const baselineValues = toFormValues(baseline)

  return (
    current.enabled !== baselineValues.enabled ||
    current.baseUrl !== baselineValues.baseUrl ||
    current.siteName !== baselineValues.siteName ||
    current.apiKey !== baselineValues.apiKey ||
    current.apiSecret !== baselineValues.apiSecret ||
    current.timeoutSeconds !== baselineValues.timeoutSeconds ||
    current.defaultCompany !== baselineValues.defaultCompany ||
    current.defaultWarehouse !== baselineValues.defaultWarehouse
  )
}

export function FrappeConnectionSection() {
  const { user } = useDashboardShell()
  const [settings, setSettings] = useState<FrappeSettings | null>(null)
  const [formValues, setFormValues] = useState<FrappeSettingsUpdatePayload | null>(null)
  const [verification, setVerification] =
    useState<FrappeConnectionVerification | null>(null)
  const [connectionState, setConnectionState] =
    useState<FrappeConnectionUiState>("failed")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    if (!user.isSuperAdmin) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getConnectionStatus()

        if (!cancelled) {
          setSettings(response.settings)
          setFormValues(toFormValues(response.settings))
          setConnectionState(response.state)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(toErrorMessage(nextError))
          setConnectionState("failed")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [user.isSuperAdmin])

  const hasUnsavedChanges = useMemo(
    () => hasFormChanges(formValues, settings),
    [formValues, settings]
  )

  if (!user.isSuperAdmin) {
    return (
      <SectionShell
        title="ERPNext Connection"
        description="Connection credentials remain visible only to the super-admin actor."
      >
        <StateCard message="This section is restricted because it exposes the live ERPNext connection state." />
      </SectionShell>
    )
  }

  if (isLoading) {
    return null
  }

  if (!settings || !formValues) {
    return (
      <SectionShell
        title="ERPNext Connection"
        description="Edit the Frappe env contract and verify the live handshake."
      >
        <StateCard message={error || "Frappe settings are unavailable."} />
      </SectionShell>
    )
  }

  async function handleSave() {
    const currentFormValues = formValues

    if (!currentFormValues) {
      return
    }

    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await saveConnectionSettings(currentFormValues)

      setSettings(response.settings)
      setFormValues(toFormValues(response.settings))
      setVerification(null)
      setConnectionState(response.state)
      setMessage("Frappe env contract saved to `.env`. Run verification to validate the new connection.")
      showRecordToast({
        entity: "Frappe env contract",
        action: "saved",
        recordId: "frappe-settings:env",
        recordName: response.settings.siteName,
      })
      showAppToast({
        variant: "success",
        title: "Frappe settings saved.",
        description: "Only the `FRAPPE_*` keys were updated in `.env`.",
      })
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVerify() {
    setIsVerifying(true)
    setConnectionState("verifying")
    setError(null)
    setMessage(null)

    try {
      const response = await triggerVerification()
      const status = await getConnectionStatus()

      setVerification(response.verification)
      setSettings(status.settings)
      setFormValues(toFormValues(status.settings))
      setConnectionState(response.state)
      setMessage("Live Frappe handshake completed.")
    } catch (nextError) {
      setVerification(null)
      setConnectionState("failed")
      setError(toErrorMessage(nextError))
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <SectionShell
      title="ERPNext Connection"
      description="Edit only the Frappe env contract in `.env`, then run a live handshake through the internal API."
      actions={
        <>
          <Button
            variant="outline"
            onClick={() => void handleSave()}
            disabled={isSaving || isVerifying || !hasUnsavedChanges}
          >
            {isSaving ? "Saving..." : "Save env contract"}
          </Button>
          <Button
            onClick={() => void handleVerify()}
            disabled={isVerifying || isSaving || hasUnsavedChanges}
          >
            {isVerifying ? "Verifying..." : "Verify live connection"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Status"
          value={toVerificationBadge(connectionState, verification)}
          hint="Status is derived from the last live handshake recorded for the current env config."
        />
        <MetricCard
          label="ERP User"
          value={settings.lastVerifiedUser || "Not verified"}
          hint="Authenticated user returned by the ERPNext handshake."
        />
        <MetricCard
          label="Latency"
          value={
            settings.lastVerifiedLatencyMs != null
              ? `${settings.lastVerifiedLatencyMs} ms`
              : "Pending"
          }
          hint="Measured response time from the last verification call."
        />
        <MetricCard
          label="Timeout"
          value={`${settings.timeoutSeconds}s`}
          hint="Live timeout budget enforced by the backend connection factory."
        />
        <MetricCard
          label="Config Source"
          value={settings.configSource === "env" ? ".env" : "Unavailable"}
          hint="The browser edits only the Frappe-specific env contract through the backend."
        />
      </div>

      {error ? <StateCard message={error} /> : null}
      {message ? <StateCard message={message} /> : null}

      {verification ? (
        <Card
          className={
            verification.status === "success"
              ? "border-emerald-500/40"
              : "border-destructive/40"
          }
        >
          <CardContent className="space-y-1 p-5 text-sm">
            <p
              className={
                verification.status === "success"
                  ? "font-medium text-emerald-700"
                  : "font-medium text-destructive"
              }
            >
              {verification.status === "success"
                ? "Connected \u2705"
                : "Failed \u274C"}
            </p>
            <p className="text-muted-foreground">
              User:{" "}
              <span className="font-medium text-foreground">
                {verification.user || "Unavailable"}
              </span>
            </p>
            <p className="text-muted-foreground">
              Latency:{" "}
              <span className="font-medium text-foreground">
                {verification.latencyMs} ms
              </span>
            </p>
            <p className="text-muted-foreground">
              Checked at {formatDateTime(verification.verifiedAt)}
            </p>
            {verification.error ? (
              <p className="text-muted-foreground">Error: {verification.error}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Live Env Contract</CardTitle>
            <CardDescription>
              Saving here rewrites only the `FRAPPE_*` keys in `.env`. The backend
              still fails connection attempts fast when the contract is invalid.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="frappe-base-url">Base URL</Label>
              <Input
                id="frappe-base-url"
                value={formValues.baseUrl}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, baseUrl: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frappe-site-name">Site Name</Label>
              <Input
                id="frappe-site-name"
                value={formValues.siteName}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, siteName: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frappe-api-key">API Key</Label>
              <Input
                id="frappe-api-key"
                type="password"
                value={formValues.apiKey}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, apiKey: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frappe-api-secret">API Secret</Label>
              <Input
                id="frappe-api-secret"
                type="password"
                value={formValues.apiSecret}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, apiSecret: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frappe-timeout-seconds">Timeout Seconds</Label>
              <Input
                id="frappe-timeout-seconds"
                type="number"
                min={1}
                max={120}
                value={String(formValues.timeoutSeconds)}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? {
                          ...current,
                          timeoutSeconds: Number(event.target.value || "0"),
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Integration Enabled
                </p>
                <p className="text-xs text-muted-foreground">
                  Controls `FRAPPE_ENABLED` only. Verification and live writes stay blocked when disabled.
                </p>
              </div>
              <Switch
                checked={formValues.enabled}
                onCheckedChange={(checked) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, enabled: checked }
                      : current
                  )
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projection Defaults</CardTitle>
            <CardDescription>
              These fields also live under `FRAPPE_*` in `.env` and are saved
              with the same scoped action.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="frappe-default-company">Default Company</Label>
              <Input
                id="frappe-default-company"
                value={formValues.defaultCompany}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, defaultCompany: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="frappe-default-warehouse">Default Warehouse</Label>
              <Input
                id="frappe-default-warehouse"
                value={formValues.defaultWarehouse}
                onChange={(event) =>
                  setFormValues((current) =>
                    current
                      ? { ...current, defaultWarehouse: event.target.value }
                      : current
                  )
                }
              />
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Last Verification</p>
              <p>
                {settings.lastVerifiedAt
                  ? formatDateTime(settings.lastVerifiedAt)
                  : "Not verified yet"}
              </p>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/70 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Credential Status</p>
              <p>
                {settings.hasApiKey && settings.hasApiSecret
                  ? "Configured in `.env`"
                  : "Missing from `.env`"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
