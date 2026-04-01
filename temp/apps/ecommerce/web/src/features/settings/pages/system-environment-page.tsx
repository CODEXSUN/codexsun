import type { SystemEnvironmentUpdatePayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, RefreshCcw, ShieldCheck } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  getSystemEnvironment,
  HttpError,
  runSystemEnvironmentUpdate,
  updateSystemEnvironment,
} from '@/shared/api/client'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/shared/notifications/toast'

type EnvironmentFieldType = 'text' | 'password' | 'number' | 'boolean' | 'select' | 'textarea'

interface EnvironmentFieldOption {
  value: string
  label: string
}

interface EnvironmentField {
  key: string
  label: string
  type: EnvironmentFieldType
  description: string
  placeholder?: string
  options?: EnvironmentFieldOption[]
}

interface EnvironmentSection {
  title: string
  description: string
  fields: EnvironmentField[]
}

interface EnvironmentTab {
  label: string
  value: string
  sections: EnvironmentSection[]
}

const booleanOptions: EnvironmentFieldOption[] = [
  { value: 'true', label: 'Enabled' },
  { value: 'false', label: 'Disabled' },
]

const workspaceTargetOptions: EnvironmentFieldOption[] = [
  { value: 'site', label: 'Site' },
  { value: 'ecommerce', label: 'Ecommerce' },
  { value: 'billing', label: 'Billing' },
]

