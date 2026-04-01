import type { ActorType, AuthUserUpsertPayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createFieldErrors,
  inputErrorClassName,
  isBlank,
  setFieldError,
  summarizeFieldErrors,
  type FieldErrors,
  warningCardClassName,
} from '@/shared/forms/validation'
import { createUser, getUser, HttpError, updateUser } from '@/shared/api/client'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'

type UserFormValues = AuthUserUpsertPayload

const actorTypeOptions: { value: ActorType; label: string; summary: string }[] = [
  { value: 'admin', label: 'Admin', summary: 'Full backoffice ownership with the default admin role.' },
  { value: 'staff', label: 'Staff', summary: 'Operational backoffice user with the default staff role.' },
  { value: 'customer', label: 'Customer', summary: 'Customer portal access with the default customer role.' },
  { value: 'vendor', label: 'Vendor', summary: 'Vendor-facing access with the default vendor role.' },
]

function createDefaultValues(): UserFormValues {
  return {
    email: '',
    phoneNumber: null,
    displayName: '',
    actorType: 'staff',
    avatarUrl: null,
    organizationName: null,
    password: null,
    isActive: true,
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to save user.'
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[0.8rem] text-destructive">{message}</p> : null
}

function validateUser(values: UserFormValues, isEditMode: boolean) {
  const errors = createFieldErrors()

  if (isBlank(values.displayName)) {
    setFieldError(errors, 'displayName', 'Display name is required.')
  }

  if (isBlank(values.email)) {
    setFieldError(errors, 'email', 'Email is required.')
  }

  if (!isEditMode && isBlank(values.password ?? '')) {
    setFieldError(errors, 'password', 'Password is required for a new user.')
  }

  if (values.password && values.password.length < 8) {
    setFieldError(errors, 'password', 'Password must be at least 8 characters.')
  }

  return errors
}

function toFormValues(user: Awaited<ReturnType<typeof getUser>>): UserFormValues {
  return {
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
    actorType: user.actorType,
    avatarUrl: user.avatarUrl,
    organizationName: user.organizationName,
    password: null,
    isActive: user.isActive,
  }
}

function ProfileField({
  label,
  description,
  children,
}: React.PropsWithChildren<{ label: string; description?: string }>) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
    </div>
  )
}

