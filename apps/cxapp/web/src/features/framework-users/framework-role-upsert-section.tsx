import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type {
  ActorType,
  AuthPermissionListResponse,
  AuthRoleResponse,
  PermissionKey,
} from "@core/shared"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  createFrameworkRole,
  getFrameworkRole,
  listFrameworkPermissions,
  updateFrameworkRole,
} from "./user-api"
import { SectionShell, StateCard } from "./user-shared"
import { useRuntimeAppSettings } from "../runtime-app-settings/runtime-app-settings-provider"

type RoleFormValues = {
  actorType: ActorType
  isActive: boolean
  key: string
  name: string
  permissionKeys: PermissionKey[]
  summary: string
}

type RoleFieldErrors = Partial<Record<keyof RoleFormValues, string>>

function createDefaultRoleFormValues(): RoleFormValues {
  return {
    actorType: "staff",
    isActive: true,
    key: "",
    name: "",
    permissionKeys: [],
    summary: "",
  }
}

function slugifyRoleKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_")
}

function validateRoleForm(values: RoleFormValues) {
  const errors: RoleFieldErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = "Role name is required."
  }

  const resolvedKey = values.key.trim() || slugifyRoleKey(values.name)
  if (!resolvedKey || !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(resolvedKey)) {
    errors.key = "Use lowercase letters, numbers, and underscores only."
  }

  if (values.summary.trim().length < 2) {
    errors.summary = "Summary is required."
  }

  if (values.permissionKeys.length === 0) {
    errors.permissionKeys = "Select at least one permission."
  }

  return errors
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