const environmentTabs: EnvironmentTab[] = [
  {
    label: 'Application',
    value: 'application',
    sections: [
      {
        title: 'Runtime Shell',
        description: 'Core boot mode, API port, token signing, and operator-level runtime flags.',
        fields: [
          { key: 'VITE_APP_TARGET', label: 'App Target', type: 'select', options: workspaceTargetOptions, description: 'Single selector for the full app workspace target used by web and desktop startup.' },
          { key: 'CODEXSUN_WEB_URL', label: 'Web URL', type: 'text', description: 'Frontend origin used by desktop startup and API CORS allowlist.' },
          { key: 'CODEXSUN_API_URL', label: 'API URL', type: 'text', description: 'API base URL used by the frontend and to derive the server port.' },
          { key: 'APP_DEBUG', label: 'Debug Mode', type: 'boolean', options: booleanOptions, description: 'Enables verbose debug behavior for runtime diagnostics.' },
          { key: 'APP_SKIP_SETUP_CHECK', label: 'Skip Setup Check', type: 'boolean', options: booleanOptions, description: 'Bypasses the initial setup gate during app boot.' },
          { key: 'JWT_SECRET', label: 'JWT Secret', type: 'password', description: 'Signing secret for access tokens. Keep this long and private.' },
          { key: 'JWT_EXPIRES_IN_SECONDS', label: 'JWT Expiry Seconds', type: 'number', description: 'Access token lifetime in seconds.' },
          { key: 'SUPER_ADMIN_EMAILS', label: 'Super Admin Emails', type: 'textarea', description: 'Comma-separated admin emails treated as super admins at runtime.' },
          { key: 'OREKSO_ENABLED', label: 'Orekso Enabled', type: 'boolean', options: booleanOptions, description: 'Enables the floating AI support assistant and API bridge.' },
          { key: 'OREKSO_URL', label: 'Orekso URL', type: 'text', description: 'Internal base URL used by the API container to reach the Orekso assistant service.' },
        ],
      },
    ],
  },
  {
    label: 'Database',
    value: 'database',
    sections: [
      {
        title: 'Database Connection',
        description: 'External MariaDB connection and build output path settings.',
        fields: [
          { key: 'DB_ENABLED', label: 'Database Enabled', type: 'boolean', options: booleanOptions, description: 'Turns database-backed features on or off.' },
          { key: 'DB_HOST', label: 'Database Host', type: 'text', description: 'MariaDB hostname or IP.' },
          { key: 'DB_PORT', label: 'Database Port', type: 'number', description: 'MariaDB TCP port.' },
          { key: 'DB_USER', label: 'Database User', type: 'text', description: 'Database login user.' },
          { key: 'DB_PASSWORD', label: 'Database Password', type: 'password', description: 'Database login password.' },
          { key: 'DB_NAME', label: 'Database Name', type: 'text', description: 'Primary application database schema name.' },
          { key: 'WEB_DIST_ROOT', label: 'Web Dist Root', type: 'text', description: 'Path to the built web assets served by the API container.' },
        ],
      },
    ],
  },
  {
    label: 'Seed & Media',
    value: 'seed-media',
    sections: [
      {
        title: 'Seed Controls',
        description: 'Bootstrap user and sample data defaults for first-run environments.',
        fields: [
          { key: 'SEED_DEFAULT_USER', label: 'Seed Default User', type: 'boolean', options: booleanOptions, description: 'Creates the default admin user during bootstrap when missing.' },
          { key: 'SEED_DEFAULT_USER_NAME', label: 'Seed User Name', type: 'text', description: 'Display name for the seeded bootstrap admin.' },
          { key: 'SEED_DEFAULT_USER_EMAIL', label: 'Seed User Email', type: 'text', description: 'Email for the seeded bootstrap admin.' },
          { key: 'SEED_DEFAULT_USER_PASSWORD', label: 'Seed User Password', type: 'password', description: 'Initial password used for the seeded bootstrap admin.' },
          { key: 'SEED_DEFAULT_USER_AVATAR_URL', label: 'Seed User Avatar URL', type: 'text', description: 'Avatar URL for the seeded bootstrap admin.' },
          { key: 'SEED_DUMMY_PRODUCTS', label: 'Seed Dummy Products', type: 'boolean', options: booleanOptions, description: 'Controls product demo-data seeding.' },
        ],
      },
      {
        title: 'Media Runtime',
        description: 'Storage mount points and public media URL behavior for the runtime volume.',
        fields: [
          { key: 'MEDIA_STORAGE_ROOT', label: 'Media Storage Root', type: 'text', description: 'Base runtime storage path used for media.' },
          { key: 'MEDIA_PUBLIC_BASE_URL', label: 'Media Public Base URL', type: 'text', description: 'Base URL prefix used to serve public assets.' },
          { key: 'MEDIA_WEB_PUBLIC_SYMLINK', label: 'Media Public Symlink', type: 'text', description: 'Public web path that symlinks into runtime media storage.' },
        ],
      },
    ],
  },
  {
    label: 'Auth & Mail',
    value: 'auth-mail',
    sections: [
      {
        title: 'OTP and Authentication',
        description: 'OTP debugging, expiry timing, and account verification runtime behavior.',
        fields: [
          { key: 'AUTH_OTP_DEBUG', label: 'OTP Debug', type: 'boolean', options: booleanOptions, description: 'Returns debug OTP codes in API responses when enabled.' },
          { key: 'AUTH_OTP_EXPIRY_MINUTES', label: 'OTP Expiry Minutes', type: 'number', description: 'How long OTP challenges stay valid.' },
        ],
      },
      {
        title: 'SMTP Mail',
        description: 'Transactional mail transport and sender identity used by the mailbox layer.',
        fields: [
          { key: 'SMTP_HOST', label: 'SMTP Host', type: 'text', description: 'SMTP server hostname.' },
          { key: 'SMTP_PORT', label: 'SMTP Port', type: 'number', description: 'SMTP server port.' },
          { key: 'SMTP_SECURE', label: 'SMTP Secure', type: 'boolean', options: booleanOptions, description: 'Enables implicit TLS for SMTP.' },
          { key: 'SMTP_USER', label: 'SMTP User', type: 'text', description: 'SMTP login user.' },
          { key: 'SMTP_PASS', label: 'SMTP Password', type: 'password', description: 'SMTP login password.' },
          { key: 'SMTP_FROM_EMAIL', label: 'From Email', type: 'text', description: 'Sender email address used for outgoing mail.' },
          { key: 'SMTP_FROM_NAME', label: 'From Name', type: 'text', description: 'Sender display name used for outgoing mail.' },
        ],
      },
    ],
  },
  {
    label: 'Messaging',
    value: 'messaging',
    sections: [
      {
        title: 'MSG91',
        description: 'MSG91 OTP delivery integration settings.',
        fields: [
          { key: 'MSG91_AUTH_KEY', label: 'MSG91 Auth Key', type: 'password', description: 'Primary MSG91 API auth key.' },
          { key: 'MSG91_TEMPLATE_ID', label: 'MSG91 Template ID', type: 'text', description: 'Template identifier used for OTP delivery.' },
          { key: 'MSG91_OTP_BASE_URL', label: 'MSG91 OTP Base URL', type: 'text', description: 'MSG91 OTP API base URL.' },
          { key: 'MSG91_WIDGET_VERIFY_URL', label: 'MSG91 Widget Verify URL', type: 'text', description: 'MSG91 widget token verification URL.' },
          { key: 'MSG91_COUNTRY_CODE', label: 'MSG91 Country Code', type: 'text', description: 'Default country code for MSG91 delivery.' },
        ],
      },
      {
        title: 'WhatsApp',
        description: 'Meta WhatsApp template delivery settings.',
        fields: [
          { key: 'WHATSAPP_ACCESS_TOKEN', label: 'WhatsApp Access Token', type: 'password', description: 'Meta Graph API access token.' },
          { key: 'WHATSAPP_PHONE_NUMBER_ID', label: 'WhatsApp Phone Number ID', type: 'text', description: 'Meta phone number identifier.' },
          { key: 'WHATSAPP_TEMPLATE_NAME', label: 'WhatsApp Template Name', type: 'text', description: 'Message template name.' },
          { key: 'WHATSAPP_TEMPLATE_LANGUAGE', label: 'WhatsApp Template Language', type: 'text', description: 'Template language code.' },
          { key: 'WHATSAPP_GRAPH_API_VERSION', label: 'WhatsApp API Version', type: 'text', description: 'Meta Graph API version used for requests.' },
        ],
      },
    ],
  },
  {
    label: 'Payments',
    value: 'payments',
    sections: [
      {
        title: 'Razorpay',
        description: 'Payment gateway keys and brand settings for live storefront checkout.',
        fields: [
          { key: 'RAZORPAY_KEY_ID', label: 'Razorpay Key ID', type: 'text', description: 'Public Razorpay key ID.' },
          { key: 'RAZORPAY_KEY_SECRET', label: 'Razorpay Key Secret', type: 'password', description: 'Private Razorpay secret.' },
          { key: 'RAZORPAY_BUSINESS_NAME', label: 'Business Name', type: 'text', description: 'Brand name shown in Razorpay checkout.' },
          { key: 'RAZORPAY_CHECKOUT_IMAGE', label: 'Checkout Image', type: 'text', description: 'Optional checkout logo/image URL.' },
          { key: 'RAZORPAY_THEME_COLOR', label: 'Theme Color', type: 'text', description: 'Checkout accent color.' },
        ],
      },
    ],
  },
  {
    label: 'Runtime',
    value: 'runtime',
    sections: [
      {
        title: 'Git Runtime Source',
        description: 'Controls whether the container runs from the bundled app image or a runtime Git checkout.',
        fields: [
          { key: 'GIT_SYNC_ENABLED', label: 'Git Sync Enabled', type: 'boolean', options: booleanOptions, description: 'Uses a Git-managed runtime source checkout on startup.' },
          { key: 'GIT_AUTO_UPDATE_ON_START', label: 'Auto Update On Start', type: 'boolean', options: booleanOptions, description: 'Pulls the latest commit on every container start.' },
          { key: 'GIT_FORCE_UPDATE_ON_START', label: 'Force Update On Start', type: 'boolean', options: booleanOptions, description: 'Forces a one-time refresh of the runtime Git checkout on next restart.' },
          { key: 'GIT_REPOSITORY_URL', label: 'Git Repository URL', type: 'text', description: 'Repository cloned into the runtime source volume.' },
          { key: 'GIT_BRANCH', label: 'Git Branch', type: 'text', description: 'Branch used for runtime source updates.' },
        ],
      },
      {
        title: 'Container Startup',
        description: 'Optional startup tasks for dependency installation and local builds.',
        fields: [
          { key: 'INSTALL_DEPS_ON_START', label: 'Install Dependencies On Start', type: 'boolean', options: booleanOptions, description: 'Runs npm install or npm ci on container boot.' },
          { key: 'BUILD_ON_START', label: 'Build On Start', type: 'boolean', options: booleanOptions, description: 'Builds the API and web bundle during container startup.' },
        ],
      },
    ],
  },
]

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load environment settings.'
}

