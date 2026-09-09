import { useEffect, useState, type FormEvent } from 'react'
import { GitBranch, Save } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@codexsun/ui/components/select'
import { Switch } from '@codexsun/ui/components/switch'
import { Textarea } from '@codexsun/ui/components/textarea'
import { useDeveloperTools } from './developer-tools.controller'
import type { EditorOption, ProjectToolSettings, ToolSettings } from './developer-tools.types'

const refreshOptions = [5, 15, 30, 60] as const

export function GlobalDeveloperToolSettings() {
  const tools = useDeveloperTools()
  const [form, setForm] = useState(tools.global)
  useEffect(() => setForm(tools.global), [tools.global])
  if (!form) return <p className="text-sm text-muted-foreground">Loading developer tools…</p>
  return (
    <section className="flex flex-col gap-7">
      <header className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted">
          <GitBranch className="size-4" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Developer tools</h1>
          <p className="pt-1 text-sm text-muted-foreground">
            Global Git, monitoring, and external tool defaults.
          </p>
        </div>
      </header>
      <ToolSettingsForm
        editors={tools.editors}
        onChange={setForm}
        onSave={() => tools.saveGlobal(form)}
        value={form}
      />
      {tools.error ? <p className="text-sm text-destructive">{tools.error}</p> : null}
    </section>
  )
}

export function ProjectDeveloperToolSettings() {
  const tools = useDeveloperTools()
  const [form, setForm] = useState(tools.project)
  useEffect(() => setForm(tools.project), [tools.project])
  if (!form)
    return <p className="pt-3 text-sm text-muted-foreground">Loading project tool settings…</p>
  return (
    <div className="pt-2">
      <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border p-3">
        <div>
          <div className="text-sm font-medium">Use global settings</div>
          <div className="text-xs text-muted-foreground">
            Keep this project synchronized with Zetro defaults.
          </div>
        </div>
        <Switch
          aria-label="Use global developer tool settings"
          checked={form.inheritGlobal}
          onCheckedChange={(inheritGlobal) =>
            setForm(
              inheritGlobal
                ? { ...form, inheritGlobal }
                : { ...(tools.effective ?? form), inheritGlobal },
            )
          }
        />
      </div>
      <ToolSettingsForm<ProjectToolSettings>
        disabled={form.inheritGlobal}
        editors={tools.editors}
        onChange={setForm}
        onSave={() => tools.saveProject(form)}
        value={form}
      />
      {tools.error ? <p className="pt-3 text-sm text-destructive">{tools.error}</p> : null}
    </div>
  )
}

function ToolSettingsForm<T extends ToolSettings>({
  disabled = false,
  editors,
  onChange,
  onSave,
  value,
}: {
  disabled?: boolean
  editors: EditorOption[]
  onChange(value: T): void
  onSave(): Promise<void>
  value: T
}) {
  const editorItems = [
    { label: 'Auto detect', value: 'auto' },
    ...editors.map((editor) => ({ label: editor.label, value: editor.id })),
  ]
  const monitoringItems = refreshOptions.map((seconds) => ({
    label: `${seconds} seconds`,
    value: String(seconds),
  }))
  function submit(event: FormEvent) {
    event.preventDefault()
    void onSave().catch(() => undefined)
  }
  return (
    <form className="grid gap-5" onSubmit={submit}>
      <div className="overflow-hidden rounded-xl border">
        <SettingRow
          description="Preferred application for opening the repository."
          label="External editor"
        >
          <Select
            disabled={disabled}
            items={editorItems}
            onValueChange={(editor) => editor && onChange({ ...value, editor } as T)}
            value={value.editor}
          >
            <SelectTrigger className="w-48" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="auto">Auto detect</SelectItem>
              {editors.map((editor) => (
                <SelectItem disabled={!editor.available} key={editor.id} value={editor.id}>
                  {editor.label}
                  {editor.available ? '' : ' · not found'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow
          description="Refresh Git metrics only while Zetro is visible."
          label="Monitoring interval"
        >
          <Select
            disabled={disabled}
            items={monitoringItems}
            onValueChange={(seconds) =>
              seconds &&
              onChange({
                ...value,
                autoRefreshSeconds: Number(seconds) as ToolSettings['autoRefreshSeconds'],
              } as T)
            }
            value={String(value.autoRefreshSeconds)}
          >
            <SelectTrigger className="w-32" size="sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              {refreshOptions.map((seconds) => (
                <SelectItem key={seconds} value={String(seconds)}>
                  {seconds} seconds
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow description="Default branch used by the compare dialog." label="Compare branch">
          <Input
            className="w-48"
            disabled={disabled}
            maxLength={255}
            onChange={(event) => onChange({ ...value, compareBranch: event.target.value } as T)}
            value={value.compareBranch}
          />
        </SettingRow>
        <SettingRow
          description="Prefix used when Zetro suggests a new branch."
          label="Branch prefix"
        >
          <Input
            className="w-48"
            disabled={disabled}
            maxLength={48}
            onChange={(event) => onChange({ ...value, branchPrefix: event.target.value } as T)}
            value={value.branchPrefix}
          />
        </SettingRow>
        <SettingRow description="Allow an explicit push after review." label="Push">
          <Switch
            aria-label="Allow push"
            checked={value.allowPush}
            disabled={disabled}
            onCheckedChange={(allowPush) => onChange({ ...value, allowPush } as T)}
          />
        </SettingRow>
        <SettingRow
          description="Allow Zetro to create pull requests through GitHub CLI."
          label="Pull requests"
        >
          <Switch
            aria-label="Allow pull requests"
            checked={value.allowPullRequests}
            disabled={disabled}
            onCheckedChange={(allowPullRequests) => onChange({ ...value, allowPullRequests } as T)}
          />
        </SettingRow>
        <SettingRow
          description="Required before Zetro can run repository scripts."
          label="Trusted repository"
        >
          <Switch
            aria-label="Trust repository"
            checked={value.trustedRepository}
            disabled={disabled}
            onCheckedChange={(trustedRepository) => onChange({ ...value, trustedRepository } as T)}
          />
        </SettingRow>
        <SettingRow
          description="Notify when a system task completes or needs attention."
          label="Desktop notifications"
        >
          <Switch
            aria-label="Desktop notifications"
            checked={value.desktopNotifications}
            disabled={disabled}
            onCheckedChange={(desktopNotifications) => {
              if (desktopNotifications && 'Notification' in window) {
                void Notification.requestPermission()
              }
              onChange({ ...value, desktopNotifications } as T)
            }}
          />
        </SettingRow>
        <SettingRow
          description="Comma-separated branch names that reject direct pushes."
          label="Protected branches"
        >
          <Input
            className="w-48"
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...value,
                protectedBranches: event.target.value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean),
              } as T)
            }
            value={value.protectedBranches.join(', ')}
          />
        </SettingRow>
        <SettingRow
          description="Allow force-with-lease only; unrestricted force push is never used."
          label="Force-with-lease"
        >
          <Switch
            aria-label="Allow force with lease"
            checked={value.allowForceWithLease}
            disabled={disabled}
            onCheckedChange={(allowForceWithLease) =>
              onChange({ ...value, allowForceWithLease } as T)
            }
          />
        </SettingRow>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Commit guidance
        <Textarea
          disabled={disabled}
          maxLength={2000}
          onChange={(event) => onChange({ ...value, commitInstructions: event.target.value } as T)}
          placeholder="Add project commit message guidance…"
          rows={4}
          value={value.commitInstructions}
        />
      </label>
      <Button className="w-fit cursor-pointer" type="submit">
        <Save /> Save developer settings
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