function RoleField({
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

function RoleSectionCard({
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

export function FrameworkRoleUpsertSection({ roleId }: { roleId?: string }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { settings } = useRuntimeAppSettings()
  const isEditing = Boolean(roleId)
  const [form, setForm] = useState<RoleFormValues>(createDefaultRoleFormValues())
  const [permissions, setPermissions] = useState<AuthPermissionListResponse["items"]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<RoleFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)
  const actorTypeOptions = (settings?.authMetadata.actorTypes ?? []).map((option) => ({
    label: option.label,
    value: option.key as ActorType,
  }))

  useEffect(() => {
    let cancelled = false

    async function loadWorkspaceData() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [permissionsResponse, roleResponse] = await Promise.all([
          listFrameworkPermissions(),
          roleId ? getFrameworkRole(roleId) : Promise.resolve<AuthRoleResponse | null>(null),
        ])

        if (cancelled) {
          return
        }

        setPermissions(permissionsResponse.items)

        if (roleResponse) {
          setForm({
            actorType: roleResponse.item.actorType,
            isActive: roleResponse.item.isActive,
            key: roleResponse.item.key,
            name: roleResponse.item.name,
            permissionKeys: roleResponse.item.permissions.map((permission) => permission.key),
            summary: roleResponse.item.summary,
          })
        } else {
          const initialActorType = (searchParams.get("actorType") as ActorType | null) ?? "staff"
          const initialName = searchParams.get("name") ?? ""
          setForm({
            actorType: initialActorType,
            isActive: true,
            key: slugifyRoleKey(initialName),
            name: initialName,
            permissionKeys: [],
            summary: "",
          })
        }

        setIsLoading(false)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load role workspace data.")
          setIsLoading(false)
        }
      }
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [roleId, searchParams])

  const selectedPermissions = useMemo(
    () => permissions.filter((permission) => form.permissionKeys.includes(permission.key)),
    [permissions, form.permissionKeys]
  )

  async function handleSave() {
    const nextFieldErrors = validateRoleForm(form)
    setFieldErrors(nextFieldErrors)
    setFormError(null)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError("Fix the highlighted fields and save again.")
      return
    }

    setIsSaving(true)

    try {
      const payload = {
        actorType: form.actorType,
        isActive: form.isActive,
        key: form.key.trim() || slugifyRoleKey(form.name),
        name: form.name.trim(),
        permissionKeys: form.permissionKeys,
        summary: form.summary.trim(),
      }

      const response = roleId
        ? await updateFrameworkRole(roleId, payload)
        : await createFrameworkRole(payload)

      void navigate(`/dashboard/settings/roles/${encodeURIComponent(response.item.key)}/edit`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save role.")
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
          <RoleSectionCard
            title="Role Details"
            description="Keep custom roles actor-type specific so they remain valid in user lookup and access assignment."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <RoleField label="Role Name" error={fieldErrors.name}>
                <Input
                  value={form.name}
                  onChange={(event) => {
                    const nextName = event.target.value
                    setForm((current) => ({
                      ...current,
                      name: nextName,
                      key: current.key.trim().length > 0 ? current.key : slugifyRoleKey(nextName),
                    }))
                    setFieldErrors((current) => ({ ...current, name: undefined, key: undefined }))
                  }}
                  className={fieldErrors.name ? "border-destructive" : undefined}
                />
              </RoleField>
                <RoleField label="Actor Type" error={fieldErrors.actorType}>
                  <Select
                    value={form.actorType}
                    onValueChange={(value) =>
                      setForm((current) => ({ ...current, actorType: value as ActorType }))
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select actor type" />
                    </SelectTrigger>
                  <SelectContent>
                    {actorTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </RoleField>
              <RoleField label="Role Key" error={fieldErrors.key}>
                <Input
                  value={form.key}
                  disabled={isEditing}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, key: slugifyRoleKey(event.target.value) }))
                    setFieldErrors((current) => ({ ...current, key: undefined }))
                  }}
                  className={fieldErrors.key ? "border-destructive" : undefined}
                />
              </RoleField>
              <RoleField label="Summary" error={fieldErrors.summary}>
                <Input
                  value={form.summary}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, summary: event.target.value }))
                    setFieldErrors((current) => ({ ...current, summary: undefined }))
                  }}
                  className={fieldErrors.summary ? "border-destructive" : undefined}
                />
              </RoleField>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Active</p>
                <p className="text-xs text-muted-foreground">Keep this role available in user lookup.</p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isActive: checked }))
                }
              />
            </label>
          </RoleSectionCard>
        </div>
      ),
    },
    {
      label: "Permissions",
      value: "permissions",
      content: (
        <div className="space-y-5">
          <RoleSectionCard
            title="Permission Mapping"
            description="Map the permissions this role contributes through the role-permission pivot."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {permissions.map((permission) => {
                const checked = form.permissionKeys.includes(permission.key)

                return (
                  <label
                    key={permission.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                      checked
                        ? "border-primary/40 bg-primary/5"
                        : "border-border/70 bg-background hover:border-primary/20"
                    }`}
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(value) => {
                        const nextChecked = Boolean(value)
                        setForm((current) => ({
                          ...current,
                          permissionKeys: nextChecked
                            ? Array.from(new Set([...current.permissionKeys, permission.key]))
                            : current.permissionKeys.filter((key) => key !== permission.key),
                        }))
                        setFieldErrors((current) => ({ ...current, permissionKeys: undefined }))
                      }}
                      className="mt-0.5"
                    />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{permission.name}</p>
                        <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                          {permission.key}
                        </span>
                      </div>
                      <p className="text-xs leading-5 text-muted-foreground">{permission.summary}</p>
                    </div>
                  </label>
                )
              })}
            </div>
            {fieldErrors.permissionKeys ? (
              <p className="text-xs text-destructive">{fieldErrors.permissionKeys}</p>
            ) : null}

            <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
              <p className="text-sm font-medium text-foreground">Selected Permissions</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedPermissions.length > 0 ? (
                  selectedPermissions.map((permission) => (
                    <span
                      key={permission.key}
                      className="rounded-full border border-border/70 bg-background px-3 py-1 text-sm text-foreground"
                    >
                      {permission.name}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Select one or more permissions.</p>
                )}
              </div>
            </div>
          </RoleSectionCard>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingCard message={isEditing ? "Loading role..." : "Preparing role form..."} />
  }

  if (!settings) {
    return <LoadingCard message="Loading app settings..." />
  }

  if (loadError) {
    return <StateCard message={loadError} />
  }

  return (
    <SectionShell
      title={isEditing ? "Update Role" : "New Role"}
      description="Maintain custom roles for user creation and permission grouping."
      actions={(
        <Button asChild variant="outline">
          <Link to="/dashboard/settings/roles">
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
          {isSaving ? "Saving..." : isEditing ? "Update Role" : "Save Role"}
        </Button>
      </div>
    </SectionShell>
  )
}
