import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { Database, FolderOpen, Save, Server } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import {
  usePrerequisites,
  usePrerequisiteSettings,
  useSavePrerequisiteSettings,
} from './orchestration.hooks'
import type { PrerequisiteSettingsUpdate } from './orchestration.types'

const emptySettings: PrerequisiteSettingsUpdate = {
  fileBrowserAdminUser: 'admin',
  mariadbPort: 3307,
  redisPort: 6379,
  storagePort: 7090,
}

export function PrerequisitesWorkspace() {
  const prerequisites = usePrerequisites()
  const settings = usePrerequisiteSettings()
  const save = useSavePrerequisiteSettings()
  const [form, setForm] = useState<PrerequisiteSettingsUpdate>(emptySettings)
  const [message, setMessage] = useState<string>()

  useEffect(() => {
    if (!settings.data) return
    setForm({
      fileBrowserAdminUser: settings.data.fileBrowserAdminUser,
      mariadbPort: settings.data.mariadbPort,
      redisPort: settings.data.redisPort,
      storagePort: settings.data.storagePort,
    })
  }, [settings.data])

  const submit = async () => {
    setMessage(undefined)
    try {
      await save.mutateAsync(form)
      setForm((current) => ({
        ...current,
        fileBrowserAdminPassword: undefined,
        mariadbRootPassword: undefined,
        redisPassword: undefined,
      }))
      setMessage('Prerequisite settings saved.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save prerequisite settings.')
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 pb-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Prerequisites</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shared local services required before an application install.
          </p>
        </div>
        <Button disabled={save.isPending} onClick={() => void submit()}>
          <Save />
          Save settings
        </Button>
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
          <CardTitle className="flex items-center gap-2">
            <Database className="size-4" />
            MariaDB
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Host port">
            <Input
              min={1}
              onChange={(event) => setForm({ ...form, mariadbPort: Number(event.target.value) })}
              type="number"
              value={form.mariadbPort}
            />
          </Field>
          <Field label="Root password">
            <Input
              autoComplete="new-password"
              onChange={(event) => setForm({ ...form, mariadbRootPassword: event.target.value })}
              type="password"
              value={form.mariadbRootPassword ?? ''}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="size-4" />
            Redis
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Host port">
            <Input
              min={1}
              onChange={(event) => setForm({ ...form, redisPort: Number(event.target.value) })}
              type="number"
              value={form.redisPort}
            />
          </Field>
          <Field label="Password">
            <Input
              autoComplete="new-password"
              onChange={(event) => setForm({ ...form, redisPassword: event.target.value })}
              type="password"
              value={form.redisPassword ?? ''}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="size-4" />
            File Browser
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <Field label="Host port">
            <Input
              min={1}
              onChange={(event) => setForm({ ...form, storagePort: Number(event.target.value) })}
              type="number"
              value={form.storagePort}
            />
          </Field>
          <Field label="Administrator">
            <Input
              onChange={(event) => setForm({ ...form, fileBrowserAdminUser: event.target.value })}
              value={form.fileBrowserAdminUser}
            />
          </Field>
          <Field label="Password">
            <Input
              autoComplete="new-password"
              onChange={(event) =>
                setForm({ ...form, fileBrowserAdminPassword: event.target.value })
              }
              type="password"
              value={form.fileBrowserAdminPassword ?? ''}
            />
          </Field>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </main>
  )
}

function StatusBadge({ state }: { state: 'healthy' | 'starting' | 'unavailable' }) {
  const variant = state === 'healthy' ? 'default' : state === 'starting' ? 'secondary' : 'outline'
  return <Badge variant={variant}>{state}</Badge>
}

function ServiceIcon({ service }: { service: 'mariadb' | 'redis' | 'filebrowser' }) {
  if (service === 'filebrowser') return <FolderOpen className="size-4" />
  if (service === 'redis') return <Server className="size-4" />
  return <Database className="size-4" />
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
