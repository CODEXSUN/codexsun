import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { Textarea } from '@codexsun/ui/components/textarea'
import { Database, FileCode2, FolderOpen, Network, RotateCcw, Save, Server, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  usePrerequisites,
  usePrerequisiteSettings,
  usePrerequisiteSource,
  useSavePrerequisiteSettings,
  useSavePrerequisiteSource,
  useBuildPrerequisites,
} from './orchestration.hooks'
import type { PrerequisiteSettingsUpdate, PrerequisiteSourceFile } from './orchestration.types'

const emptySettings: PrerequisiteSettingsUpdate = {
  fileBrowserAdminUser: 'admin',
  fileBrowserImage: 'filebrowser/filebrowser',
  fileBrowserTag: 'v2.32.0',
  mariadbImage: 'mariadb',
  mariadbPort: 3307,
  mariadbTag: '11.8',
  mariadbUser: 'orship',
  networkName: 'codexsun-prerequisites',
  redisImage: 'redis',
  redisPort: 6379,
  redisTag: '8.2-alpine',
  redisUser: 'orship',
  storagePort: 7090,
}

const sourceFiles: Array<{ file: PrerequisiteSourceFile; label: string }> = [
  { file: 'compose', label: 'compose.yaml' },
  { file: 'dockerfile', label: 'Dockerfile' },
  { file: 'filebrowser-init', label: 'filebrowser-init.sh' },
]

type ServiceKey = 'mariadb' | 'redis' | 'filebrowser'

const serviceConfig: Record<ServiceKey, {
  icon: ReactNode
  title: string
  fields: Array<{ key: keyof PrerequisiteSettingsUpdate; label: string; type: 'text' | 'number' | 'password' }>
  passwordKeys: (keyof PrerequisiteSettingsUpdate)[]
}> = {
  mariadb: {
    icon: <Database className="size-4" />,
    title: 'MariaDB',
    fields: [
      { key: 'mariadbImage', label: 'Image', type: 'text' },
      { key: 'mariadbTag', label: 'Version', type: 'text' },
      { key: 'mariadbPort', label: 'Host port', type: 'number' },
      { key: 'mariadbUser', label: 'Application user', type: 'text' },
    ],
    passwordKeys: ['mariadbUserPassword', 'mariadbRootPassword'],
  },
  redis: {
    icon: <Server className="size-4" />,
    title: 'Redis',
    fields: [
      { key: 'redisImage', label: 'Image', type: 'text' },
      { key: 'redisTag', label: 'Version', type: 'text' },
      { key: 'redisPort', label: 'Host port', type: 'number' },
      { key: 'redisUser', label: 'ACL user', type: 'text' },
    ],
    passwordKeys: ['redisPassword'],
  },
  filebrowser: {
    icon: <FolderOpen className="size-4" />,
    title: 'File Browser',
    fields: [
      { key: 'fileBrowserImage', label: 'Image', type: 'text' },
      { key: 'fileBrowserTag', label: 'Version', type: 'text' },
      { key: 'storagePort', label: 'Host port', type: 'number' },
      { key: 'fileBrowserAdminUser', label: 'Administrator', type: 'text' },
    ],
    passwordKeys: ['fileBrowserAdminPassword'],
  },
}

