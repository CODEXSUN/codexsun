import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { PermissionScopeType } from "@core/shared"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  createFrameworkPermission,
  getFrameworkPermission,
  updateFrameworkPermission,
} from "./user-api"
import { SectionShell, StateCard } from "./user-shared"
import { useRuntimeAppSettings } from "../runtime-app-settings/runtime-app-settings-provider"

type PermissionFormValues = {
  actionKey: string
  appId: string
  isActive: boolean
  key: string
  name: string
  resourceKey: string
  route: string
  scopeType: PermissionScopeType
  summary: string
}

type PermissionFieldErrors = Partial<Record<keyof PermissionFormValues, string>>

type ResourceOption = {
  appId: string | null
  label: string
  route: string | null
  value: string
}

function createDefaultPermissionFormValues(): PermissionFormValues {
  return {
    actionKey: "view",
    appId: "",
    isActive: true,
    key: "",
    name: "",
    resourceKey: "",
    route: "",
    scopeType: "module",
    summary: "",
  }
}

function slugifyPermissionSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
}

function createPermissionKey(values: PermissionFormValues) {
  const namespace = slugifyPermissionSegment(values.appId || values.scopeType)
  const resource = slugifyPermissionSegment(values.resourceKey)
  const action = slugifyPermissionSegment(values.actionKey)
  return [namespace, resource, action].filter(Boolean).join(":")
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-40 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/80" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function PermissionField({
  children,
  error,
  label,
}: {
  children: React.ReactNode
  error?: string
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className={error ? "text-destructive" : undefined}>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  )
}

function PermissionSectionCard({
  children,
  description,
  title,
}: {
  children: React.ReactNode
  description: string
  title: string
}) {
  return (
    <Card className="border-border/70 bg-background/95 shadow-sm">
      <CardContent className="space-y-5 p-5">
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
}

function validatePermissionForm(values: PermissionFormValues) {
  const errors: PermissionFieldErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = "Permission name is required."
  }

  if (values.summary.trim().length < 2) {
    errors.summary = "Summary is required."
  }

  if (!values.resourceKey.trim()) {
    errors.resourceKey = "Resource is required."
  }

  if (!values.actionKey.trim()) {
    errors.actionKey = "Action is required."
  }

  const generatedKey = values.key.trim() || createPermissionKey(values)
  if (!generatedKey || !/^[a-z0-9]+(?::[a-z0-9_]+)+$/.test(generatedKey)) {
    errors.key = "Use lowercase namespace segments separated by colons."
  }

  if (values.scopeType !== "desk" && !values.appId.trim()) {
    errors.appId = "App is required for this scope."
  }

  return errors
}

