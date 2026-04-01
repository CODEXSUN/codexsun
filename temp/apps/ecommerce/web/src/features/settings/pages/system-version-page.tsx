import type { SystemSettingsUpdatePayload, SystemUpdateCheck, SystemVersion } from '@shared/index'
import { useEffect, useState } from 'react'
import { ArrowUpRight, Database, GitBranch, Info, RefreshCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import {
  getSystemSettings,
  getSystemUpdateCheck,
  getSystemVersion,
  HttpError,
  runSystemUpdate,
} from '@/shared/api/client'
import { showErrorToast, showInfoToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load version details.'
}

function formatCommit(value: string | null) {
  return value ? value.slice(0, 7) : 'unknown'
}

export function SystemVersionPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const isSuperAdmin = Boolean(session?.user.isSuperAdmin)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [version, setVersion] = useState<SystemVersion | null>(null)
  const [savedSettings, setSavedSettings] = useState<SystemSettingsUpdatePayload | null>(null)
  const [updateCheck, setUpdateCheck] = useState<SystemUpdateCheck | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const versionResult = await getSystemVersion()

        if (cancelled) {
          return
        }

        setVersion(versionResult)

        if (isSuperAdmin && accessToken) {
          const settingsResult = await getSystemSettings(accessToken)

          if (cancelled) {
            return
          }

          setSavedSettings({
            frontendTarget: settingsResult.frontendTarget,
            update: {
              gitSyncEnabled: settingsResult.update.gitSyncEnabled,
              autoUpdateOnStart: settingsResult.update.autoUpdateOnStart,
              repositoryUrl: settingsResult.update.repositoryUrl,
              branch: settingsResult.update.branch,
            },
          })
        } else {
          setSavedSettings(null)
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
  }, [accessToken, isSuperAdmin])

  async function handleCheckUpdate() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setChecking(true)
    setErrorMessage(null)

    try {
      const result = await getSystemUpdateCheck(token)
      setUpdateCheck(result)
      showInfoToast({
        title: result.updateAvailable ? 'Update available' : 'No update found',
        description: result.detail,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to check updates',
        description: message,
      })
    } finally {
      setChecking(false)
    }
  }

  async function handleRunUpdate() {
    const token = accessToken
    if (typeof token !== 'string' || !savedSettings) {
      return
    }

    setUpdating(true)
    setErrorMessage(null)

    try {
      const result = await runSystemUpdate(token, savedSettings)
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
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>System update</CardTitle>
            <CardDescription>Loading application version and update details.</CardDescription>
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
              <Badge>System update</Badge>
              <div>
                <CardTitle className="text-3xl">System update and version status</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Review the running application build, the active database schema version, and the configured Git update source before applying a restart.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {isSuperAdmin ? (
                <Button variant="outline" asChild>
                  <Link to={buildAdminPortalPath('/settings')}>
                    Open settings
                    <ArrowUpRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
              <Button variant="outline" onClick={() => void handleCheckUpdate()} disabled={checking || updating}>
                <RefreshCcw className="size-4" />
                {checking ? 'Checking...' : 'Check for update'}
              </Button>
              {isSuperAdmin ? (
                <Button onClick={() => void handleRunUpdate()} disabled={updating || !savedSettings || !updateCheck?.updateAvailable}>
                  <GitBranch className="size-4" />
                  {updating ? 'Scheduling update...' : 'Update and restart'}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Info className="size-5" />
                Application build
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">App version</span>
                <span className="font-medium text-foreground">v{version?.application.version ?? 'unknown'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Source mode</span>
                <span className="font-medium text-foreground">{version?.application.sourceMode ?? 'unknown'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Current commit</span>
                <span className="font-medium text-foreground">{formatCommit(version?.application.currentCommitSha ?? null)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Database className="size-5" />
                Database schema
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Current version</span>
                <span className="font-medium text-foreground">{version?.database.currentVersionId ?? 'not-ready'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Latest known version</span>
                <span className="font-medium text-foreground">{version?.database.latestVersionId ?? 'unknown'}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Applied migrations</span>
                <span className="font-medium text-foreground">{version?.database.appliedMigrations ?? 0}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Pending migrations</span>
                <span className="font-medium text-foreground">{version?.database.pendingMigrations ?? 0}</span>
              </div>
              <div className="rounded-xl border border-border/70 p-3 text-muted-foreground">
                {version?.database.detail ?? 'No database detail available.'}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update source status</CardTitle>
          <CardDescription>
            The update check compares the configured repository and branch against the running source when the current commit can be detected.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
            <span className="text-muted-foreground">Repository</span>
            <span className="font-medium text-foreground">
              {savedSettings?.update.repositoryUrl ?? updateCheck?.repositoryUrl ?? 'Run update check'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
            <span className="text-muted-foreground">Branch</span>
            <span className="font-medium text-foreground">
              {savedSettings?.update.branch ?? updateCheck?.branch ?? 'Run update check'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
            <span className="text-muted-foreground">Remote commit</span>
            <span className="font-medium text-foreground">{formatCommit(updateCheck?.remoteCommitSha ?? null)}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
            <span className="text-muted-foreground">Update availability</span>
            <span className="font-medium text-foreground">
              {!updateCheck
                ? 'Not checked'
                : !updateCheck.canAutoCompare
                  ? 'Comparison unavailable'
                  : updateCheck.updateAvailable
                    ? 'Available'
                    : 'No update'}
            </span>
          </div>
          <div className="rounded-xl border border-border/70 p-3 text-muted-foreground">
            {updateCheck?.detail ?? 'Run "Check for update" to compare the configured Git source.'}
          </div>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      {!isSuperAdmin ? (
        <Card>
          <CardContent className="p-4 text-sm text-muted-foreground">
            This page is read-only for your account. Super admin access is required for settings changes and update restart actions.
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
