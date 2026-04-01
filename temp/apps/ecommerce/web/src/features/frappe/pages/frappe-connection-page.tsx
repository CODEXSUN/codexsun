import type {
  FrappeConnectionVerification,
  FrappeSettingsUpdatePayload,
} from '@shared/index'
import { useEffect, useState, type PropsWithChildren } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, CheckCircle2, Database, ShieldCheck } from 'lucide-react'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createFieldErrors,
  inputErrorClassName,
  isBlank,
  setFieldError,
  summarizeFieldErrors,
  type FieldErrors,
  warningCardClassName,
} from '@/shared/forms/validation'
import {
  getFrappeSettings,
  HttpError,
  updateFrappeSettings,
  verifyFrappeConnection,
} from '@/shared/api/client'
import { showErrorToast, showSuccessToast, showValidationToast } from '@/shared/notifications/toast'

function createDefaultValues(): FrappeSettingsUpdatePayload {
  return {
    enabled: false,
    baseUrl: '',
    siteName: '',
    apiKey: '',
    apiSecret: '',
    timeoutSeconds: 15,
    defaultCompany: '',
    defaultWarehouse: '',
    defaultPriceList: '',
    defaultCustomerGroup: '',
    defaultItemGroup: '',
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load Frappe settings.'
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[0.8rem] text-destructive">{message}</p> : null
}

function validateSettings(values: FrappeSettingsUpdatePayload, requireCredentials: boolean) {
  const errors = createFieldErrors()
  const needsCredentials = requireCredentials || values.enabled

  if (needsCredentials && isBlank(values.baseUrl)) {
    setFieldError(errors, 'baseUrl', 'ERPNext base URL is required.')
  }

  if (!isBlank(values.baseUrl)) {
    try {
      const parsedUrl = new URL(values.baseUrl)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        setFieldError(errors, 'baseUrl', 'ERPNext base URL must use HTTP or HTTPS.')
      }
    } catch {
      setFieldError(errors, 'baseUrl', 'ERPNext base URL must be a valid URL.')
    }
  }

  if (needsCredentials && isBlank(values.apiKey)) {
    setFieldError(errors, 'apiKey', 'ERPNext API key is required.')
  }

  if (needsCredentials && isBlank(values.apiSecret)) {
    setFieldError(errors, 'apiSecret', 'ERPNext API secret is required.')
  }

  if (!Number.isInteger(values.timeoutSeconds) || values.timeoutSeconds < 1 || values.timeoutSeconds > 120) {
    setFieldError(errors, 'timeoutSeconds', 'Timeout must be between 1 and 120 seconds.')
  }

  return errors
}

function FormField({
  label,
  description,
  htmlFor,
  error,
  children,
}: PropsWithChildren<{
  label: string
  description: string
  htmlFor: string
  error?: string
}>) {
  return (
    <div className="grid min-h-[4.9rem] gap-2">
      <Label htmlFor={htmlFor} className={error ? 'text-destructive' : undefined}>
        {label}
      </Label>
      {children}
      <p className="text-xs text-muted-foreground">{description}</p>
      <FieldError message={error} />
    </div>
  )
}