export function UserFormPage() {
  const navigate = useNavigate()
  const { userId } = useParams()
  const isEditMode = Boolean(userId)
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const canManageUsers = Boolean(
    session?.user.isSuperAdmin || session?.user.permissions.some((permission) => permission.key === 'users:manage'),
  )
  const canManageSuperAdmins = Boolean(session?.user.isSuperAdmin)
  const [values, setValues] = useState<UserFormValues>(createDefaultValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [targetIsSuperAdmin, setTargetIsSuperAdmin] = useState(false)

  useEffect(() => {
    if (!isEditMode) {
      setTargetIsSuperAdmin(false)
    }
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !canManageUsers || typeof accessToken !== 'string' || !userId) {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const token = accessToken
      const currentUserId = userId
      if (!token || !currentUserId) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const user = await getUser(token, currentUserId)
        if (!cancelled) {
          setValues(toFormValues(user))
          setTargetIsSuperAdmin(Boolean(user.isSuperAdmin))
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [accessToken, canManageUsers, isEditMode, userId])

  const selectedActorType = useMemo(
    () => actorTypeOptions.find((option) => option.value === values.actorType) ?? actorTypeOptions[1],
    [values.actorType],
  )
  const canEditTarget = !isEditMode || !targetIsSuperAdmin || canManageSuperAdmins

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageUsers || typeof accessToken !== 'string' || !canEditTarget) {
      return
    }

    const nextFieldErrors = validateUser(values, isEditMode)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('user')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const savedUser = isEditMode && userId
        ? await updateUser(accessToken, userId, values)
        : await createUser(accessToken, values)

      showSavedToast({
        entityLabel: 'user',
        recordName: savedUser.displayName,
        referenceId: savedUser.id,
        mode: isEditMode ? 'update' : 'create',
      })

      void navigate('/admin/dashboard/users')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'user',
        action: isEditMode ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          User management is available only to accounts with the `users:manage` permission.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading user...</CardContent>
      </Card>
    )
  }

  if (isEditMode && !canEditTarget) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Only super admins can edit super admin accounts.
        </CardContent>
      </Card>
    )
  }

  return (
    <form className="space-y-6 pt-2" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/users">
              <ArrowLeft className="size-4" />
              Back to users
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Configure identity, role-default actor type, contact details, and activation state.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/users') }}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : isEditMode ? 'Save User' : 'Create User'}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summarizeFieldErrors(fieldErrors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnimatedTabs
        defaultTabValue="identity"
        tabs={[
          {
            label: 'Identity',
            value: 'identity',
            content: (
              <Card className="rounded-md">
                <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
                  <div className="grid min-h-[4.75rem] gap-2">
                    <Label className={fieldErrors.displayName ? 'text-destructive' : undefined}>Display Name</Label>
                    <Input
                      className={inputErrorClassName(Boolean(fieldErrors.displayName))}
                      value={values.displayName}
                      onChange={(event) => setValues((current) => ({ ...current, displayName: event.target.value }))}
                    />
                    <FieldError message={fieldErrors.displayName} />
                  </div>
                  <div className="grid min-h-[4.75rem] gap-2">
                    <Label className={fieldErrors.email ? 'text-destructive' : undefined}>Email</Label>
                    <Input
                      type="email"
                      className={inputErrorClassName(Boolean(fieldErrors.email))}
                      value={values.email}
                      onChange={(event) => setValues((current) => ({ ...current, email: event.target.value }))}
                    />
                    <FieldError message={fieldErrors.email} />
                  </div>
                  <ProfileField label="Phone Number" description="Stored as the account recovery and contact number when provided.">
                    <Input
                      value={values.phoneNumber ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, phoneNumber: event.target.value || null }))}
                    />
                  </ProfileField>
                  <ProfileField label="Organization Name" description="Use for staff, vendor, or customer accounts tied to a business name.">
                    <Input
                      value={values.organizationName ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, organizationName: event.target.value || null }))}
                    />
                  </ProfileField>
                  <div className="grid gap-2 md:col-span-2">
                    <Label>Avatar URL</Label>
                    <Input
                      value={values.avatarUrl ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, avatarUrl: event.target.value || null }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave this blank to use the generated initials-based avatar.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            label: 'Access',
            value: 'access',
            content: (
              <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <Card className="rounded-md">
                  <CardContent className="grid gap-4 pt-5">
                    <div className="grid gap-2">
                      <Label>Actor Type</Label>
                      <select
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        value={values.actorType}
                        onChange={(event) =>
                          setValues((current) => ({ ...current, actorType: event.target.value as ActorType }))
                        }
                      >
                        {actorTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-muted-foreground">{selectedActorType.summary}</p>
                    </div>

                    <div className="grid min-h-[4.75rem] gap-2">
                      <Label className={fieldErrors.password ? 'text-destructive' : undefined}>
                        {isEditMode ? 'New Password' : 'Password'}
                      </Label>
                      <Input
                        type="password"
                        className={inputErrorClassName(Boolean(fieldErrors.password))}
                        value={values.password ?? ''}
                        onChange={(event) => setValues((current) => ({ ...current, password: event.target.value || null }))}
                      />
                      <FieldError message={fieldErrors.password} />
                      <p className="text-xs text-muted-foreground">
                        {isEditMode
                          ? 'Leave blank to keep the current password unchanged.'
                          : 'Set an initial password with at least 8 characters.'}
                      </p>
                    </div>

                    <label className="flex items-center gap-3 rounded-[1.25rem] border border-border/70 p-4">
                      <Checkbox
                        checked={values.isActive}
                        onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: checked === true }))}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">Active account</p>
                        <p className="text-sm text-muted-foreground">
                          Inactive accounts cannot sign in until restored from user management.
                        </p>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                <Card className="rounded-md">
                  <CardHeader>
                    <CardTitle>Role preview</CardTitle>
                    <CardDescription>
                      Roles and permissions are assigned from the default mapping for the selected actor type.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <div className="rounded-[1.25rem] border border-border/70 p-4">
                      <p className="font-medium text-foreground">{selectedActorType.label}</p>
                      <p className="mt-2 text-muted-foreground">{selectedActorType.summary}</p>
                    </div>
                    <div className="rounded-[1.25rem] border border-border/70 p-4">
                      <p className="font-medium text-foreground">Update behavior</p>
                      <Textarea
                        readOnly
                        value={[
                          'Changing actor type reassigns the default role for that actor.',
                          'Email and phone number must stay unique across all users.',
                          'Self-deactivation is blocked from this screen.',
                        ].join('\n')}
                        className="mt-3 min-h-32 resize-none bg-muted/30"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
        ] satisfies AnimatedContentTab[]}
      />
    </form>
  )
}
