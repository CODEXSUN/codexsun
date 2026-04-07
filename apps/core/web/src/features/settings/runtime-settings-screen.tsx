import { useEffect, useMemo, useState } from "react"

import {
  runtimeSettingGroups,
  type RuntimeSettingGroup,
  type RuntimeSettingsSaveResponse,
  type RuntimeSettingsSnapshot,
} from "../../../../../framework/shared/runtime-settings"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { getActivityStatusPanelClassName } from "@/features/status/activity-status"
import { cn } from "@/lib/utils"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

type RuntimeSettingsValueMap = RuntimeSettingsSnapshot["values"]

function generateJwtSecret() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_!@#$%^&*"
  const bytes = new Uint8Array(48)
  window.crypto.getRandomValues(bytes)

  return Array.from(bytes, (value) => characters[value % characters.length]).join("")
}

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

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null

    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return (await response.json()) as T
}

function SettingsBooleanField({
  checked,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean
  id: string
  label: string
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className={cn(
          "flex cursor-pointer items-center justify-between rounded-xl px-3 py-2",
          getActivityStatusPanelClassName(checked ? "active" : "inactive")
        )}
      >
        <p className="text-sm font-medium text-foreground">{checked ? "Enabled" : "Disabled"}</p>
        <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      </label>
    </div>
  )
}

function RuntimeSettingsGroupCard({
  group,
  values,
  onChange,
}: {
  group: RuntimeSettingGroup
  values: RuntimeSettingsValueMap
  onChange: (key: string, value: string | boolean) => void
}) {
  return (
    <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
      <CardHeader>
        <CardTitle>{group.label}</CardTitle>
        <CardDescription className="text-xs">{group.summary}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        {group.fields.map((field) => {
          const value = values[field.key]
          const elementId = `core-setting-${field.key.toLowerCase()}`

          if (field.type === "boolean") {
            return (
              <SettingsBooleanField
                key={field.key}
                id={elementId}
                label={field.label}
                checked={Boolean(value)}
                onCheckedChange={(checked) => onChange(field.key, checked)}
              />
            )
          }

          return (
            <div key={field.key} className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={elementId}>{field.label}</Label>
                {field.key === "JWT_SECRET" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onChange("JWT_SECRET", generateJwtSecret())}
                  >
                    Generate Secret
                  </Button>
                ) : null}
              </div>
              {field.type === "select" ? (
                <Select
                  value={typeof value === "string" ? value : ""}
                  onValueChange={(nextValue) => onChange(field.key, nextValue)}
                >
                  <SelectTrigger id={elementId}>
                    <SelectValue placeholder={field.placeholder ?? `Select ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {(field.options ?? []).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="space-y-1.5">
                  <Input
                    id={elementId}
                    type={field.type === "password" ? "password" : field.type}
                    placeholder={field.placeholder}
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => onChange(field.key, event.target.value)}
                  />
                  {field.description ? (
                    <p className="text-[11px] text-muted-foreground">{field.description}</p>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function RuntimeSettingsScreen({
  title,
  description,
  recordId,
  recordName,
  groupIds,
}: {
  title: string
  description: string
  recordId: string
  recordName: string
  groupIds?: string[]
}) {
  const [envFilePath, setEnvFilePath] = useState("")
  const [values, setValues] = useState<RuntimeSettingsValueMap>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const snapshot = await requestJson<RuntimeSettingsSnapshot>(
          "/internal/v1/cxapp/runtime-settings"
        )

        if (!cancelled) {
          setEnvFilePath(snapshot.envFilePath)
          setValues(snapshot.values)
          setIsLoading(false)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load runtime settings."
          )
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleSave(restart: boolean) {
    setIsSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await requestJson<RuntimeSettingsSaveResponse>(
        "/internal/v1/cxapp/runtime-settings",
        {
          method: "POST",
          body: JSON.stringify({
            values,
            restart,
          }),
        }
      )

      setEnvFilePath(response.snapshot.envFilePath)
      setValues(response.snapshot.values)
      setMessage(
        restart
          ? "Settings saved. Restarting application..."
          : "Settings saved. Restart the application when you want the new values to apply."
      )
      showRecordToast({
        entity: title,
        action: "saved",
        recordName,
        recordId,
      })
      if (!restart) {
        showAppToast({
          variant: "warning",
          title: "Restart pending.",
          description: `The record "${recordName}" is saved successfully. Restart the application when you want the new values to apply.`,
        })
      }

      if (restart) {
        window.setTimeout(() => {
          window.location.reload()
        }, 2500)
      }
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Failed to save runtime settings."
      )
    } finally {
      setIsSaving(false)
    }
  }

  const groups = useMemo(
    () =>
      groupIds && groupIds.length > 0
        ? runtimeSettingGroups.filter((group) => groupIds.includes(group.id))
        : runtimeSettingGroups,
    [groupIds]
  )

  const tabs = useMemo<AnimatedContentTab[]>(
    () =>
      groups.map((group) => ({
        label: group.label,
        value: group.id,
        content: (
          <RuntimeSettingsGroupCard
            group={group}
            values={values}
            onChange={(key, nextValue) =>
              setValues((current) => ({ ...current, [key]: nextValue }))
            }
          />
        ),
      })),
    [groups, values]
  )

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading runtime settings...
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <p className="text-xs text-muted-foreground">{envFilePath || "-"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button type="button" onClick={() => void handleSave(true)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save & Restart"}
          </Button>
        </div>
      </div>

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

      {groups.length > 1 ? (
        <AnimatedTabs defaultTabValue={groups[0]?.id ?? "application"} tabs={tabs} />
      ) : groups[0] ? (
        <RuntimeSettingsGroupCard
          group={groups[0]}
          values={values}
          onChange={(key, nextValue) =>
            setValues((current) => ({ ...current, [key]: nextValue }))
          }
        />
      ) : (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No runtime setting groups are configured for this section.
          </CardContent>
        </Card>
      )}
    </div>
  )
}
