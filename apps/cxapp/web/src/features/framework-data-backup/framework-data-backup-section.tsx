import { useEffect, useMemo, useState } from "react"
import {
  CloudUploadIcon,
  DatabaseIcon,
  DownloadIcon,
  RefreshCcwIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  TriangleAlertIcon,
} from "lucide-react"

import type {
  DatabaseBackupDashboard,
  DatabaseBackupRecord,
  DatabaseRestoreRun,
} from "../../../../../framework/shared/database-operations"
import type {
  RuntimeSettingsSaveResponse,
  RuntimeSettingsSnapshot,
} from "../../../../../framework/shared/runtime-settings"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

type RuntimeSettingsValueMap = RuntimeSettingsSnapshot["values"]

type BackupActionResponse = {
  item: DatabaseBackupRecord | DatabaseRestoreRun
}

const backupSettingDefinitions = [
  ["DB_BACKUP_ENABLED", "Scheduled Backups", "boolean", "Turn periodic database backups on or off."],
  ["DB_BACKUP_CADENCE_HOURS", "Cadence Hours", "number", "Target hours between scheduled database backups."],
  ["DB_BACKUP_RETENTION_DAYS", "Retention Days", "number", "Retention window for backup artifacts."],
  ["DB_BACKUP_MAX_FILES", "Max Backup Files", "number", "Keep only the latest local backup files. Industrial default here is 5."],
  ["DB_BACKUP_LAST_VERIFIED_AT", "Last Verified At", "string", "Manual checkpoint for the last verified restore drill if you need to override it."],
  ["GDRIVE_BACKUP_ENABLED", "Google Drive Upload", "boolean", "Upload each completed local backup to Google Drive."],
  ["GDRIVE_CLIENT_ID", "Google Client Id", "string", "OAuth client id for Drive uploads."],
  ["GDRIVE_CLIENT_SECRET", "Google Client Secret", "password", "OAuth client secret for Drive uploads."],
  ["GDRIVE_REFRESH_TOKEN", "Google Refresh Token", "password", "Refresh token used to obtain Drive access tokens."],
  ["GDRIVE_FOLDER_ID", "Google Folder Id", "string", "Destination folder id in Google Drive."],
] as const

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

  const payload = (await response.json().catch(() => null)) as
    | { error?: string; message?: string }
    | null

  if (!response.ok) {
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return payload as T
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Not recorded"
  }

  return new Date(value).toLocaleString()
}

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB", "TB"]
  const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1)
  const amount = value / 1024 ** exponent

  return `${amount.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function BackupSettingsField({
  description,
  label,
  onChange,
  type,
  value,
}: {
  description: string
  label: string
  onChange: (value: string | boolean) => void
  type: "boolean" | "number" | "string" | "password"
  value: string | boolean | undefined
}) {
  const elementId = `backup-setting-${label.toLowerCase().replace(/\s+/g, "-")}`

  if (type === "boolean") {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor={elementId}>{label}</Label>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Switch id={elementId} checked={Boolean(value)} onCheckedChange={onChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-2">
      <Label htmlFor={elementId}>{label}</Label>
      <Input
        id={elementId}
        type={type === "password" ? "password" : type}
        value={typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="text-[11px] text-muted-foreground">{description}</p>
    </div>
  )
}

export function FrameworkDataBackupSection() {
  const [dashboard, setDashboard] = useState<DatabaseBackupDashboard | null>(null)
  const [values, setValues] = useState<RuntimeSettingsValueMap>({})
  const [envFilePath, setEnvFilePath] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isRunningBackup, setIsRunningBackup] = useState(false)
  const [actionBackupId, setActionBackupId] = useState<string | null>(null)
  const [restoreSummary, setRestoreSummary] = useState("")
  useGlobalLoading(isLoading || isSaving || isRunningBackup || Boolean(actionBackupId))

  async function loadData() {
    setIsLoading(true)
    setError(null)

    try {
      const [backupResponse, settingsSnapshot] = await Promise.all([
        requestJson<DatabaseBackupDashboard>("/internal/v1/framework/database-backups"),
        requestJson<RuntimeSettingsSnapshot>("/internal/v1/cxapp/runtime-settings"),
      ])
      setDashboard(backupResponse)
      setValues(settingsSnapshot.values)
      setEnvFilePath(settingsSnapshot.envFilePath)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load backup operations.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
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

      setValues(response.snapshot.values)
      setEnvFilePath(response.snapshot.envFilePath)
      setMessage(
        restart
          ? "Backup settings saved. Restart is being applied."
          : "Backup settings saved. Restart later if you want scheduler changes to apply immediately."
      )
      showRecordToast({
        entity: "Data Backup",
        action: "saved",
        recordName: "Backup settings",
        recordId: "framework-data-backup",
      })
      if (restart) {
        window.setTimeout(() => window.location.reload(), 2500)
      }
      await loadData()
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save backup settings.")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRunBackup() {
    if (!dashboard?.support.supported) {
      return
    }

    setIsRunningBackup(true)
    setError(null)

    try {
      const response = await requestJson<BackupActionResponse>(
        "/internal/v1/framework/database-backups/run",
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )
      showRecordToast({
        entity: "Backup",
        action: "saved",
        recordName: "Manual backup",
        recordId: response.item.id,
      })
      showAppToast({
        variant: "info",
        title: "Manual backup completed.",
        description: "The database backup file has been written to the operations backup directory.",
      })
      await loadData()
    } catch (runError) {
      setError(runError instanceof Error ? runError.message : "Manual backup failed.")
    } finally {
      setIsRunningBackup(false)
    }
  }

  async function handleRestoreDrill(backupId: string) {
    if (!dashboard?.support.supported) {
      return
    }

    setActionBackupId(backupId)
    setError(null)

    try {
      const response = await requestJson<BackupActionResponse>(
        `/internal/v1/framework/database-backups/restore-drill?id=${encodeURIComponent(backupId)}`,
        {
          method: "POST",
          body: JSON.stringify({}),
        }
      )
      showRecordToast({
        entity: "Restore Drill",
        action: "saved",
        recordName: "Restore drill",
        recordId: response.item.id,
      })
      await loadData()
    } catch (drillError) {
      setError(drillError instanceof Error ? drillError.message : "Restore drill failed.")
    } finally {
      setActionBackupId(null)
    }
  }

  async function handleRestoreLive(backup: DatabaseBackupRecord) {
    if (!dashboard?.support.supported) {
      return
    }

    const confirmed = window.confirm(
      `Restore backup ${backup.fileName} now? The application will schedule a restart after copying the selected backup.`
    )

    if (!confirmed) {
      return
    }

    setActionBackupId(backup.id)
    setError(null)

    try {
      await requestJson<BackupActionResponse>(
        `/internal/v1/framework/database-backups/restore?id=${encodeURIComponent(backup.id)}`,
        {
          method: "POST",
          body: JSON.stringify({
            summary: restoreSummary,
          }),
        }
      )
      showAppToast({
        variant: "warning",
        title: "Restore scheduled.",
        description: "A restore point backup was created and the runtime restart has been scheduled.",
      })
      await loadData()
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : "Live restore failed.")
    } finally {
      setActionBackupId(null)
    }
  }

  const tabs = useMemo<AnimatedContentTab[]>(() => {
    const latestBackup = dashboard?.latestBackup ?? null

    return [
      {
        value: "overview",
        label: "Overview",
        content: (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Latest Backup</p><p className="text-sm font-semibold text-foreground">{latestBackup ? formatTimestamp(latestBackup.completedAt ?? latestBackup.createdAt) : "None"}</p></CardContent></Card>
              <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Local Files</p><p className="text-2xl font-semibold text-foreground">{dashboard?.backups.length ?? 0}</p></CardContent></Card>
              <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Max Files</p><p className="text-2xl font-semibold text-foreground">{dashboard?.scheduler.maxBackups ?? "-"}</p></CardContent></Card>
              <Card><CardContent className="space-y-2 p-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last Drill</p><p className="text-sm font-semibold text-foreground">{formatTimestamp(dashboard?.scheduler.lastVerifiedAt ?? null)}</p></CardContent></Card>
            </div>

            {dashboard && !dashboard.support.supported ? (
              <Card className="rounded-[1.5rem] border-amber-300/60 bg-amber-50/80 shadow-sm">
                <CardContent className="flex gap-3 p-5">
                  <TriangleAlertIcon className="mt-0.5 size-5 text-amber-700" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-950">
                      Backup execution is currently unsupported
                    </p>
                    <p className="text-sm leading-6 text-amber-900">
                      {dashboard.support.reason ??
                        "Manual backup, scheduled backup, and restore actions are disabled in this runtime."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Backup Targets</CardTitle>
                <CardDescription>
                  Local root is fixed at `storage/backups/database`, and Google Drive upload is optional.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Local backup directory</p>
                  </div>
                  <p className="mt-3 break-all text-sm leading-6 text-muted-foreground">{dashboard?.backupDirectory ?? "-"}</p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
                  <div className="flex items-center gap-2">
                    <CloudUploadIcon className="size-4 text-muted-foreground" />
                    <p className="text-sm font-semibold text-foreground">Google Drive</p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {!dashboard?.support.supported
                      ? "Drive upload is unavailable because backup execution is not supported in this runtime."
                      : dashboard?.drive.enabled
                      ? dashboard.drive.configured
                        ? `Enabled and configured for folder ${dashboard.drive.folderId ?? "-"}`
                        : "Enabled but missing credentials or target folder."
                      : "Disabled."}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Latest Backup</CardTitle>
                <CardDescription>
                  Manual backups, scheduled cadence, and restore drills run from this same operations controller.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!latestBackup ? (
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">No completed backup is recorded yet.</div>
                ) : (
                  <div className="grid gap-3 lg:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">File</p><p className="mt-2 break-all text-sm font-medium text-foreground">{latestBackup.fileName}</p></div>
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Size</p><p className="mt-2 text-sm font-medium text-foreground">{formatBytes(latestBackup.sizeBytes)}</p></div>
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Status</p><p className="mt-2 text-sm font-medium text-foreground">{latestBackup.status} / {latestBackup.storageTarget}</p></div>
                    <div className="rounded-2xl border border-border/70 bg-card/70 p-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Google Drive</p><p className="mt-2 text-sm font-medium text-foreground">{latestBackup.googleDriveSyncStatus}</p></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ),
      },
      {
        value: "automation",
        label: "Automation",
        content: (
          <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle>Backup Automation Settings</CardTitle>
              <CardDescription>
                These values are saved through runtime settings so operations can control cadence, retention, and Drive upload without code edits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-5 lg:grid-cols-2">
                {backupSettingDefinitions.map(([key, label, type, description]) => (
                  <BackupSettingsField
                    key={key}
                    label={label}
                    type={type}
                    description={description}
                    value={values[key]}
                    onChange={(nextValue) =>
                      setValues((current) => ({ ...current, [key]: nextValue }))
                    }
                  />
                ))}
              </div>
              <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                Runtime settings file: {envFilePath || "-"}
              </div>
            </CardContent>
          </Card>
        ),
      },
      {
        value: "restore",
        label: "Restore",
        content: (
          <div className="space-y-6">
            <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Restore Controls</CardTitle>
                <CardDescription>
                  Run restore drills regularly. Live restore creates a restore-point backup first, then schedules an application restart.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!dashboard?.support.supported ? (
                  <div className="rounded-xl border border-amber-300/50 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
                    {dashboard?.support.reason ??
                      "Restore controls are unavailable because backup execution is not supported in this runtime."}
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label htmlFor="backup-restore-summary">Live restore note</Label>
                  <Textarea
                    id="backup-restore-summary"
                    value={restoreSummary}
                    onChange={(event) => setRestoreSummary(event.target.value)}
                    placeholder="Optional operator note for the live restore decision."
                    disabled={!dashboard?.support.supported}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Available Backups</CardTitle>
                <CardDescription>
                  Local backup files are pruned to the configured max count after each successful run.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard || dashboard.backups.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">No backups are available yet.</div>
                ) : (
                  dashboard.backups.map((backup) => (
                    <div key={backup.id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{backup.fileName}</p>
                          <p className="text-xs text-muted-foreground">{formatTimestamp(backup.completedAt ?? backup.createdAt)} / {formatBytes(backup.sizeBytes)} / {backup.googleDriveSyncStatus}</p>
                          <p className="text-xs text-muted-foreground">{backup.summary ?? "No summary recorded."}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="outline" onClick={() => void handleRestoreDrill(backup.id)} disabled={actionBackupId === backup.id || !dashboard?.support.supported}><ShieldCheckIcon className="size-4" />Restore Drill</Button>
                          <Button type="button" variant="outline" onClick={() => void handleRestoreLive(backup)} disabled={actionBackupId === backup.id || !dashboard?.support.supported}><RotateCcwIcon className="size-4" />Restore Live</Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-sm">
              <CardHeader>
                <CardTitle>Restore History</CardTitle>
                <CardDescription>Latest drills and live restore runs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!dashboard || dashboard.restoreRuns.length === 0 ? (
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">No restore runs are recorded yet.</div>
                ) : (
                  dashboard.restoreRuns.map((run) => (
                    <div key={run.id} className="rounded-2xl border border-border/70 bg-card/70 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-foreground">{run.mode === "drill" ? "Restore drill" : "Live restore"} / {run.status}</p>
                          <p className="text-xs text-muted-foreground">{run.summary ?? "No summary recorded."}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{formatTimestamp(run.completedAt ?? run.createdAt)}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        ),
      },
    ]
  }, [dashboard, envFilePath, values, actionBackupId, restoreSummary])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Data Backup</h1>
          <p className="text-sm text-muted-foreground">
            Schedule database backups, run restore drills, keep five local artifacts, and optionally push copies to Google Drive.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void loadData()} disabled={isLoading || isSaving}><RefreshCcwIcon className="size-4" />Refresh</Button>
          <Button type="button" variant="outline" onClick={() => void handleSave(false)} disabled={isSaving}>{isSaving ? "Saving..." : "Save"}</Button>
          <Button type="button" onClick={() => void handleSave(true)} disabled={isSaving}>{isSaving ? "Saving..." : "Save & Restart"}</Button>
          <Button type="button" onClick={() => void handleRunBackup()} disabled={isRunningBackup || !dashboard?.support.supported}><DownloadIcon className="size-4" />{isRunningBackup ? "Running..." : "Run Backup"}</Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">{message}</div> : null}

      {isLoading ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">Loading backup operations...</CardContent>
        </Card>
      ) : (
        <AnimatedTabs defaultTabValue="overview" tabs={tabs} />
      )}
    </div>
  )
}
