import type { DatabaseManagerReport, DatabaseManagerTable, DatabaseRestoreJob, DatabaseRestoreMode } from '@shared/index'
import { type ChangeEvent, useEffect, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  Database,
  Download,
  FolderUp,
  HardDriveDownload,
  RefreshCcw,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/ui/popover'
import { Progress } from '@ui/components/ui/progress'
import {
  backupDatabaseManager,
  deleteDatabaseManagerBackup,
  downloadDatabaseManagerBackup,
  getDatabaseManager,
  getRestoreDatabaseManagerJob,
  hardResetDatabaseManager,
  HttpError,
  migrateDatabaseManager,
  restoreDatabaseManager,
  uploadDatabaseManagerBackup,
  verifyDatabaseManager,
} from '@/shared/api/client'
import { showErrorToast, showInfoToast, showSuccessToast } from '@/shared/notifications/toast'

const hardResetConfirmationText = 'RESET CODEXSUN DATABASE'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    const context = error.context
    const detail = context && typeof context === 'object' && 'detail' in context
      ? String((context as { detail?: unknown }).detail ?? '')
      : ''
    const fsMessage = context && typeof context === 'object' && 'fsMessage' in context
      ? String((context as { fsMessage?: unknown }).fsMessage ?? '')
      : ''

    if (detail) {
      return detail
    }

    if (fsMessage) {
      return fsMessage
    }

    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to complete the database maintenance action.'
}

function formatCount(value: number | null | undefined) {
  if (typeof value !== 'number') {
    return 'n/a'
  }

  return new Intl.NumberFormat('en-IN').format(value)
}

