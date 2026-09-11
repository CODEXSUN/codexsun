import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { Textarea } from '@codexsun/ui/components/textarea'
import { Database, FileCode2, FolderOpen, Network, Save, Server } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  usePrerequisites,
  usePrerequisiteSettings,
  usePrerequisiteSource,
  useSavePrerequisiteSettings,
  useSavePrerequisiteSource,
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

export function PrerequisitesWorkspace() {
  const prerequisites = usePrerequisites()
  const settings = usePrerequisiteSettings()
  const saveSettings = useSavePrerequisiteSettings()
  const [form, setForm] = useState<PrerequisiteSettingsUpdate>(emptySettings)
  const [message, setMessage] = useState<string>()
  const [sourceFile, setSourceFile] = useState<PrerequisiteSourceFile>('compose')
  const source = usePrerequisiteSource(sourceFile)
  const saveSource = useSavePrerequisiteSource()
  const [sourceContent, setSourceContent] = useState('')

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

  const submit = async () => {
    setMessage(undefined)
    try {
      await saveSettings.mutateAsync(form)
      setForm(clearSecrets)
      setMessage('Settings saved. Run the verified prerequisite command to apply them.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save settings.')
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-12">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Prerequisites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Shared services for installed client applications.</p>
        </div>
        <Button disabled={saveSettings.isPending} onClick={() => void submit()}><Save />Save settings</Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {(prerequisites.data?.services ?? []).map((service) => (
          <Card key={service.id} size="sm"><CardHeader><CardTitle className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><ServiceIcon service={service.id} />{service.name}</span><StatusBadge state={service.state} /></CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{service.status}</CardContent></Card>
        ))}
      </section>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Network className="size-4" />Shared network</CardTitle></CardHeader><CardContent><Field label="Docker network name"><Input onChange={(event) => setForm({ ...form, networkName: event.target.value })} value={form.networkName} /></Field></CardContent></Card>

      <ServiceSettings title="MariaDB" icon={<Database className="size-4" />}>
        <Field label="Image"><Input onChange={(event) => setForm({ ...form, mariadbImage: event.target.value })} value={form.mariadbImage} /></Field>
        <Field label="Version"><Input onChange={(event) => setForm({ ...form, mariadbTag: event.target.value })} value={form.mariadbTag} /></Field>
        <Field label="Host port"><NumberInput value={form.mariadbPort} onChange={(mariadbPort) => setForm({ ...form, mariadbPort })} /></Field>
        <Field label="Application user"><Input onChange={(event) => setForm({ ...form, mariadbUser: event.target.value })} value={form.mariadbUser} /></Field>
        <PasswordField label="Application password" value={form.mariadbUserPassword} onChange={(mariadbUserPassword) => setForm({ ...form, mariadbUserPassword })} />
        <PasswordField label="Root password" value={form.mariadbRootPassword} onChange={(mariadbRootPassword) => setForm({ ...form, mariadbRootPassword })} />
      </ServiceSettings>

      <ServiceSettings title="Redis" icon={<Server className="size-4" />}>
        <Field label="Image"><Input onChange={(event) => setForm({ ...form, redisImage: event.target.value })} value={form.redisImage} /></Field>
        <Field label="Version"><Input onChange={(event) => setForm({ ...form, redisTag: event.target.value })} value={form.redisTag} /></Field>
        <Field label="Host port"><NumberInput value={form.redisPort} onChange={(redisPort) => setForm({ ...form, redisPort })} /></Field>
        <Field label="ACL user"><Input onChange={(event) => setForm({ ...form, redisUser: event.target.value })} value={form.redisUser} /></Field>
        <PasswordField label="Password" value={form.redisPassword} onChange={(redisPassword) => setForm({ ...form, redisPassword })} />
      </ServiceSettings>

      <ServiceSettings title="File Browser" icon={<FolderOpen className="size-4" />}>
        <Field label="Image"><Input onChange={(event) => setForm({ ...form, fileBrowserImage: event.target.value })} value={form.fileBrowserImage} /></Field>
        <Field label="Version"><Input onChange={(event) => setForm({ ...form, fileBrowserTag: event.target.value })} value={form.fileBrowserTag} /></Field>
        <Field label="Host port"><NumberInput value={form.storagePort} onChange={(storagePort) => setForm({ ...form, storagePort })} /></Field>
        <Field label="Administrator"><Input onChange={(event) => setForm({ ...form, fileBrowserAdminUser: event.target.value })} value={form.fileBrowserAdminUser} /></Field>
        <PasswordField label="Password" value={form.fileBrowserAdminPassword} onChange={(fileBrowserAdminPassword) => setForm({ ...form, fileBrowserAdminPassword })} />
      </ServiceSettings>

      <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileCode2 className="size-4" />Stack source</CardTitle></CardHeader><CardContent className="grid gap-4"><div className="flex flex-wrap gap-2">{sourceFiles.map((item) => <Button key={item.file} onClick={() => setSourceFile(item.file)} size="sm" variant={sourceFile === item.file ? 'default' : 'outline'}>{item.label}</Button>)}</div><Textarea className="min-h-80 font-mono text-xs" onChange={(event) => setSourceContent(event.target.value)} value={sourceContent} /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Only prerequisite source files are editable here.</p><Button disabled={saveSource.isPending || source.isLoading} onClick={() => void saveStackSource()} variant="outline"><Save />Save source</Button></div></CardContent></Card>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </main>
  )
}

function clearSecrets(current: PrerequisiteSettingsUpdate): PrerequisiteSettingsUpdate { const { fileBrowserAdminPassword: _a, mariadbRootPassword: _b, mariadbUserPassword: _c, redisPassword: _d, ...settings } = current; return settings }
function StatusBadge({ state }: { state: 'healthy' | 'starting' | 'unavailable' }) { return <Badge variant={state === 'healthy' ? 'default' : state === 'starting' ? 'secondary' : 'outline'}>{state}</Badge> }
function ServiceIcon({ service }: { service: 'mariadb' | 'redis' | 'filebrowser' }) { return service === 'filebrowser' ? <FolderOpen className="size-4" /> : service === 'redis' ? <Server className="size-4" /> : <Database className="size-4" /> }
function ServiceSettings({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) { return <Card><CardHeader><CardTitle className="flex items-center gap-2">{icon}{title}</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</CardContent></Card> }
function Field({ children, label }: { children: ReactNode; label: string }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div> }
function NumberInput({ onChange, value }: { onChange: (value: number) => void; value: number }) { return <Input min={1} onChange={(event) => onChange(Number(event.target.value))} type="number" value={value} /> }
function PasswordField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string | undefined }) { return <Field label={label}><Input autoComplete="new-password" onChange={(event) => onChange(event.target.value)} type="password" value={value ?? ''} /></Field> }
