import { useEffect, useState, type FormEvent } from 'react'
import { Activity, Save } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { Switch } from '@codexsun/ui/components/switch'
import { getOperationsSettings, saveOperationsSettings } from './operations.services'
import type { OperationsSettings } from './operations.types'

export function OperationsSettingsView() {
  const [settings, setSettings] = useState<OperationsSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    void getOperationsSettings().then(setSettings).catch(toError(setError))
  }, [])
  if (!settings)
    return <p className="text-sm text-muted-foreground">Loading operations settings…</p>
  function submit(event: FormEvent) {
    event.preventDefault()
    void saveOperationsSettings(settings!).then(setSettings).catch(toError(setError))
  }
  return (
    <section className="flex flex-col gap-7">
      <header className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-lg bg-muted">
          <Activity className="size-4" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold">Operations</h1>
          <p className="pt-1 text-sm text-muted-foreground">
            Retention, recovery, metrics, and diagnostics.
          </p>
        </div>
      </header>
      <form className="grid gap-5" onSubmit={submit}>
        <div className="overflow-hidden rounded-xl border">
          <Row
            description="Remove only clean managed worktrees after the retention period."
            label="Automatic worktree sweep"
          >
            <Switch
              checked={settings.autoSweepWorktrees}
              onCheckedChange={(autoSweepWorktrees) =>
                setSettings({ ...settings, autoSweepWorktrees })
              }
            />
          </Row>
          <Row description="Days to retain a clean inactive worktree." label="Worktree retention">
            <NumberInput
              value={settings.worktreeRetentionDays}
              onChange={(worktreeRetentionDays) =>
                setSettings({ ...settings, worktreeRetentionDays })
              }
            />
          </Row>
          <Row
            description="Days to retain metric samples from connected applications."
            label="Metric retention"
          >
            <NumberInput
              value={settings.metricRetentionDays}
              onChange={(metricRetentionDays) => setSettings({ ...settings, metricRetentionDays })}
            />
          </Row>
        </div>
        <Button className="w-fit cursor-pointer" type="submit">
          <Save /> Save operations settings
        </Button>
      </form>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </section>
  )
}
function NumberInput({ onChange, value }: { onChange(value: number): void; value: number }) {
  return (
    <Input
      className="w-24"
      max={3650}
      min={1}
      onChange={(event) => onChange(Number(event.target.value))}
      type="number"
      value={value}
    />
  )
}
function Row({
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
      {children}
    </div>
  )
}
function toError(setError: (value: string) => void) {
  return (reason: unknown) =>
    setError(reason instanceof Error ? reason.message : 'Operations settings are unavailable.')
}