function isEnabled(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase())
}

export function SystemEnvironmentPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [sourceMode, setSourceMode] = useState<'embedded' | 'git'>('embedded')
  const [forceUpdatePending, setForceUpdatePending] = useState(false)

  useEffect(() => {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }
    const resolvedToken = token

    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const environment = await getSystemEnvironment(resolvedToken)
        if (cancelled) {
          return
        }

        setValues(environment.values)
        setSourceMode(environment.sourceMode)
        setForceUpdatePending(environment.forceUpdatePending)
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
  }, [accessToken])

  const payload = useMemo<SystemEnvironmentUpdatePayload>(() => ({
    values,
  }), [values])

  async function handleSave() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const environment = await updateSystemEnvironment(token, payload)
      setValues(environment.values)
      setSourceMode(environment.sourceMode)
      setForceUpdatePending(environment.forceUpdatePending)
      showSuccessToast({
        title: 'Environment saved',
        description: 'The runtime .env file was updated without restarting the container.',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to save environment',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdateAndRestart() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setUpdating(true)
    setErrorMessage(null)

    try {
      const result = await runSystemEnvironmentUpdate(token, payload)
      setForceUpdatePending(true)
      showInfoToast({
        title: 'Restart scheduled',
        description: result.message,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to update and restart',
        description: message,
      })
    } finally {
      setUpdating(false)
    }
  }

  function updateValue(key: string, value: string) {
    setValues((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function renderField(field: EnvironmentField) {
    const value = values[field.key] ?? ''

    if (field.type === 'boolean') {
      return (
        <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
          <Checkbox
            checked={isEnabled(value)}
            onCheckedChange={(checked) => updateValue(field.key, checked === true ? 'true' : 'false')}
          />
          <div className="space-y-1">
            <p className="font-medium text-foreground">{field.label}</p>
            <p className="text-sm text-muted-foreground">{field.description}</p>
          </div>
        </label>
      )
    }

    if (field.type === 'select') {
      return (
        <div className="grid gap-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <select
            id={field.key}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            value={value}
            onChange={(event) => updateValue(field.key, event.target.value)}
          >
            {(field.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      )
    }

    if (field.type === 'textarea') {
      return (
        <div className="grid gap-2">
          <Label htmlFor={field.key}>{field.label}</Label>
          <Textarea
            id={field.key}
            value={value}
            onChange={(event) => updateValue(field.key, event.target.value)}
            placeholder={field.placeholder}
            className="min-h-28"
          />
          <p className="text-xs text-muted-foreground">{field.description}</p>
        </div>
      )
    }

    return (
      <div className="grid gap-2">
        <Label htmlFor={field.key}>{field.label}</Label>
        <Input
          id={field.key}
          type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(event) => updateValue(field.key, event.target.value)}
          placeholder={field.placeholder}
        />
        <p className="text-xs text-muted-foreground">{field.description}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Environment</CardTitle>
            <CardDescription>Loading runtime .env controls.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Super admin</Badge>
              <div>
                <CardTitle className="text-3xl">Environment variables and runtime control</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Manage the runtime `.env` file directly from the framework shell. Save writes configuration only. Update and restart saves the file, schedules the next runtime refresh, and restarts the container.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{sourceMode === 'git' ? 'Git runtime source' : 'Embedded image source'}</Badge>
              {forceUpdatePending ? <Badge>Restart queued</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatedTabs
            defaultTabValue={environmentTabs[0].value}
            tabs={environmentTabs.map((tab) => ({
              label: tab.label,
              value: tab.value,
              content: (
                <div className="space-y-4">
                  {tab.sections.map((section) => (
                    <Card key={section.title} className="rounded-md border-border/70">
                      <CardHeader>
                        <CardTitle className="text-xl">{section.title}</CardTitle>
                        <CardDescription>{section.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2">
                        {section.fields.map((field) => (
                          <div key={field.key} className={field.type === 'textarea' || field.type === 'boolean' ? 'md:col-span-2' : undefined}>
                            {renderField(field)}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ),
            }) satisfies AnimatedContentTab)}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-amber-300/60 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="size-5" />
              Apply flow
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Save writes only to the runtime `.env` file after validation.</p>
            <p>Update and restart saves the `.env`, sets the next runtime refresh flag, then restarts the container.</p>
            <p>Invalid values are rejected before the file is written so the running runtime config stays consistent.</p>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="size-5" />
              Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Signed in as <span className="font-medium text-foreground">{session?.user.email}</span></p>
            <p>Only super-admin users can open this screen, write `.env`, or schedule the runtime restart.</p>
          </CardContent>
        </Card>
      </div>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4" />
            <span>{errorMessage}</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => void handleSave()} disabled={saving || updating}>
          {saving ? 'Saving...' : 'Save environment'}
        </Button>
        <Button onClick={() => void handleUpdateAndRestart()} disabled={saving || updating}>
          <RefreshCcw className="size-4" />
          {updating ? 'Scheduling restart...' : 'Update and restart'}
        </Button>
      </div>
    </div>
  )
}