export function FrameworkPermissionUpsertSection({ permissionId }: { permissionId?: string }) {
  const navigate = useNavigate()
  const { settings } = useRuntimeAppSettings()
  const isEditing = Boolean(permissionId)
  const [form, setForm] = useState<PermissionFormValues>(createDefaultPermissionFormValues())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<PermissionFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)

  const scopeTypeOptions = useMemo(
    () =>
      (settings?.authMetadata.permissionScopeTypes ?? []).map((option) => ({
        label: option.label,
        value: option.key as PermissionScopeType,
      })),
    [settings]
  )
  const actionOptions = useMemo(
    () => settings?.authMetadata.permissionActionTypes ?? [],
    [settings]
  )
  const appOptions = useMemo(
    () => settings?.authMetadata.apps ?? [],
    [settings]
  )
  const resourceOptions = useMemo(
    () =>
      (settings?.authMetadata.resources ?? [])
        .filter((option) => option.scopeType === form.scopeType)
        .filter((option) => form.scopeType === "desk" || !form.appId || option.appId === form.appId)
        .map((option) => ({
          appId: option.appId,
          label: option.label,
          route: option.route,
          value: option.key,
        }) satisfies ResourceOption),
    [settings, form.scopeType, form.appId]
  )

  useEffect(() => {
    let cancelled = false

    async function loadPermission() {
      setIsLoading(true)
      setLoadError(null)

      try {
        if (!permissionId) {
          setForm(createDefaultPermissionFormValues())
          setIsLoading(false)
          return
        }

        const response = await getFrameworkPermission(permissionId)

        if (!cancelled) {
          setForm({
            actionKey: response.item.actionKey,
            appId: response.item.appId ?? "",
            isActive: response.item.isActive,
            key: response.item.key,
            name: response.item.name,
            resourceKey: response.item.resourceKey,
            route: response.item.route ?? "",
            scopeType: response.item.scopeType,
            summary: response.item.summary,
          })
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load permission.")
          setIsLoading(false)
        }
      }
    }

    void loadPermission()

    return () => {
      cancelled = true
    }
  }, [permissionId])

  async function handleSave() {
    const nextFieldErrors = validatePermissionForm(form)
    setFieldErrors(nextFieldErrors)
    setFormError(null)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError("Fix the highlighted fields and save again.")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        actionKey: form.actionKey.trim(),
        appId: form.scopeType === "desk" ? null : form.appId.trim() || null,
        isActive: form.isActive,
        key: form.key.trim() || createPermissionKey(form),
        name: form.name.trim(),
        resourceKey: form.resourceKey.trim(),
        route: form.route.trim() || null,
        scopeType: form.scopeType,
        summary: form.summary.trim(),
      }

      const response = permissionId
        ? await updateFrameworkPermission(permissionId, payload)
        : await createFrameworkPermission(payload)

      void navigate(`/dashboard/settings/permissions/${encodeURIComponent(response.item.key)}/edit`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save permission.")
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: AnimatedContentTab[] = [
    {
      label: "Details",
      value: "details",
      content: (
        <div className="space-y-5">
          <PermissionSectionCard
            title="Permission Details"
            description="Define the permission identity used by roles and access evaluation."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <PermissionField label="Permission Name" error={fieldErrors.name}>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, name: event.target.value }))
                    setFieldErrors((current) => ({ ...current, name: undefined }))
                  }}
                  className={fieldErrors.name ? "border-destructive" : undefined}
                />
              </PermissionField>
              <PermissionField label="Scope Type" error={fieldErrors.scopeType}>
                <Select
                  value={form.scopeType}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      scopeType: value as PermissionScopeType,
                      appId: value === "desk" ? "" : current.appId,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent>
                    {scopeTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionField>
              <PermissionField label="Action" error={fieldErrors.actionKey}>
                <Select
                  value={form.actionKey}
                  onValueChange={(value) => setForm((current) => ({ ...current, actionKey: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    {actionOptions.map((option) => (
                      <SelectItem key={option.key} value={option.key}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionField>
              <PermissionField label="Permission Key" error={fieldErrors.key}>
                <Input
                  value={form.key}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, key: event.target.value.toLowerCase() }))
                    setFieldErrors((current) => ({ ...current, key: undefined }))
                  }}
                  className={fieldErrors.key ? "border-destructive" : undefined}
                />
              </PermissionField>
              <PermissionField label="Summary" error={fieldErrors.summary}>
                <Input
                  value={form.summary}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, summary: event.target.value }))
                    setFieldErrors((current) => ({ ...current, summary: undefined }))
                  }}
                  className={fieldErrors.summary ? "border-destructive" : undefined}
                />
              </PermissionField>
            </div>
          </PermissionSectionCard>
        </div>
      ),
    },
    {
      label: "Target",
      value: "target",
      content: (
        <div className="space-y-5">
          <PermissionSectionCard
            title="Permission Target"
            description="Attach this permission to desk, workspace, module, page, report, or module definition surfaces."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <PermissionField label="App" error={fieldErrors.appId}>
                <Select
                  value={form.appId || "__none__"}
                  onValueChange={(value) =>
                    setForm((current) => ({ ...current, appId: value === "__none__" ? "" : value }))
                  }
                >
                  <SelectTrigger className={fieldErrors.appId ? "border-destructive" : undefined}>
                    <SelectValue placeholder="Select app" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Framework / none</SelectItem>
                    {appOptions.map((app) => (
                      <SelectItem key={app.key} value={app.key}>
                        {app.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionField>
              <PermissionField label="Resource" error={fieldErrors.resourceKey}>
                <Select
                  value={form.resourceKey || "__none__"}
                  onValueChange={(value) => {
                    if (value === "__none__") {
                      setForm((current) => ({ ...current, resourceKey: "", route: "" }))
                      return
                    }

                    const nextOption = resourceOptions.find((option) => option.value === value)
                    setForm((current) => ({
                      ...current,
                      appId: nextOption?.appId ?? current.appId,
                      resourceKey: value,
                      route: nextOption?.route ?? current.route,
                    }))
                    setFieldErrors((current) => ({ ...current, resourceKey: undefined, appId: undefined }))
                  }}
                >
                  <SelectTrigger className={fieldErrors.resourceKey ? "border-destructive" : undefined}>
                    <SelectValue placeholder="Select resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Select resource</SelectItem>
                    {resourceOptions.map((option) => (
                      <SelectItem key={`${option.appId}:${option.value}`} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PermissionField>
              <PermissionField label="Route">
                <Input
                  value={form.route}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, route: event.target.value }))
                  }
                />
              </PermissionField>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Keep this permission assignable to roles.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </label>
          </PermissionSectionCard>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingCard message={isEditing ? "Loading permission..." : "Preparing permission form..."} />
  }

  if (!settings) {
    return <LoadingCard message="Loading app settings..." />
  }

  if (loadError) {
    return <StateCard message={loadError} />
  }

  return (
    <SectionShell
      title={isEditing ? "Update Permission" : "New Permission"}
      description="Maintain permission definitions and scope metadata for controlled application access."
      actions={(
        <Button asChild variant="outline">
          <Link to="/dashboard/settings/permissions">
            <ArrowLeftIcon className="size-4" />
            Back
          </Link>
        </Button>
      )}
    >
      {formError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {formError}
        </div>
      ) : null}

      <AnimatedTabs defaultTabValue="details" tabs={tabs} />

      <div className="flex justify-end">
        <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Update Permission" : "Save Permission"}
        </Button>
      </div>
    </SectionShell>
  )
}
