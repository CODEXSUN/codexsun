import { useEffect, useState } from 'react'

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
    <main className={compact ? 'crew crew-compact' : 'crew'}>
      <section className="crew-heading">
        <div>
          <p className="eyebrow">Docker-isolated execution</p>
          <h1>Agent Crew</h1>
          <p>Codex, OpenCode, and local Ollama work only inside scoped mounted workspaces.</p>
        </div>
        <button onClick={() => void load()}>Refresh status</button>
      </section>
      {error && (
        <p className="crew-error" role="alert">
          {error}
        </p>
      )}
      <section className="provider-grid">
        {overview?.providers.map((item) => (
          <article className="provider-card" key={item.id}>
            <span className={`dot ${item.status === 'ready' ? 'ready' : ''}`} />
            <h2>{item.id}</h2>
            <p>{item.model}</p>
            <small>{item.status}</small>
          </article>
        )) ?? <p>Loading worker status…</p>}
      </section>
      <section className="metric-grid">
        <Metric label="Runs" value={overview?.metrics.total ?? 0} />
        <Metric label="Completed" value={overview?.metrics.completed ?? 0} />
        <Metric label="Failed" value={overview?.metrics.failed ?? 0} />
      </section>
      <section className="work-grid">
        <form className="run-form" onSubmit={submit}>
          <h2>Start controlled run</h2>
          <label>
            Provider
            <select
              value={provider}
              onChange={(event) => setProvider(event.target.value as Provider['id'])}
            >
              {(['codex', 'opencode', 'ollama'] as const).map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            Mounted workspace ID
            <input
              value={workspaceId}
              onChange={(event) => setWorkspaceId(event.target.value)}
              pattern="[a-z0-9-]+"
              required
            />
          </label>
          <label>
            Task prompt
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} required />
          </label>
          <button type="submit">Run in worker</button>
        </form>
        <section className="run-output">
          <h2>Latest output</h2>
          <pre>{result || 'No completed run in this browser session.'}</pre>
        </section>
      </section>
      <section className="recent">
        <h2>Recent worker metrics</h2>
        {overview?.recentRuns.length ? (
          <ul>
            {overview.recentRuns.map((run) => (
              <li key={run.id}>
                <strong>{run.provider}</strong> · {run.workspaceId} · {run.status} ·{' '}
                {run.durationMs} ms{run.error ? ` · ${run.error}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          <p>No runs have been recorded by this worker.</p>
        )}
      </section>
      <aside className="tweak-panel">
        <strong>Dashboard controls</strong>
        <label>
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(event) => setAutoRefresh(event.target.checked)}
          />{' '}
          Auto refresh
        </label>
        <label>
          <input
            type="checkbox"
            checked={compact}
            onChange={(event) => setCompact(event.target.checked)}
          />{' '}
          Compact view
        </label>
      </aside>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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
