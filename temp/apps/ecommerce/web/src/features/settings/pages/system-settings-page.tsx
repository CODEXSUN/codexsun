import type { SystemSettingsUpdatePayload } from '@shared/index'
import { useEffect, useState } from 'react'
import { AlertTriangle, GitBranch, RefreshCcw, ShieldCheck } from 'lucide-react'
import { frontendLabels } from '@/config/frontend'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  getSystemSettings,
  HttpError,
  runSystemUpdate,
  updateSystemSettings,
} from '@/shared/api/client'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load system settings.'
}

export function SystemSettingsPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [runningUpdate, setRunningUpdate] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState<SystemSettingsUpdatePayload>({
    frontendTarget: 'web',
    update: {
      gitSyncEnabled: true,
      autoUpdateOnStart: false,
      repositoryUrl: 'https://github.com/CODEXSUN/codexsun.git',
      branch: 'main',
    },
  })
  const [sourceMode, setSourceMode] = useState<'embedded' | 'git'>('embedded')
  const [forceUpdatePending, setForceUpdatePending] = useState(false)

  useEffect(() => {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    let cancelled = false

    async function load() {
      const authToken = accessToken
      if (!authToken) {
        return
      }
      setLoading(true)
      setErrorMessage(null)

      try {
        const settings = await getSystemSettings(authToken)
        if (cancelled) {
          return
        }

        setForm({
          frontendTarget: settings.frontendTarget,
          update: {
            gitSyncEnabled: settings.update.gitSyncEnabled,
            autoUpdateOnStart: settings.update.autoUpdateOnStart,
            repositoryUrl: settings.update.repositoryUrl,
            branch: settings.update.branch,
          },
        })
        setSourceMode(settings.sourceMode)
        setForceUpdatePending(settings.update.forceUpdateOnStart)
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

  async function handleSave() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const settings = await updateSystemSettings(token, form)
      setSourceMode(settings.sourceMode)
      setForceUpdatePending(settings.update.forceUpdateOnStart)
      showSuccessToast({
        title: 'Settings saved',
        description: 'The runtime .env file was updated. Restart or run update to apply frontend target changes.',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to save settings',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleRunUpdate() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setRunningUpdate(true)
    setErrorMessage(null)

    try {
      const result = await runSystemUpdate(token, form)
      setForceUpdatePending(true)
      showInfoToast({
        title: 'Update scheduled',
        description: result.message,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to start update',
        description: message,
      })
    } finally {
      setRunningUpdate(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Loading super-admin controls.</CardDescription>
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
                <CardTitle className="text-3xl">System settings and update control</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  This surface controls the runtime `.env`, Git update mode, and the next frontend target. Use update and restart after changing repository or target settings.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{sourceMode === 'git' ? 'Git runtime source' : 'Embedded image source'}</Badge>
              {forceUpdatePending ? <Badge>Restart queued</Badge> : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <GitBranch className="size-5" />
                Update source
              </CardTitle>
              <CardDescription>
                Manual update uses the Git-managed runtime source. Auto update pulls on every container restart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="repository-url">Repository URL</Label>
                <Input
                  id="repository-url"
                  value={form.update.repositoryUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      update: { ...current.update, repositoryUrl: event.target.value },
                    }))
                  }
                  placeholder="https://github.com/CODEXSUN/codexsun.git"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={form.update.branch}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      update: { ...current.update, branch: event.target.value },
                    }))
                  }
                  placeholder="main"
                />
              </div>

              <div className="grid gap-4 rounded-2xl border border-border/70 bg-muted/30 p-4">
                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={form.update.gitSyncEnabled}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        update: { ...current.update, gitSyncEnabled: checked === true },
                      }))
                    }
                  />
                  <div>
                    <p className="font-medium text-foreground">Use Git-managed runtime source</p>
                    <p className="text-sm text-muted-foreground">
                      Keeps the running app on the repository checkout stored in the runtime volume instead of only the image copy.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <Checkbox
                    checked={form.update.autoUpdateOnStart}
                    onCheckedChange={(checked) =>
                      setForm((current) => ({
                        ...current,
                        update: { ...current.update, autoUpdateOnStart: checked === true },
                      }))
                    }
                  />
                  <div>
                    <p className="font-medium text-foreground">Auto update on restart</p>
                    <p className="text-sm text-muted-foreground">
                      Pull the latest commit from the configured branch every time the container starts.
                    </p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border/70">
              <CardHeader>
                <CardTitle className="text-xl">Frontend target</CardTitle>
                <CardDescription>
                  Choose which built frontend should boot after the next update or restart.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Label htmlFor="frontend-target">Target</Label>
                <select
                  id="frontend-target"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  value={form.frontendTarget}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      frontendTarget: event.target.value as SystemSettingsUpdatePayload['frontendTarget'],
                    }))
                  }
                >
                  {Object.entries(frontendLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </CardContent>
            </Card>

            <Card className="border-amber-300/60 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="size-5" />
                  Apply flow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Save writes only to `.env`.</p>
                <p>Update and restart rebuilds from Git, applies the selected frontend target, then restarts the container.</p>
                <p>Only super-admin users can open this screen or trigger the restart flow.</p>
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
                <p>Super-admin access is enforced by server-side email allowlist and admin actor type.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="flex items-start gap-3 p-4 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4" />
            <span>{errorMessage}</span>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={() => void handleSave()} disabled={saving || runningUpdate}>
          {saving ? 'Saving...' : 'Save settings'}
        </Button>
        <Button onClick={() => void handleRunUpdate()} disabled={saving || runningUpdate}>
          <RefreshCcw className="size-4" />
          {runningUpdate ? 'Scheduling update...' : 'Update and restart'}
        </Button>
      </div>
    </div>
  )
}
