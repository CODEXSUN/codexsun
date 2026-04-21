import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, PlusIcon, XIcon } from "lucide-react"

import type { ActorType, AuthRoleSummary, RoleKey } from "@cxapp/shared"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { showAppToast } from "@/components/ui/app-toast"
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
import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  createFrameworkUser,
  getFrameworkUser,
  listFrameworkRoles,
  sendFrameworkUserPasswordResetLink,
  updateFrameworkUser,
} from "./user-api"
import { SectionShell, StateCard } from "./user-shared"
import { useAuth } from "../../auth/auth-context"
import { useRuntimeAppSettings } from "../runtime-app-settings/runtime-app-settings-provider"

type UserFormValues = {
  actorType: ActorType
  avatarUrl: string
  displayName: string
  email: string
  isActive: boolean
  isSuperAdmin: boolean
  organizationName: string
  phoneNumber: string
  roleKeys: RoleKey[]
}

type UserFieldErrors = Partial<Record<keyof UserFormValues | "password", string>>

function createDefaultUserFormValues(): UserFormValues {
  return {
    actorType: "staff",
    avatarUrl: "",
    displayName: "",
    email: "",
    isActive: true,
    isSuperAdmin: false,
    organizationName: "",
    phoneNumber: "",
    roleKeys: [],
  }
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

function UserField({
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

function UserSectionCard({
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

function validateUserForm(values: UserFormValues) {
  const errors: UserFieldErrors = {}

  if (values.displayName.trim().length < 2) {
    errors.displayName = "User name is required."
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address."
  }

  if (values.roleKeys.length === 0) {
    errors.roleKeys = "Select at least one role."
  }

  if (values.isSuperAdmin && values.actorType !== "admin") {
    errors.isSuperAdmin = "Only admin users can be marked as super admin."
  }

  return errors
}

function getAssignableRoles(roles: AuthRoleSummary[], actorType: ActorType) {
  return roles.filter((role) => role.actorType === actorType)
}

export function FrameworkUserUpsertSection({ userId }: { userId?: string }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const { settings } = useRuntimeAppSettings()
  const isEditing = Boolean(userId)
  const canManagePasswords = isEditing && auth.user?.isSuperAdmin === true
  const [form, setForm] = useState<UserFormValues>(createDefaultUserFormValues())
  const [roles, setRoles] = useState<AuthRoleSummary[]>([])
  const [passwordValue, setPasswordValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingPasswordLink, setIsSendingPasswordLink] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<UserFieldErrors>({})
  const [roleLookupValue, setRoleLookupValue] = useState("")
  useGlobalLoading(isLoading || isSaving || isSendingPasswordLink)

  useEffect(() => {
    let cancelled = false

    async function loadWorkspaceData() {
      setIsLoading(true)
      setLoadError(null)

      try {
        const [rolesResponse, userResponse] = await Promise.all([
          listFrameworkRoles(),
          userId ? getFrameworkUser(userId) : Promise.resolve(null),
        ])

        if (cancelled) {
          return
        }

        setRoles(rolesResponse.items)

        if (userResponse) {
          setForm({
            actorType: userResponse.item.actorType,
            avatarUrl: userResponse.item.avatarUrl ?? "",
            displayName: userResponse.item.displayName,
            email: userResponse.item.email,
            isActive: userResponse.item.isActive,
            isSuperAdmin: userResponse.item.isSuperAdmin,
            organizationName: userResponse.item.organizationName ?? "",
            phoneNumber: userResponse.item.phoneNumber ?? "",
            roleKeys: userResponse.item.roles.map((role) => role.key),
          })
        } else {
          const defaultActorType: ActorType = "staff"
          const defaultRoles = getAssignableRoles(rolesResponse.items, defaultActorType)
          setForm((current) => ({
            ...current,
            actorType: defaultActorType,
            roleKeys: defaultRoles[0] ? [defaultRoles[0].key] : [],
          }))
        }

        setIsLoading(false)
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load user workspace data.")
          setIsLoading(false)
        }
      }
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [userId])

  const assignableRoles = getAssignableRoles(roles, form.actorType)
  const actorTypeOptions = (settings?.authMetadata.actorTypes ?? []).map((option) => ({
    label: option.label,
    value: option.key as ActorType,
  }))
  const assignableRoleOptions = assignableRoles
    .filter((role) => role.isActive)
    .map((role) => ({
      label: role.name,
      value: role.key,
    }))
  const selectedRoles = assignableRoles.filter((role) => form.roleKeys.includes(role.key))
  const selectedPermissions = Array.from(
    new Map(
      selectedRoles
        .flatMap((role) => role.permissions)
        .map((permission) => [permission.key, permission] as const)
    ).values()
  )

  async function handleSave() {
    const nextFieldErrors = validateUserForm(form)
    const normalizedPassword = passwordValue.trim()

    if (canManagePasswords && normalizedPassword.length > 0 && normalizedPassword.length < 8) {
      nextFieldErrors.password = "Replacement password must be at least 8 characters."
    }

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
        avatarUrl: form.avatarUrl.trim() || null,
        displayName: form.displayName.trim(),
        email: form.email.trim(),
        isActive: form.isActive,
        isSuperAdmin: form.isSuperAdmin,
        organizationName: form.organizationName.trim() || null,
        password: canManagePasswords ? normalizedPassword || null : null,
        phoneNumber: form.phoneNumber.trim() || null,
        roleKeys: form.roleKeys,
      }

      const response = userId
        ? await updateFrameworkUser(userId, payload)
        : await createFrameworkUser(payload)

      showAppToast({
        variant: "success",
        title: isEditing ? "User updated successfully." : "User created successfully.",
        description: isEditing
          ? `The user "${response.item.displayName}" is updated successfully.`
          : `The user "${response.item.displayName}" is created successfully.`,
      })
      void navigate(`/dashboard/settings/users/${encodeURIComponent(response.item.id)}`)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save user.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleSendPasswordResetLink() {
    if (!userId || !canManagePasswords) {
      return
    }

    setFormError(null)
    setIsSendingPasswordLink(true)

    try {
      const response = await sendFrameworkUserPasswordResetLink(userId)
      showAppToast({
        variant: "success",
        title: "Password reset link sent.",
        description: response.debugUrl
          ? `Reset-link delivery succeeded. Debug link: ${response.debugUrl}`
          : "The password reset link is sent to the user's email successfully.",
      })
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Failed to send the password reset link."
      )
    } finally {
      setIsSendingPasswordLink(false)
    }
  }

  function handleActorTypeChange(value: ActorType) {
    const nextRoles = getAssignableRoles(roles, value)
    setForm((current) => ({
      ...current,
      actorType: value,
      isSuperAdmin: value === "admin" ? current.isSuperAdmin : false,
      roleKeys:
        current.roleKeys.filter((roleKey) => nextRoles.some((role) => role.key === roleKey))
          .length > 0
          ? current.roleKeys.filter((roleKey) => nextRoles.some((role) => role.key === roleKey))
          : nextRoles[0]
            ? [nextRoles[0].key]
            : [],
    }))
    setFieldErrors((current) => ({
      ...current,
      actorType: undefined,
      isSuperAdmin: undefined,
      roleKeys: undefined,
    }))
  }

  function toggleRole(roleKey: RoleKey, checked: boolean) {
    setForm((current) => ({
      ...current,
      roleKeys: checked
        ? Array.from(new Set([...current.roleKeys, roleKey]))
        : current.roleKeys.filter((value) => value !== roleKey),
    }))
    setFieldErrors((current) => ({ ...current, roleKeys: undefined }))
  }

  const tabs: AnimatedContentTab[] = [
    {
      label: "Details",
      value: "details",
      content: (
        <div className="space-y-5">
          <UserSectionCard
            title="User Details"
            description="Keep identity and contact information ready for sign-in and application ownership."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <UserField label="User Name" error={fieldErrors.displayName}>
                <Input
                  value={form.displayName}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, displayName: event.target.value }))
                    setFieldErrors((current) => ({ ...current, displayName: undefined }))
                  }}
                  className={fieldErrors.displayName ? "border-destructive" : undefined}
                />
              </UserField>
              <UserField label="Email" error={fieldErrors.email}>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(event) => {
                    setForm((current) => ({ ...current, email: event.target.value }))
                    setFieldErrors((current) => ({ ...current, email: undefined }))
                  }}
                  className={fieldErrors.email ? "border-destructive" : undefined}
                />
              </UserField>
              <UserField label="Phone Number" error={fieldErrors.phoneNumber}>
                <Input
                  value={form.phoneNumber}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, phoneNumber: event.target.value }))
                  }
                />
              </UserField>
                <UserField label="Actor Type" error={fieldErrors.actorType}>
                  <Select value={form.actorType} onValueChange={(value) => handleActorTypeChange(value as ActorType)}>
                    <SelectTrigger className={fieldErrors.actorType ? "w-full border-destructive" : "w-full"}>
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
              </UserField>
              <UserField label="Organization" error={fieldErrors.organizationName}>
                <Input
                  value={form.organizationName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, organizationName: event.target.value }))
                  }
                />
              </UserField>
              <UserField label="Avatar URL" error={fieldErrors.avatarUrl}>
                <Input
                  value={form.avatarUrl}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, avatarUrl: event.target.value }))
                  }
                />
              </UserField>
            </div>
          </UserSectionCard>
        </div>
      ),
    },
    {
      label: "Access",
      value: "access",
      content: (
        <div className="space-y-5">
          <UserSectionCard
            title="Sign-in Access"
            description="Control activation and elevated access for this user."
          >
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-4 text-sm text-muted-foreground">
                {canManagePasswords
                  ? "Super admins can set a replacement password here or send the email reset link for the user."
                  : isEditing
                    ? "Password changes happen through the email reset-link flow."
                  : "Saving this user sends an email invite with a secure link to create the password."}
              </div>
              {canManagePasswords ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
                  <UserField label="Replacement Password" error={fieldErrors.password}>
                    <Input
                      type="password"
                      value={passwordValue}
                      onChange={(event) => {
                        setPasswordValue(event.target.value)
                        setFormError(null)
                        setFieldErrors((current) => ({ ...current, password: undefined }))
                      }}
                      className={fieldErrors.password ? "border-destructive" : undefined}
                      placeholder="Enter a new password"
                    />
                  </UserField>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void handleSendPasswordResetLink()}
                      disabled={isSendingPasswordLink}
                    >
                      {isSendingPasswordLink ? "Sending..." : "Send Reset Link"}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Active</p>
                    <p className="text-xs text-muted-foreground">Allow this user to sign in.</p>
                  </div>
                  <Switch
                    checked={form.isActive}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, isActive: checked }))
                    }
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">Super Admin</p>
                    <p className="text-xs text-muted-foreground">Reserved for admin actor type only.</p>
                  </div>
                  <Switch
                    checked={form.isSuperAdmin}
                    disabled={form.actorType !== "admin"}
                    onCheckedChange={(checked) => {
                      setForm((current) => ({ ...current, isSuperAdmin: checked }))
                      setFieldErrors((current) => ({ ...current, isSuperAdmin: undefined }))
                    }}
                  />
                </label>
              </div>
            </div>
            {fieldErrors.isSuperAdmin ? (
              <p className="text-xs text-destructive">{fieldErrors.isSuperAdmin}</p>
            ) : null}
          </UserSectionCard>

          <UserSectionCard
            title="Roles"
            description="Assign one or more roles. Role permissions below are derived from the active selection."
          >
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-3 md:col-span-2 xl:col-span-3">
                <UserField label="Role Lookup" error={fieldErrors.roleKeys}>
                  <SearchableLookupField
                    value={roleLookupValue}
                    options={assignableRoleOptions}
                    placeholder="Select role"
                    searchPlaceholder="Search role"
                    noResultsMessage="No roles found."
                    createActionLabel={`Create new "${form.actorType}" role`}
                    onCreateNew={(query) => {
                      void navigate(
                        `/dashboard/settings/roles/new?actorType=${encodeURIComponent(form.actorType)}&name=${encodeURIComponent(query)}`
                      )
                    }}
                    onValueChange={(value) => {
                      if (value && !form.roleKeys.includes(value as RoleKey)) {
                        setForm((current) => ({
                          ...current,
                          roleKeys: [...current.roleKeys, value as RoleKey],
                        }))
                        setFieldErrors((current) => ({ ...current, roleKeys: undefined }))
                      }
                      setRoleLookupValue("")
                    }}
                    allowEmptyOption
                    emptyOptionLabel="Select role"
                    error={fieldErrors.roleKeys ?? null}
                  />
                </UserField>

                <div className="flex flex-wrap gap-2">
                  {selectedRoles.length > 0 ? (
                    selectedRoles.map((role) => (
                      <div
                        key={role.key}
                        className="flex items-center gap-2 rounded-full border border-border/70 bg-muted/20 px-3 py-1.5"
                      >
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">{role.name}</p>
                          <p className="text-[11px] text-muted-foreground">{role.summary}</p>
                        </div>
                        <button
                          type="button"
                          className="rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          onClick={() => toggleRole(role.key, false)}
                          aria-label={`Remove ${role.name}`}
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">Add at least one active role.</p>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-fit"
                  onClick={() =>
                    void navigate(`/dashboard/settings/roles/new?actorType=${encodeURIComponent(form.actorType)}`)
                  }
                >
                  <PlusIcon className="size-4" />
                  New Role
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Effective Permissions</p>
                <p className="text-xs text-muted-foreground">
                  These permissions come from the selected roles and the user-role pivot mapping.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedPermissions.length > 0 ? (
                  selectedPermissions.map((permission) => (
                    <Badge key={permission.key} variant="secondary">
                      {permission.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">Select a role to preview permissions.</p>
                )}
              </div>
            </div>
          </UserSectionCard>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return <LoadingCard message={isEditing ? "Loading user..." : "Preparing user form..."} />
  }

  if (!settings) {
    return <LoadingCard message="Loading app settings..." />
  }

  if (loadError) {
    return <StateCard message={loadError} />
  }

  return (
    <SectionShell
      title={isEditing ? "Update User" : "New User"}
      description="Create and maintain authenticated users from the shared application shell."
      actions={(
        <Button asChild variant="outline">
          <Link to={userId ? `/dashboard/settings/users/${encodeURIComponent(userId)}` : "/dashboard/settings/users"}>
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
          {isSaving ? "Saving..." : isEditing ? "Update User" : "Save User"}
        </Button>
      </div>
    </SectionShell>
  )
}