export function PrerequisitesWorkspace() {
  const prerequisites = usePrerequisites()
  const settings = usePrerequisiteSettings()
  const saveSettings = useSavePrerequisiteSettings()
  const buildPrerequisites = useBuildPrerequisites()
  const [form, setForm] = useState<PrerequisiteSettingsUpdate>(emptySettings)
  const [message, setMessage] = useState<string>()
  const [sourceFile, setSourceFile] = useState<PrerequisiteSourceFile>('compose')
  const source = usePrerequisiteSource(sourceFile)
  const saveSource = useSavePrerequisiteSource()
  const [sourceContent, setSourceContent] = useState('')
  const [serviceStatus, setServiceStatus] = useState<Record<ServiceKey, 'idle' | 'saving' | 'building' | 'success' | 'error'>>({
    mariadb: 'idle',
    redis: 'idle',
    filebrowser: 'idle',
  })

  useEffect(() => {
    if (!settings.data) return
    setForm({
      fileBrowserAdminUser: settings.data.fileBrowserAdminUser,
      fileBrowserImage: settings.data.fileBrowserImage,
      fileBrowserTag: settings.data.fileBrowserTag,
      mariadbImage: settings.data.mariadbImage,
      mariadbPort: settings.data.mariadbPort,
      mariadbTag: settings.data.mariadbTag,
      mariadbUser: settings.data.mariadbUser,
      networkName: settings.data.networkName,
      redisImage: settings.data.redisImage,
      redisPort: settings.data.redisPort,
      redisTag: settings.data.redisTag,
      redisUser: settings.data.redisUser,
      storagePort: settings.data.storagePort,
    })
  }, [settings.data])

  useEffect(() => setSourceContent(source.data?.content ?? ''), [source.data])

  const getServiceFields = (service: ServiceKey) => {
    const config = serviceConfig[service]
    return config.fields.map(f => ({ ...f, value: form[f.key] }))
  }

  const getServicePasswords = (service: ServiceKey) => {
    return serviceConfig[service].passwordKeys.map(key => ({ key, value: form[key] }))
  }

  const saveServiceSettings = async (service: ServiceKey) => {
    setServiceStatus({ ...serviceStatus, [service]: 'saving' })
    try {
      await saveSettings.mutateAsync(form)
      setForm(clearSecrets)
      setServiceStatus({ ...serviceStatus, [service]: 'success' })
      setMessage(`${serviceConfig[service].title} settings saved.`)
      setTimeout(() => setServiceStatus({ ...serviceStatus, [service]: 'idle' }), 3000)
    } catch (error) {
      setServiceStatus({ ...serviceStatus, [service]: 'error' })
      setMessage(error instanceof Error ? error.message : `Could not save ${service} settings.`)
      setTimeout(() => setServiceStatus({ ...serviceStatus, [service]: 'idle' }), 3000)
    }
  }

  const applyService = async (service: ServiceKey, forceRebuild: boolean) => {
    setServiceStatus({ ...serviceStatus, [service]: 'building' })
    try {
      const result = await buildPrerequisites.mutateAsync(forceRebuild)
      if (result.success) {
        setServiceStatus({ ...serviceStatus, [service]: 'success' })
        setMessage(`${serviceConfig[service].title} applied successfully.`)
      } else {
        setServiceStatus({ ...serviceStatus, [service]: 'error' })
        setMessage(`Apply failed: ${result.message}${result.output ? `\n${result.output}` : ''}`)
      }
      setTimeout(() => setServiceStatus({ ...serviceStatus, [service]: 'idle' }), 3000)
    } catch (error) {
      setServiceStatus({ ...serviceStatus, [service]: 'error' })
      setMessage(error instanceof Error ? error.message : `Could not apply ${service}.`)
      setTimeout(() => setServiceStatus({ ...serviceStatus, [service]: 'idle' }), 3000)
    }
  }

  const saveStackSource = async () => {
    setMessage(undefined)
    try {
      await saveSource.mutateAsync({ content: sourceContent, file: sourceFile })
      setMessage('Stack source saved. Validate and apply it with the verified prerequisite command.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save stack source.')
    }
  }

  const getPrerequisiteService = (service: ServiceKey) => {
    return prerequisites.data?.services?.find(s => s.id === service)
  }

  const getStatusIcon = (service: ServiceKey) => {
    const status = serviceStatus[service]
    const svc = getPrerequisiteService(service)
    const healthState = svc?.state ?? 'unavailable'

    if (status === 'saving' || status === 'building') return <Loader2 className="size-4 animate-spin" />
    if (status === 'success') return <CheckCircle2 className="size-4 text-green-500" />
    if (status === 'error') return <AlertCircle className="size-4 text-red-500" />
    if (healthState === 'healthy') return <CheckCircle2 className="size-4 text-green-500" />
    if (healthState === 'starting') return <Loader2 className="size-4 animate-spin text-yellow-500" />
    return <AlertCircle className="size-4 text-red-500" />
  }

  const getStatusText = (service: ServiceKey) => {
    const status = serviceStatus[service]
    const svc = getPrerequisiteService(service)
    const healthState = svc?.state ?? 'unavailable'

    if (status === 'saving') return 'Saving...'
    if (status === 'building') return 'Applying...'
    if (status === 'success') return 'Saved'
    if (status === 'error') return 'Error'
    if (healthState === 'healthy') return 'Healthy'
    if (healthState === 'starting') return 'Starting'
    return 'Unavailable'
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-12 overflow-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted/30 hover:scrollbar-thumb-muted/50 max-h-[calc(100vh-2rem)]">
      <header className="flex flex-wrap items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-semibold">Prerequisites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shared services for installed client applications.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => window.open('http://127.0.0.1:7090', '_blank')}>
            <FolderOpen className="mr-2 h-4 w-4" />Open File Browser
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {(prerequisites.data?.services ?? []).map((service) => (
          <Card key={service.id} size="sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2">
                  <ServiceIcon service={service.id} />
                  {service.name}
                </span>
                <StatusBadge state={service.state} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{service.status}</CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Network className="size-4" />Shared network</CardTitle>
        </CardHeader>
        <CardContent>
          <Field label="Docker network name">
            <Input onChange={(event) => setForm({ ...form, networkName: event.target.value })} value={form.networkName} />
          </Field>
        </CardContent>
      </Card>

      {(['mariadb', 'redis', 'filebrowser'] as ServiceKey[]).map((service) => {
        const config = serviceConfig[service]
        const svc = getPrerequisiteService(service)
        const healthState = svc?.state ?? 'unavailable'
        const statusIcon = getStatusIcon(service)
        const statusText = getStatusText(service)

        return (
          <Card key={service} className="relative">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">{config.icon}{config.title}</span>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1.5 text-xs">
                    {statusIcon}
                    <span>{statusText}</span>
                  </span>
                  <Badge variant={healthState === 'healthy' ? 'default' : healthState === 'starting' ? 'secondary' : 'outline'}>
                    {healthState}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {getServiceFields(service).map(({ key, label, type, value }) => (
                <Field key={key} label={label}>
                  {type === 'number' ? (
                    <Input
                      min={1}
                      type="number"
                      value={value}
                      onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })}
                    />
                  ) : (
                    <Input
                      value={value}
                      onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                    />
                  )}
                </Field>
              ))}
              {getServicePasswords(service).map(({ key, value }) => (
                <Field key={key} label={key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}>
                  <Input
                    autoComplete="new-password"
                    type="password"
                    value={value ?? ''}
                    onChange={(event) => setForm({ ...form, [key]: event.target.value })}
                  />
                </Field>
              ))}
              <div className="flex flex-wrap items-center gap-2 lg:col-span-3 pt-2 border-t">
                <Button
                  size="sm"
                  disabled={saveSettings.isPending || serviceStatus[service] === 'saving' || serviceStatus[service] === 'building'}
                  onClick={() => void saveServiceSettings(service)}
                  variant={serviceStatus[service] === 'success' ? 'default' : 'outline'}
                >
                  <Save className="mr-1.5 h-3.5 w-3.5" />Save
                </Button>
                <Button
                  size="sm"
                  disabled={buildPrerequisites.isPending || serviceStatus[service] === 'saving' || serviceStatus[service] === 'building'}
                  onClick={() => void applyService(service, false)}
                  variant={serviceStatus[service] === 'success' ? 'default' : 'default'}
                >
                  <Play className="mr-1.5 h-3.5 w-3.5" />Apply
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={buildPrerequisites.isPending || serviceStatus[service] === 'saving' || serviceStatus[service] === 'building'}
                  onClick={() => void applyService(service, true)}
                >
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />Force
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileCode2 className="size-4" />Stack source</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {sourceFiles.map((item) => (
              <Button
                key={item.file}
                onClick={() => setSourceFile(item.file)}
                size="sm"
                variant={sourceFile === item.file ? 'default' : 'outline'}
              >
                {item.label}
              </Button>
            ))}
          </div>
          <Textarea className="min-h-80 font-mono text-xs" onChange={(event) => setSourceContent(event.target.value)} value={sourceContent} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Only prerequisite source files are editable here.</p>
            <Button disabled={saveSource.isPending || source.isLoading} onClick={() => void saveStackSource()} variant="outline">
              <Save />Save source
            </Button>
          </div>
        </CardContent>
      </Card>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </main>
  )
}

function clearSecrets(current: PrerequisiteSettingsUpdate): PrerequisiteSettingsUpdate {
  const { fileBrowserAdminPassword: _a, mariadbRootPassword: _b, mariadbUserPassword: _c, redisPassword: _d, ...settings } = current
  return settings
}

function StatusBadge({ state }: { state: 'healthy' | 'starting' | 'unavailable' }) {
  return <Badge variant={state === 'healthy' ? 'default' : state === 'starting' ? 'secondary' : 'outline'}>{state}</Badge>
}

function ServiceIcon({ service }: { service: 'mariadb' | 'redis' | 'filebrowser' }) {
  return service === 'filebrowser' ? <FolderOpen className="size-4" /> : service === 'redis' ? <Server className="size-4" /> : <Database className="size-4" />
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>
}