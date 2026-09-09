import { useEffect, useState, type FormEvent } from 'react'
import { Rocket, Save } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { Switch } from '@codexsun/ui/components/switch'
import { useGitDelivery } from './git-delivery.controller'
import type {
  DatabaseUpdateChoice,
  DeliverySyncStrategy,
  GitDeliverySettings,
  ProjectGitDeliverySettings,
} from './git-delivery.types'

export function GlobalGitDeliverySettings() {
  const delivery = useGitDelivery()
  const [form, setForm] = useState(delivery.global)
  useEffect(() => setForm(delivery.global), [delivery.global])
  if (!form) return <p className="text-sm text-muted-foreground">Loading Git delivery…</p>
  return (
    <section className="flex flex-col gap-7">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
          <Rocket className="size-4" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Git delivery</h1>
          <p className="pt-1 text-sm text-muted-foreground">
            Defaults for changelog, version, pull, commit, and push system tasks.
          </p>
        </div>
      </header>
      <GitDeliverySettingsForm
        onChange={setForm}
        onSave={() => delivery.saveGlobal(form)}
        value={form}
      />
      {delivery.error ? <p className="text-sm text-destructive">{delivery.error}</p> : null}
    </section>
  )
}

export function ProjectGitDeliverySettings() {
  const delivery = useGitDelivery()
  const [form, setForm] = useState(delivery.project)
  useEffect(() => setForm(delivery.project), [delivery.project])
  if (!form) return <p className="pt-3 text-sm text-muted-foreground">Loading Git delivery…</p>
  return (
    <section className="grid gap-4 border-t pt-5">
      <div>
        <h2 className="font-medium">Git delivery flow</h2>
        <p className="text-sm text-muted-foreground">Control release defaults for this project.</p>
      </div>
      <SettingRow description="Use the global Git delivery defaults." label="Use global settings">
        <Switch
          aria-label="Use global Git delivery settings"
          checked={form.inheritGlobal}
          onCheckedChange={(inheritGlobal) =>
            setForm(
              inheritGlobal
                ? { ...form, inheritGlobal }
                : { ...(delivery.effective ?? form), inheritGlobal },
            )
          }
        />
      </SettingRow>
      <GitDeliverySettingsForm<ProjectGitDeliverySettings>
        disabled={form.inheritGlobal}
        onChange={setForm}
        onSave={() => delivery.saveProject(form)}
        value={form}
      />
    </section>
  )
}

function GitDeliverySettingsForm<T extends GitDeliverySettings>({
  disabled = false,
  onChange,
  onSave,
  value,
}: {
  disabled?: boolean
  onChange(value: T): void
  onSave(): Promise<void>
  value: T
}) {
  function submit(event: FormEvent) {
    event.preventDefault()
    void onSave().catch(() => undefined)
  }
  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="overflow-hidden rounded-xl border">
        <SettingRow
          description="Show the flow builder in repository tools."
          label="Git delivery flow"
        >
          <Switch
            disabled={disabled}
            checked={value.enabled}
            onCheckedChange={(enabled) => onChange({ ...value, enabled } as T)}
          />
        </SettingRow>
        <SettingRow description="Add a detailed release note by default." label="Changelog">
          <Switch
            disabled={disabled}
            checked={value.defaultChangelog}
            onCheckedChange={(defaultChangelog) => onChange({ ...value, defaultChangelog } as T)}
          />
        </SettingRow>
        <SettingRow
          description="Use the repository version command by default."
          label="Version update"
        >
          <Switch
            disabled={disabled}
            checked={value.defaultVersionBump}
            onCheckedChange={(defaultVersionBump) =>
              onChange({ ...value, defaultVersionBump } as T)
            }
          />
        </SettingRow>
        <SettingRow
          description="How Zetro updates the current branch before commit."
          label="Pull strategy"
        >
          <Select
            disabled={disabled}
            items={[
              { label: 'Rebase', value: 'rebase' },
              { label: 'Merge', value: 'merge' },
              { label: 'No pull', value: 'none' },
            ]}
            onValueChange={(defaultSyncStrategy) =>
              defaultSyncStrategy &&
              onChange({
                ...value,
                defaultSyncStrategy: defaultSyncStrategy as DeliverySyncStrategy,
              } as T)
            }
            value={value.defaultSyncStrategy}
          >
            <SelectTrigger className="w-32" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="rebase">Rebase</SelectItem>
              <SelectItem value="merge">Merge</SelectItem>
              <SelectItem value="none">No pull</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          description="Record whether the release changes database state."
          label="Database update"
        >
          <Select
            disabled={disabled}
            items={[
              { label: 'Auto', value: 'auto' },
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ]}
            onValueChange={(defaultDatabaseUpdate) =>
              defaultDatabaseUpdate &&
              onChange({
                ...value,
                defaultDatabaseUpdate: defaultDatabaseUpdate as DatabaseUpdateChoice,
              } as T)
            }
            value={value.defaultDatabaseUpdate}
          >
            <SelectTrigger className="w-32" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="auto">Auto</SelectItem>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow description="Push after the reviewed commit by default." label="Push">
          <Switch
            disabled={disabled}
            checked={value.defaultPush}
            onCheckedChange={(defaultPush) => onChange({ ...value, defaultPush } as T)}
          />
        </SettingRow>
      </div>
      <Button className="w-fit cursor-pointer" type="submit">
        <Save /> Save Git delivery settings
      </Button>
    </form>
  )
}

function SettingRow({
  children,
  description,
  label,
}: {
  children: React.ReactNode
  description: string
  label: string
}) {
  return (
    <div className="flex min-h-16 items-center gap-6 border-b px-4 py-3 last:border-b-0">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-sm text-muted-foreground">{description}</span>
      </span>
      <span className="shrink-0">{children}</span>
    </div>
  )
}