function formatBackupSize(byteSize: number) {
  if (byteSize < 1024) {
    return `${byteSize} B`
  }

  if (byteSize < 1024 * 1024) {
    return `${(byteSize / 1024).toFixed(1)} KB`
  }

  if (byteSize < 1024 * 1024 * 1024) {
    return `${(byteSize / (1024 * 1024)).toFixed(1)} MB`
  }

  return `${(byteSize / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

function formatBackupTimestamp(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function resolveRestoreFileName(
  nextReport: DatabaseManagerReport,
  currentFileName: string,
  preferredFileName?: string,
) {
  const availableFileNames = new Set(nextReport.availableBackups.map((backup) => backup.fileName))

  if (preferredFileName && availableFileNames.has(preferredFileName)) {
    return preferredFileName
  }

  if (currentFileName && availableFileNames.has(currentFileName)) {
    return currentFileName
  }

  return nextReport.latestBackup?.fileName ?? ''
}

function getStatusBadgeClassName(status: DatabaseManagerTable['status'] | DatabaseManagerReport['verification']['status']) {
  if (status === 'ok' || status === 'ready') {
    return ''
  }

  if (status === 'missing' || status === 'error') {
    return 'bg-destructive/15 text-destructive'
  }

  return ''
}

export function DatabaseManagerPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [report, setReport] = useState<DatabaseManagerReport | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [migrating, setMigrating] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [uploadingBackup, setUploadingBackup] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | DatabaseManagerTable['status']>('all')
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [restoreFileName, setRestoreFileName] = useState('')
  const [restoreMode, setRestoreMode] = useState<DatabaseRestoreMode>('fresh')
  const [restoreJob, setRestoreJob] = useState<DatabaseRestoreJob | null>(null)
  const [backupPickerOpen, setBackupPickerOpen] = useState(false)
  const [backupSearchTerm, setBackupSearchTerm] = useState('')
  const [refreshingBackups, setRefreshingBackups] = useState(false)
  const [deletingBackupFileName, setDeletingBackupFileName] = useState<string | null>(null)
  const restoreJobId = restoreJob?.jobId ?? null
  const restoreJobStatus = restoreJob?.status ?? null

  function syncReport(nextReport: DatabaseManagerReport, preferredFileName?: string) {
    setReport(nextReport)
    setRestoreFileName((currentFileName) => resolveRestoreFileName(nextReport, currentFileName, preferredFileName))
  }

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
        const nextReport = await getDatabaseManager(resolvedToken)
        if (!cancelled) {
          syncReport(nextReport)
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
  }, [accessToken])

  useEffect(() => {
    const token = accessToken
    const activeJobId = restoreJobId

    if (
      typeof token !== 'string'
      || typeof activeJobId !== 'string'
      || (restoreJobStatus !== 'queued' && restoreJobStatus !== 'running')
    ) {
      return
    }
    const resolvedToken = token
    const restoreJobKey = activeJobId as string

    let cancelled = false

    async function pollRestoreJob() {
      try {
        const result = await getRestoreDatabaseManagerJob(resolvedToken, restoreJobKey)
        if (cancelled) {
          return
        }

        const nextJob = result.job
        setRestoreJob(nextJob)

        if (nextJob.status === 'completed' && nextJob.result) {
          syncReport(nextJob.result.report, nextJob.result.restoredBackup.fileName)
          showSuccessToast({
            title: 'Backup restored',
            description: `${nextJob.result.restoredBackup.fileName} restored. Safety backup: ${nextJob.result.safetyBackup.fileName}.`,
          })
          setRestoring(false)
          window.setTimeout(() => setRestoreJob(null), 800)
          return
        }

        if (nextJob.status === 'failed') {
          const message = nextJob.errorContext && typeof nextJob.errorContext === 'object' && 'detail' in nextJob.errorContext
            ? String((nextJob.errorContext as { detail?: unknown }).detail ?? nextJob.errorMessage ?? 'Unable to restore backup')
            : nextJob.errorMessage ?? 'Unable to restore backup'

          setErrorMessage(message)
          showErrorToast({
            title: 'Unable to restore backup',
            description: message,
          })
          setRestoring(false)
          window.setTimeout(() => setRestoreJob(null), 800)
          return
        }
      } catch (error) {
        if (!cancelled) {
          const message = toErrorMessage(error)
          setErrorMessage(message)
          showErrorToast({
            title: 'Unable to restore backup',
            description: message,
          })
          setRestoring(false)
        }
      }
    }

    void pollRestoreJob()
    const timer = window.setInterval(() => {
      void pollRestoreJob()
    }, 1200)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [accessToken, restoreJobId, restoreJobStatus])

  async function handleVerify() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setVerifying(true)
    setErrorMessage(null)

    try {
      const result = await verifyDatabaseManager(token)
      syncReport(result.report)
      showInfoToast({
        title: 'Verification finished',
        description: result.message,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to verify database',
        description: message,
      })
    } finally {
      setVerifying(false)
    }
  }

  async function handleMigrate() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setMigrating(true)
    setErrorMessage(null)

    try {
      const result = await migrateDatabaseManager(token)
      syncReport(result.report)
      showSuccessToast({
        title: 'Database updated',
        description: result.message,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to update schema',
        description: message,
      })
    } finally {
      setMigrating(false)
    }
  }

  async function handleBackupAndDownload() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setBackingUp(true)
    setErrorMessage(null)

    try {
      const result = await backupDatabaseManager(token)
      syncReport(result.report, result.backup.fileName)
      await downloadDatabaseManagerBackup(token, result.backup.downloadPath, result.backup.fileName)
      showSuccessToast({
        title: 'Backup created',
        description: `${result.backup.fileName} was generated and downloaded.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to backup database',
        description: message,
      })
    } finally {
      setBackingUp(false)
    }
  }

  async function handleDownloadLatestBackup() {
    const token = accessToken
    if (typeof token !== 'string' || !report?.latestBackup) {
      return
    }

    try {
      await downloadDatabaseManagerBackup(token, report.latestBackup.downloadPath, report.latestBackup.fileName)
      showInfoToast({
        title: 'Backup download started',
        description: report.latestBackup.fileName,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to download backup',
        description: message,
      })
    }
  }

  async function handleRestoreBackup() {
    const token = accessToken
    if (typeof token !== 'string' || !restoreFileName) {
      return
    }

    setRestoring(true)
    setErrorMessage(null)

    try {
      const result = await restoreDatabaseManager(token, {
        fileName: restoreFileName,
        mode: restoreMode,
      })
      setRestoreJob(result.job)
      showInfoToast({
        title: 'Restore queued',
        description: `${result.job.fileName} is now running in the background.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to restore backup',
        description: message,
      })
      setRestoring(false)
    }
  }

  async function handleUploadBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const token = accessToken
    const file = event.target.files?.[0]

    if (typeof token !== 'string' || !file) {
      return
    }

    setUploadingBackup(true)
    setErrorMessage(null)

    try {
      const content = await file.text()
      const result = await uploadDatabaseManagerBackup(token, {
        fileName: file.name,
        content,
      })
      syncReport(result.report, result.backup.fileName)
      showSuccessToast({
        title: 'Backup uploaded',
        description: `${result.backup.fileName} is now available in server storage.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to upload backup',
        description: message,
      })
    } finally {
      event.target.value = ''
      setUploadingBackup(false)
    }
  }

  async function handleRefreshBackupFiles() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setRefreshingBackups(true)
    setErrorMessage(null)

    try {
      const nextReport = await getDatabaseManager(token)
      syncReport(nextReport)
      showInfoToast({
        title: 'Backup files reloaded',
        description: `${nextReport.availableBackups.length} file(s) available in storage.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to reload backup files',
        description: message,
      })
    } finally {
      setRefreshingBackups(false)
    }
  }

  async function handleDeleteBackup(fileName: string) {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    const confirmed = window.confirm(`Delete "${fileName}" from server storage?`)
    if (!confirmed) {
      return
    }

    setDeletingBackupFileName(fileName)
    setErrorMessage(null)

    try {
      const result = await deleteDatabaseManagerBackup(token, fileName)
      syncReport(result.report)
      showSuccessToast({
        title: 'Backup deleted',
        description: `${result.deletedFileName} was removed from server storage.`,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to delete backup',
        description: message,
      })
    } finally {
      setDeletingBackupFileName(null)
    }
  }

  async function handleHardReset() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setResetting(true)
    setErrorMessage(null)

    try {
      const result = await hardResetDatabaseManager(token, {
        confirmation: resetConfirmation,
      })
      syncReport(result.report)
      setResetDialogOpen(false)
      setResetConfirmation('')
      showSuccessToast({
        title: 'Managed schema rebuilt',
        description: result.message,
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to hard reset database',
        description: message,
      })
    } finally {
      setResetting(false)
    }
  }

  function setFreshRestoreMode(nextEnabled: boolean) {
    setRestoreMode(nextEnabled ? 'fresh' : 'incremental')
  }

  function setIncrementalRestoreMode(nextEnabled: boolean) {
    setRestoreMode(nextEnabled ? 'incremental' : 'fresh')
  }

  const filteredTables = (report?.tables ?? []).filter((table) => {
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const matchesSearch = !normalizedSearch
      || table.name.toLowerCase().includes(normalizedSearch)
      || table.category.toLowerCase().includes(normalizedSearch)

    return matchesStatus && matchesSearch
  })
  const availableBackups = report?.availableBackups ?? []
  const normalizedBackupSearch = backupSearchTerm.trim().toLowerCase()
  const filteredBackups = availableBackups.filter((backup) => {
    if (!normalizedBackupSearch) {
      return true
    }

    return backup.fileName.toLowerCase().includes(normalizedBackupSearch)
  })

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Database Manager</CardTitle>
            <CardDescription>Loading database maintenance report.</CardDescription>
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
              <Badge>Super admin tool</Badge>
              <div>
                <CardTitle className="text-3xl">Database Manager</CardTitle>
                <CardDescription className="mt-2 max-w-4xl text-sm leading-6">
                  Verify schema, run migrations, create backups, and restore when needed.
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => void handleVerify()} disabled={verifying || migrating || backingUp || restoring || resetting}>
                <RefreshCcw className="size-4" />
                {verifying ? 'Verifying...' : 'Verify schema'}
              </Button>
              <Button variant="outline" onClick={() => void handleMigrate()} disabled={verifying || migrating || backingUp || restoring || resetting}>
                <Sparkles className="size-4" />
                {migrating ? 'Updating...' : 'Update to latest version'}
              </Button>
              <Button onClick={() => void handleBackupAndDownload()} disabled={verifying || migrating || backingUp || restoring || resetting}>
                <HardDriveDownload className="size-4" />
                {backingUp ? 'Creating backup...' : 'Backup and download'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <AnimatedTabs
            defaultTabValue="overview"
            tabs={[
              {
                label: 'Overview',
                value: 'overview',
                content: (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <Card className="border-border/70">
                        <CardHeader>
                          <CardTitle className="text-base">Migration status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <Badge className={getStatusBadgeClassName(report?.verification.status ?? 'warning')}>
                            {report?.verification.status ?? 'unknown'}
                          </Badge>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Current</span>
                            <span className="font-medium text-foreground">{report?.database.currentVersionId ?? 'not-ready'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Latest</span>
                            <span className="font-medium text-foreground">{report?.database.latestVersionId ?? 'unknown'}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Pending</span>
                            <span className="font-medium text-foreground">{formatCount(report?.database.pendingMigrations)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/70">
                        <CardHeader>
                          <CardTitle className="text-base">Table coverage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Expected</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.expectedTableCount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Present</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.existingManagedTableCount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Missing</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.missingTableCount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Unexpected</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.unexpectedTableCount)}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/70">
                        <CardHeader>
                          <CardTitle className="text-base">Data footprint</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">All tables</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.existingTableCount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Total rows</span>
                            <span className="font-medium text-foreground">{formatCount(report?.verification.totalRowCount)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <span className="text-muted-foreground">Checked</span>
                            <span className="font-medium text-foreground">{report?.verification.checkedAt?.slice(0, 19).replace('T', ' ') ?? 'n/a'}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/70">
                        <CardHeader>
                          <CardTitle className="text-base">Latest backup</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="text-muted-foreground">
                            {report?.latestBackup ? report.latestBackup.fileName : 'No backup file generated yet.'}
                          </div>
                          {report?.latestBackup ? (
                            <>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Size</span>
                                <span className="font-medium text-foreground">{formatCount(report.latestBackup.byteSize)} bytes</span>
                              </div>
                              <Button variant="outline" className="w-full" onClick={() => void handleDownloadLatestBackup()}>
                                <Download className="size-4" />
                                Download latest backup
                              </Button>
                            </>
                          ) : null}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-border/70">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Database className="size-5" />
                          Verification detail
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>{report?.verification.detail ?? 'No verification detail available.'}</p>
                        <p>Use verify to refresh the live table inventory and row counts. Update to latest applies any pending migrations and seeders tracked in the runtime.</p>
                        <p>Restore rebuilds the database from a selected backup file and creates a fresh safety backup before replacing the current contents.</p>
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                label: 'Tables',
                value: 'tables',
                content: (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <div className="relative min-w-[18rem] flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="Search tables or categories"
                          className="pl-9"
                        />
                      </div>
                      <select
                        value={statusFilter}
                        onChange={(event) => setStatusFilter(event.target.value as 'all' | DatabaseManagerTable['status'])}
                        className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <option value="all">All statuses</option>
                        <option value="ok">OK</option>
                        <option value="missing">Missing</option>
                        <option value="unexpected">Unexpected</option>
                      </select>
                    </div>

                    <Card className="border-border/70">
                      <CardHeader>
                        <CardTitle className="text-lg">Table comparison</CardTitle>
                        <CardDescription>
                          Every expected codexsun table is compared with the live database. Unexpected tables are listed too so schema drift is visible before maintenance work.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Status</TableHead>
                              <TableHead>Table</TableHead>
                              <TableHead>Category</TableHead>
                              <TableHead>Expected</TableHead>
                              <TableHead>Columns</TableHead>
                              <TableHead>Rows</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredTables.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                                  No tables match the current filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredTables.map((table) => (
                                <TableRow key={table.name}>
                                  <TableCell>
                                    <Badge className={getStatusBadgeClassName(table.status)}>{table.status}</Badge>
                                  </TableCell>
                                  <TableCell className="font-medium text-foreground">{table.name}</TableCell>
                                  <TableCell className="capitalize text-muted-foreground">{table.category}</TableCell>
                                  <TableCell>{table.expected ? 'Yes' : 'No'}</TableCell>
                                  <TableCell>{formatCount(table.columnCount)}</TableCell>
                                  <TableCell>{formatCount(table.rowCount)}</TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
              {
                label: 'Recovery',
                value: 'recovery',
                content: (
                  <div className="space-y-4">
                    <Card className="border-amber-300/60 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <ShieldAlert className="size-5" />
                          Maintenance flow
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm text-muted-foreground">
                        <p>Verify refreshes the schema report.</p>
                        <p>Update runs pending migrations and seeders.</p>
                        <p>Backup saves and downloads a JSON snapshot.</p>
                        <p>Restore loads a backup and creates a safety backup first.</p>
                        <p>Hard reset rebuilds managed tables only.</p>
                      </CardContent>
                    </Card>

                    <Card className="border-border/70">
                      <CardHeader>
                        <CardTitle className="text-lg">Restore backup</CardTitle>
                        <CardDescription>
                          Upload a backup JSON file or choose one already saved on the server. The current database is snapshotted first as a safety rollback point.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-2">
                          <Label htmlFor="database-backup-upload">Upload backup file</Label>
                          <Input
                            id="database-backup-upload"
                            type="file"
                            accept=".json,application/json"
                            disabled={
                              verifying
                              || migrating
                              || backingUp
                              || uploadingBackup
                              || restoring
                              || resetting
                              || refreshingBackups
                              || deletingBackupFileName !== null
                            }
                            onChange={(event) => {
                              void handleUploadBackupFile(event)
                            }}
                          />
                          <p className="text-sm text-muted-foreground">
                            Uploaded files are saved in the server folder <span className="font-medium text-foreground">storage/backups/database</span>.
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="database-restore-file">Backup file</Label>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={restoreMode === 'incremental'}
                                  onCheckedChange={(checked) => setIncrementalRestoreMode(Boolean(checked))}
                                />
                                <span>Incremental restore</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <Checkbox
                                  checked={restoreMode === 'fresh'}
                                  onCheckedChange={(checked) => setFreshRestoreMode(Boolean(checked))}
                                />
                                <span>Fresh restore</span>
                              </label>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Input
                              id="database-restore-file"
                              value={restoreFileName}
                              onChange={(event) => setRestoreFileName(event.target.value)}
                              placeholder="Select or type a backup file"
                              disabled={
                                verifying
                                || migrating
                                || backingUp
                                || uploadingBackup
                                || restoring
                                || resetting
                                || refreshingBackups
                                || deletingBackupFileName !== null
                              }
                              className="flex-1"
                            />
                            <div className="flex items-center gap-2">
                              <Popover open={backupPickerOpen} onOpenChange={setBackupPickerOpen}>
                                <PopoverTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    disabled={
                                      verifying
                                      || migrating
                                      || backingUp
                                      || uploadingBackup
                                      || restoring
                                      || resetting
                                      || refreshingBackups
                                    }
                                  >
                                    Browse files
                                    <ChevronDown className="size-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent align="start" className="w-[min(32rem,calc(100vw-2rem))] p-0">
                                  <div className="border-b p-3">
                                    <Input
                                      value={backupSearchTerm}
                                      onChange={(event) => setBackupSearchTerm(event.target.value)}
                                      placeholder="Search backup files"
                                    />
                                  </div>
                                  <div className="max-h-80 overflow-y-auto p-2">
                                    {filteredBackups.length > 0 ? (
                                      <div className="space-y-2">
                                        {filteredBackups.map((backup) => {
                                          const deletingThisBackup = deletingBackupFileName === backup.fileName

                                          return (
                                            <div
                                              key={backup.fileName}
                                              className={`flex items-start gap-2 rounded-md border p-2 ${
                                                restoreFileName === backup.fileName ? 'border-primary bg-accent/40' : 'border-border/70'
                                              }`}
                                            >
                                              <button
                                                type="button"
                                                className="flex-1 text-left"
                                                onClick={() => {
                                                  setRestoreFileName(backup.fileName)
                                                  setBackupPickerOpen(false)
                                                }}
                                              >
                                                <div className="truncate text-sm font-medium text-foreground">{backup.fileName}</div>
                                                <div className="text-xs text-muted-foreground">
                                                  {formatBackupTimestamp(backup.createdAt)} • {formatBackupSize(backup.byteSize)}
                                                </div>
                                              </button>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon-sm"
                                                className="text-destructive hover:text-destructive"
                                                disabled={
                                                  deletingThisBackup
                                                  || deletingBackupFileName !== null
                                                  || verifying
                                                  || migrating
                                                  || backingUp
                                                  || uploadingBackup
                                                  || restoring
                                                  || resetting
                                                  || refreshingBackups
                                                }
                                                onClick={() => {
                                                  void handleDeleteBackup(backup.fileName)
                                                }}
                                              >
                                                <Trash2 className="size-4" />
                                              </Button>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    ) : (
                                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                        {availableBackups.length > 0 ? 'No backup files match this search.' : 'No backup files found in storage.'}
                                      </div>
                                    )}
                                  </div>
                                </PopoverContent>
                              </Popover>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => void handleRefreshBackupFiles()}
                                disabled={
                                  verifying
                                  || migrating
                                  || backingUp
                                  || uploadingBackup
                                  || restoring
                                  || resetting
                                  || refreshingBackups
                                  || deletingBackupFileName !== null
                                }
                              >
                                <RefreshCcw className="size-4" />
                                {refreshingBackups ? 'Reloading...' : 'Reload'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          onClick={() => void handleRestoreBackup()}
                          disabled={
                            !restoreFileName
                            || verifying
                            || migrating
                            || backingUp
                            || uploadingBackup
                            || restoring
                            || resetting
                            || refreshingBackups
                            || deletingBackupFileName !== null
                          }
                        >
                          <RotateCcw className="size-4" />
                          {restoring
                            ? restoreJob?.status === 'queued'
                              ? 'Restore queued...'
                              : 'Restoring backup...'
                            : 'Restore selected backup'}
                        </Button>
                        {restoreJob ? (
                          <div className="space-y-2">
                            <Progress value={restoreJob.progress} />
                            <div className="text-sm text-muted-foreground">
                              {restoreJob.step}
                            </div>
                          </div>
                        ) : null}
                        <div className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <FolderUp className="size-4" />
                          {uploadingBackup ? 'Uploading backup file...' : 'Choose a file above to upload it to server storage.'}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-destructive/40">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                          <AlertTriangle className="size-5" />
                          Danger zone
                        </CardTitle>
                        <CardDescription>
                          Use hard reset only when you intentionally need to rebuild the managed schema. Take a backup first.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                          Confirmation text required: <span className="font-medium text-foreground">{hardResetConfirmationText}</span>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setResetDialogOpen(true)}
                          disabled={verifying || migrating || backingUp || restoring || resetting}
                        >
                          <RotateCcw className="size-4" />
                          Hard reset managed schema
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-amber-300/60 bg-amber-50/40 dark:border-amber-700/60 dark:bg-amber-950/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <AlertTriangle className="size-5" />
                          Upload detail warning
                        </CardTitle>
                        <CardDescription>
                          If backup upload fails on the live server, capture the error response or the matching server log line so the root cause can be identified.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p className="text-muted-foreground">
                          Share the live server response or log line that appears during upload. The file write step depends on the server path <span className="font-medium text-foreground">storage/backups/database</span>.
                        </p>
                        <div className="rounded-lg border border-border/70 bg-background/80 p-3 text-muted-foreground">
                          {errorMessage ?? 'No upload error has been captured yet.'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ),
              },
            ] satisfies AnimatedContentTab[]}
          />
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

      <Dialog open={resetDialogOpen} onOpenChange={(open) => {
        setResetDialogOpen(open)
        if (!open) {
          setResetConfirmation('')
        }
      }}>
        <DialogContent className="border-destructive/40">
          <DialogHeader>
            <DialogTitle>Confirm hard reset</DialogTitle>
            <DialogDescription>
              This drops the managed codexsun tables and rebuilds them from the latest migrations and seeders. Unexpected tables stay as they are. Type the confirmation text exactly to continue.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-muted-foreground">
              Required confirmation: <span className="font-medium text-foreground">{hardResetConfirmationText}</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="database-hard-reset-confirmation">Confirmation</Label>
              <Input
                id="database-hard-reset-confirmation"
                value={resetConfirmation}
                onChange={(event) => setResetConfirmation(event.target.value)}
                placeholder={hardResetConfirmationText}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setResetDialogOpen(false)} disabled={resetting}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleHardReset()}
              disabled={resetting || resetConfirmation !== hardResetConfirmationText}
            >
              {resetting ? 'Resetting...' : 'Confirm hard reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