export function FrappeConnectionPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const isSuperAdmin = Boolean(session?.user.isSuperAdmin)
  const [values, setValues] = useState<FrappeSettingsUpdatePayload>(createDefaultValues())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [isConfigured, setIsConfigured] = useState(false)
  const [verification, setVerification] = useState<FrappeConnectionVerification | null>(null)

  useEffect(() => {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      setLoading(false)
      return
    }

    let cancelled = false

    async function load() {
      const token = accessToken
      if (!token) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const settings = await getFrappeSettings(token)
        if (cancelled) {
          return
        }

        setValues({
          enabled: settings.enabled,
          baseUrl: settings.baseUrl,
          siteName: settings.siteName,
          apiKey: settings.apiKey,
          apiSecret: settings.apiSecret,
          timeoutSeconds: settings.timeoutSeconds,
          defaultCompany: settings.defaultCompany,
          defaultWarehouse: settings.defaultWarehouse,
          defaultPriceList: settings.defaultPriceList,
          defaultCustomerGroup: settings.defaultCustomerGroup,
          defaultItemGroup: settings.defaultItemGroup,
        })
        setIsConfigured(settings.isConfigured)
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
  }, [accessToken, isSuperAdmin])

  async function handleSave() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const nextFieldErrors = validateSettings(values, false)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('frappe connection')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const settings = await updateFrappeSettings(accessToken, values)
      setValues({
        enabled: settings.enabled,
        baseUrl: settings.baseUrl,
        siteName: settings.siteName,
        apiKey: settings.apiKey,
        apiSecret: settings.apiSecret,
        timeoutSeconds: settings.timeoutSeconds,
        defaultCompany: settings.defaultCompany,
        defaultWarehouse: settings.defaultWarehouse,
        defaultPriceList: settings.defaultPriceList,
        defaultCustomerGroup: settings.defaultCustomerGroup,
        defaultItemGroup: settings.defaultItemGroup,
      })
      setIsConfigured(settings.isConfigured)
      setFieldErrors(createFieldErrors())
      showSuccessToast({
        title: 'Frappe settings saved',
        description: 'ERPNext connection values were written to the runtime configuration.',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to save Frappe settings',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleVerify() {
    if (!isSuperAdmin || typeof accessToken !== 'string') {
      return
    }

    const nextFieldErrors = validateSettings(values, true)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('frappe connection')
      return
    }

    setVerifying(true)
    setErrorMessage(null)

    try {
      const result = await verifyFrappeConnection(accessToken, values)
      setVerification(result)

      if (result.ok) {
        showSuccessToast({
          title: 'ERPNext connection verified',
          description: result.detail,
        })
      } else {
        showErrorToast({
          title: 'ERPNext verification failed',
          description: result.detail || result.message,
        })
      }
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      setVerification(null)
      showErrorToast({
        title: 'Unable to verify ERPNext connection',
        description: message,
      })
    } finally {
      setVerifying(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          ERPNext connection settings are available only to super-admin users.
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading Frappe settings...</CardContent>
      </Card>
    )
  }

  const tabs: AnimatedContentTab[] = [
    {
      label: 'Connection',
      value: 'connection',
      content: (
        <Card className="rounded-md">
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="flex items-start gap-3 rounded-[1.25rem] border border-border/70 p-4">
                <Checkbox
                  checked={values.enabled}
                  onCheckedChange={(checked) => setValues((current) => ({ ...current, enabled: checked === true }))}
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Enable Frappe integration</p>
                  <p className="text-sm text-muted-foreground">
                    Turn on ERPNext-backed integration flows once the connection test passes.
                  </p>
                </div>
              </label>
            </div>

            <FormField
              label="ERPNext Base URL"
              description="Example: https://erp.yourcompany.com"
              htmlFor="frappe-base-url"
              error={fieldErrors.baseUrl}
            >
              <Input
                id="frappe-base-url"
                className={inputErrorClassName(Boolean(fieldErrors.baseUrl))}
                value={values.baseUrl}
                onChange={(event) => setValues((current) => ({ ...current, baseUrl: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Site Name"
              description="Optional host header when ERPNext is served from a multi-site bench."
              htmlFor="frappe-site-name"
            >
              <Input
                id="frappe-site-name"
                value={values.siteName}
                onChange={(event) => setValues((current) => ({ ...current, siteName: event.target.value }))}
              />
            </FormField>

            <FormField
              label="API Key"
              description="ERPNext API key created for the integration user."
              htmlFor="frappe-api-key"
              error={fieldErrors.apiKey}
            >
              <Input
                id="frappe-api-key"
                className={inputErrorClassName(Boolean(fieldErrors.apiKey))}
                value={values.apiKey}
                onChange={(event) => setValues((current) => ({ ...current, apiKey: event.target.value }))}
              />
            </FormField>

            <FormField
              label="API Secret"
              description="Matching ERPNext API secret for token authentication."
              htmlFor="frappe-api-secret"
              error={fieldErrors.apiSecret}
            >
              <Input
                id="frappe-api-secret"
                type="password"
                className={inputErrorClassName(Boolean(fieldErrors.apiSecret))}
                value={values.apiSecret}
                onChange={(event) => setValues((current) => ({ ...current, apiSecret: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Request Timeout"
              description="Connection test timeout in seconds."
              htmlFor="frappe-timeout"
              error={fieldErrors.timeoutSeconds}
            >
              <Input
                id="frappe-timeout"
                type="number"
                min="1"
                max="120"
                className={inputErrorClassName(Boolean(fieldErrors.timeoutSeconds))}
                value={values.timeoutSeconds}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    timeoutSeconds: Number(event.target.value || 0),
                  }))}
              />
            </FormField>
          </CardContent>
        </Card>
      ),
    },
    {
      label: 'Defaults',
      value: 'defaults',
      content: (
        <Card className="rounded-md">
          <CardContent className="grid gap-4 pt-5 md:grid-cols-2">
            <FormField
              label="Default Company"
              description="ERPNext company to use when documents are pushed from codexsun."
              htmlFor="frappe-default-company"
            >
              <Input
                id="frappe-default-company"
                value={values.defaultCompany}
                onChange={(event) => setValues((current) => ({ ...current, defaultCompany: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Default Warehouse"
              description="Warehouse fallback used for stock-facing integration flows."
              htmlFor="frappe-default-warehouse"
            >
              <Input
                id="frappe-default-warehouse"
                value={values.defaultWarehouse}
                onChange={(event) => setValues((current) => ({ ...current, defaultWarehouse: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Default Price List"
              description="Selling price list that codexsun should map to in ERPNext."
              htmlFor="frappe-default-price-list"
            >
              <Input
                id="frappe-default-price-list"
                value={values.defaultPriceList}
                onChange={(event) => setValues((current) => ({ ...current, defaultPriceList: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Default Customer Group"
              description="Fallback customer group for synced customers."
              htmlFor="frappe-default-customer-group"
            >
              <Input
                id="frappe-default-customer-group"
                value={values.defaultCustomerGroup}
                onChange={(event) => setValues((current) => ({ ...current, defaultCustomerGroup: event.target.value }))}
              />
            </FormField>

            <FormField
              label="Default Item Group"
              description="Fallback ERPNext item group for exported catalog items."
              htmlFor="frappe-default-item-group"
            >
              <Input
                id="frappe-default-item-group"
                value={values.defaultItemGroup}
                onChange={(event) => setValues((current) => ({ ...current, defaultItemGroup: event.target.value }))}
              />
            </FormField>
          </CardContent>
        </Card>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60 p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Super admin</Badge>
              <div>
                <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
                  <Link to="/admin/dashboard/frappe">
                    <ArrowLeft className="size-4" />
                    Back to Frappe
                  </Link>
                </Button>
                <CardTitle className="text-3xl">ERPNext connection and defaults</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Connect codexsun to ERPNext with token-based authentication, verify the live endpoint, and store the default company and master mappings the integration should use.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={values.enabled ? 'default' : 'outline'}>
                {values.enabled ? 'Integration enabled' : 'Integration disabled'}
              </Badge>
              <Badge variant={isConfigured ? 'default' : 'outline'}>
                {isConfigured ? 'Credentials configured' : 'Credentials incomplete'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

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

      <AnimatedTabs defaultTabValue="connection" tabs={tabs} />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="size-5" />
              Verification flow
            </CardTitle>
            <CardDescription>
              Verify uses the current form values without forcing a save first, so you can test changes before committing them to the runtime `.env`.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Save writes the Frappe settings directly to the runtime configuration.</p>
            <p>Verify calls `frappe.auth.get_logged_user` on the target ERPNext server using the provided API key and secret.</p>
            <p>Enable the integration only after the verification step succeeds against the intended live ERPNext base URL.</p>
          </CardContent>
        </Card>

        <Card className="rounded-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              Access
            </CardTitle>
            <CardDescription>
              These credentials are restricted to super-admin access because they unlock ERPNext-side API operations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Signed in as <span className="font-medium text-foreground">{session?.user.email}</span></p>
            <p>Connection details are stored in the runtime `.env` and become available immediately after save.</p>
          </CardContent>
        </Card>
      </div>

      {verification ? (
        <Card className={verification.ok ? 'border-emerald-500/40' : 'border-destructive/40'}>
          <CardContent className="flex items-start gap-3 p-4 text-sm">
            {verification.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="mt-0.5 size-4 text-destructive" />
            )}
            <div className="space-y-1">
              <p className={verification.ok ? 'font-medium text-emerald-700 dark:text-emerald-400' : 'font-medium text-destructive'}>
                {verification.message}
              </p>
              <p className="text-muted-foreground">{verification.detail}</p>
              <p className="text-muted-foreground">
                Server: <span className="font-medium text-foreground">{verification.serverUrl || 'Not provided'}</span>
                {verification.connectedUser ? ` | User: ${verification.connectedUser}` : ''}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => void handleVerify()} disabled={saving || verifying}>
          {verifying ? 'Verifying...' : 'Verify connection'}
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving || verifying}>
          {saving ? 'Saving...' : 'Save connection'}
        </Button>
      </div>
    </div>
  )
}
