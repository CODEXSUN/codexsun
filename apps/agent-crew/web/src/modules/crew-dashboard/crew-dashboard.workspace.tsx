import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@codexsun/ui/components/alert'
import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Card, CardContent, CardHeader, CardTitle } from '@codexsun/ui/components/card'
import { Field, FieldGroup, FieldLabel } from '@codexsun/ui/components/field'
import { Input } from '@codexsun/ui/components/input'
import { NativeSelect, NativeSelectOption } from '@codexsun/ui/components/native-select'
import { Switch } from '@codexsun/ui/components/switch'
import { Textarea } from '@codexsun/ui/components/textarea'
import {
  WorkspaceMetricCard,
  WorkspaceMetricGrid,
  WorkspacePageHeader,
  WorkspaceSectionCard,
} from '@codexsun/ui/blocks/workspace'

type Provider = { id: 'codex' | 'opencode' | 'ollama'; model: string; status: string }
type Run = {
  durationMs: number
  error?: string
  id: string
  model: string
  provider: string
  status: string
  workspaceId: string
}
type Overview = {
  metrics: { completed: number; failed: number; total: number }
  providers: Provider[]
  recentRuns: Run[]
}
const apiOrigin = import.meta.env.VITE_AGENT_CREW_API_URL || ''

export function CrewDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [provider, setProvider] = useState<Provider['id']>('codex')
  const [workspaceId, setWorkspaceId] = useState('demo-workspace')
  const [prompt, setPrompt] = useState(
    'Review this workspace and report the first safe next action.',
  )
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [compact, setCompact] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const load = async () => {
    const response = await fetch(`${apiOrigin}/api/agent-crew/overview`)
    const data: unknown = await response.json()
    if (!response.ok) throw new Error(readError(data))
    setOverview(data as Overview)
  }
  useEffect(() => {
    void load().catch((cause) => setError(readError(cause)))
  }, [])
  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(
      () => void load().catch((cause) => setError(readError(cause))),
      8_000,
    )
    return () => window.clearInterval(timer)
  }, [autoRefresh])
  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')
    setResult('')
    try {
      const response = await fetch(`${apiOrigin}/api/agent-crew/runs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, workspaceId, prompt }),
      })
      const data: unknown = await response.json()
      if (!response.ok) throw new Error(readError(data))
      setResult(
        typeof data === 'object' &&
          data !== null &&
          'message' in data &&
          typeof data.message === 'string'
          ? data.message
          : 'Provider completed without text output.',
      )
      await load()
    } catch (cause) {
      setError(readError(cause))
      await load().catch(() => undefined)
    }
  }
  return (
    <main
      className={
        compact
          ? 'mx-auto flex w-full max-w-7xl flex-col gap-4 p-4'
          : 'mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:p-8'
      }
    >
      <WorkspacePageHeader
        actions={<Button onClick={() => void load()}>Refresh status</Button>}
        description="Codex, OpenCode, and local Ollama work only inside scoped mounted workspaces."
        eyebrow="Docker-isolated execution"
        title="Agent Crew"
      />
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <section className="grid gap-4 md:grid-cols-3" aria-label="Provider status">
        {overview?.providers.map((item) => (
          <Card key={item.id} size="sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="capitalize">{item.id}</CardTitle>
              <Badge variant={item.status === 'ready' ? 'default' : 'secondary'}>
                {item.status}
              </Badge>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{item.model}</CardContent>
          </Card>
        )) ?? <p>Loading worker status…</p>}
      </section>
      <WorkspaceMetricGrid className="md:grid-cols-3 xl:grid-cols-3">
        <WorkspaceMetricCard label="Runs" value={overview?.metrics.total ?? 0} />
        <WorkspaceMetricCard
          label="Completed"
          tone="success"
          value={overview?.metrics.completed ?? 0}
        />
        <WorkspaceMetricCard label="Failed" tone="danger" value={overview?.metrics.failed ?? 0} />
      </WorkspaceMetricGrid>
      <section className="grid gap-4 lg:grid-cols-2">
        <WorkspaceSectionCard
          description="Choose an isolated provider and mounted workspace."
          title="Start controlled run"
        >
          <form className="grid gap-5" onSubmit={submit}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="crew-provider">Provider</FieldLabel>
                <NativeSelect
                  id="crew-provider"
                  className="w-full"
                  value={provider}
                  onChange={(event) => setProvider(event.target.value as Provider['id'])}
                >
                  {(['codex', 'opencode', 'ollama'] as const).map((item) => (
                    <NativeSelectOption key={item}>{item}</NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field>
                <FieldLabel htmlFor="crew-workspace">Mounted workspace ID</FieldLabel>
                <Input
                  id="crew-workspace"
                  value={workspaceId}
                  onChange={(event) => setWorkspaceId(event.target.value)}
                  pattern="[a-z0-9-]+"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="crew-prompt">Task prompt</FieldLabel>
                <Textarea
                  id="crew-prompt"
                  className="min-h-32"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  required
                />
              </Field>
            </FieldGroup>
            <Button type="submit">Run in worker</Button>
          </form>
        </WorkspaceSectionCard>
        <WorkspaceSectionCard title="Latest output">
          <pre className="max-h-80 min-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm">
            {result || 'No completed run in this browser session.'}
          </pre>
        </WorkspaceSectionCard>
      </section>
      <WorkspaceSectionCard title="Recent worker metrics">
        {overview?.recentRuns.length ? (
          <ul className="grid gap-2 text-sm">
            {overview.recentRuns.map((run) => (
              <li
                key={run.id}
                className="flex flex-wrap items-center gap-2 border-b py-2 last:border-0"
              >
                <strong>{run.provider}</strong>
                <span className="text-muted-foreground">
                  {run.workspaceId} · {run.status} · {run.durationMs} ms
                  {run.error ? ` · ${run.error}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No runs have been recorded by this worker.
          </p>
        )}
      </WorkspaceSectionCard>
      <aside className="fixed right-4 bottom-4 z-20 grid min-w-52 gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-lg">
        <strong>Dashboard controls</strong>
        <label className="flex items-center justify-between gap-4">
          Auto refresh
          <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
        </label>
        <label className="flex items-center justify-between gap-4">
          Compact view
          <Switch checked={compact} onCheckedChange={setCompact} />
        </label>
      </aside>
    </main>
  )
}
function readError(value: unknown) {
  if (value instanceof Error) return value.message
  if (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  )
    return value.error
  return 'Agent Crew is not reachable.'
}
