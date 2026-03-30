import { useEffect, useState } from "react"

import type { FrappeConnectionVerification, FrappeSettingsUpdatePayload } from "@frappe/shared"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useDashboardShell } from "@/features/dashboard/dashboard-shell"

import {
  getFrappeSettings,
  updateFrappeSettings,
  verifyFrappeConnection,
} from "../api/frappe-api"
import {
  createDefaultSettingsValues,
  Field,
  MetricCard,
  NativeCheckbox,
  SectionShell,
  StateCard,
  toErrorMessage,
  toSettingsValues,
} from "./shared"

export function FrappeConnectionSection() {
  const { user } = useDashboardShell()
  const [values, setValues] = useState<FrappeSettingsUpdatePayload>(
    createDefaultSettingsValues()
  )
  const [isConfigured, setIsConfigured] = useState(false)
  const [verification, setVerification] =
    useState<FrappeConnectionVerification | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

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
        const response = await getFrappeSettings()

        if (!cancelled) {
          setValues(toSettingsValues(response.settings))
          setIsConfigured(response.settings.isConfigured)
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(toErrorMessage(nextError))
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

  if (!user.isSuperAdmin) {
    return (
      <SectionShell
        title="ERPNext Connection"
        description="Connection credentials remain visible only to the super-admin actor."
      >
        <StateCard message="This section is restricted because it contains ERPNext credentials and live connector defaults." />
      </SectionShell>
    )
  }

  if (isLoading) {
    return <StateCard message="Loading ERPNext connection settings." />
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)

    try {
      const response = await updateFrappeSettings(values)
      setValues(toSettingsValues(response.settings))
      setIsConfigured(response.settings.isConfigured)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleVerify() {
    setIsVerifying(true)
    setError(null)

    try {
      const response = await verifyFrappeConnection(values)
      setVerification(response.verification)
    } catch (nextError) {
      setError(toErrorMessage(nextError))
      setVerification(null)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <SectionShell
      title="ERPNext Connection"
      description="Store connector credentials, default master mappings, and test the ERPNext endpoint before enabling live flows."
      actions={(
        <>
          <Button variant="outline" onClick={() => void handleVerify()} disabled={isSaving || isVerifying}>
            {isVerifying ? "Verifying..." : "Verify connection"}
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving || isVerifying}>
            {isSaving ? "Saving..." : "Save settings"}
          </Button>
        </>
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Connector"
          value={values.enabled ? "Enabled" : "Disabled"}
          hint="Turn this on only after a successful ERPNext verification."
        />
        <MetricCard
          label="Credentials"
          value={isConfigured ? "Ready" : "Incomplete"}
          hint="App-owned settings are stored in the Frappe database table."
        />
        <MetricCard
          label="Timeout"
          value={`${values.timeoutSeconds}s`}
          hint="Request timeout used by the verification call."
        />
        <MetricCard
          label="ERPNext Site"
          value={values.siteName || "Default"}
          hint={values.baseUrl || "Base URL is not set yet."}
        />
      </div>

      {error ? <StateCard message={error} /> : null}

      {verification ? (
        <Card className={verification.ok ? "border-emerald-500/40" : "border-destructive/40"}>
          <CardContent className="space-y-1 p-5 text-sm">
            <p className={verification.ok ? "font-medium text-emerald-700" : "font-medium text-destructive"}>
              {verification.message}
            </p>
            <p className="text-muted-foreground">{verification.detail}</p>
            <p className="text-muted-foreground">
              Server: <span className="font-medium text-foreground">{verification.serverUrl || "Not provided"}</span>
              {verification.connectedUser ? ` | User: ${verification.connectedUser}` : ""}
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Connection Settings</CardTitle>
            <CardDescription>
              Connector credentials remain app-owned and are not written into framework-level config.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Integration enabled" hint="Use only after a clean verification run.">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/70 px-3 py-2">
                <NativeCheckbox
                  checked={values.enabled}
                  onChange={(checked) => setValues((current) => ({ ...current, enabled: checked }))}
                />
                <span className="text-sm text-muted-foreground">Enable ERPNext-backed sync flows</span>
              </div>
            </Field>
            <Field label="Timeout seconds">
              <Input
                type="number"
                min="1"
                max="120"
                value={String(values.timeoutSeconds)}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    timeoutSeconds: Number(event.target.value || 15),
                  }))
                }
              />
            </Field>
            <Field label="ERPNext Base URL" hint="Example: https://erp.example.com">
              <Input
                value={values.baseUrl}
                onChange={(event) =>
                  setValues((current) => ({ ...current, baseUrl: event.target.value }))
                }
              />
            </Field>
            <Field label="Site Name" hint="Optional for multi-site ERPNext benches.">
              <Input
                value={values.siteName}
                onChange={(event) =>
                  setValues((current) => ({ ...current, siteName: event.target.value }))
                }
              />
            </Field>
            <Field label="API Key">
              <Input
                value={values.apiKey}
                onChange={(event) =>
                  setValues((current) => ({ ...current, apiKey: event.target.value }))
                }
              />
            </Field>
            <Field label="API Secret">
              <Input
                type="password"
                value={values.apiSecret}
                onChange={(event) =>
                  setValues((current) => ({ ...current, apiSecret: event.target.value }))
                }
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default Mappings</CardTitle>
            <CardDescription>
              Saved defaults the connector uses when it projects ERPNext records into our app-owned flows.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Field label="Default Company">
              <Input
                value={values.defaultCompany}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultCompany: event.target.value }))
                }
              />
            </Field>
            <Field label="Default Warehouse">
              <Input
                value={values.defaultWarehouse}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultWarehouse: event.target.value }))
                }
              />
            </Field>
            <Field label="Default Price List">
              <Input
                value={values.defaultPriceList}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultPriceList: event.target.value }))
                }
              />
            </Field>
            <Field label="Default Customer Group">
              <Input
                value={values.defaultCustomerGroup}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultCustomerGroup: event.target.value }))
                }
              />
            </Field>
            <Field label="Default Item Group">
              <Input
                value={values.defaultItemGroup}
                onChange={(event) =>
                  setValues((current) => ({ ...current, defaultItemGroup: event.target.value }))
                }
              />
            </Field>
          </CardContent>
        </Card>
      </div>
    </SectionShell>
  )
}
