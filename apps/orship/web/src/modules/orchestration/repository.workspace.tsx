import { Button } from '@codexsun/ui/components/button'
import { Copy, Terminal } from 'lucide-react'
import { useMemo, useState } from 'react'

const repositories = [
  {
    branch: 'main',
    cloud: '/srv/codexsun',
    name: 'CODEXSUN',
    path: 'E:/new workspace/codexsun',
    remote: 'origin',
  },
]
const actions = ['compare', 'pull', 'build', 'compose'] as const
type Action = (typeof actions)[number]

export function RepositoryWorkspace() {
  const [selected, setSelected] = useState(() => new Set(repositories.map(({ name }) => name)))
  const [action, setAction] = useState<Action>('compare')
  const command = useMemo(
    () =>
      `bash ./.container/orship/repository-manager.sh --action ${action} --repo ${[...selected].join(',')}`,
    [action, selected],
  )
  const copy = () => void navigator.clipboard.writeText(command)
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Repository manager</h1>
          <p className="text-sm text-muted-foreground">
            Compare local and cloud targets, then run approved local operations.
          </p>
        </div>
        <Button onClick={copy} variant="outline">
          <Copy />
          Copy plan
        </Button>
      </header>
      <section className="overflow-hidden rounded-lg border">
        <div className="grid grid-cols-[48px_1fr_1fr] border-b bg-muted/30 px-4 py-3 text-sm font-medium">
          <span />
          <span>Local workspace</span>
          <span>Cloud target</span>
        </div>
        {repositories.map((repository) => (
          <label
            className="grid cursor-pointer grid-cols-[48px_1fr_1fr] items-center border-b px-4 py-4 last:border-0"
            key={repository.name}
          >
            <input
              checked={selected.has(repository.name)}
              className="size-4"
              onChange={() =>
                setSelected((current) => {
                  const next = new Set(current)
                  if (next.has(repository.name)) next.delete(repository.name)
                  else next.add(repository.name)
                  return next
                })
              }
              type="checkbox"
            />
            <div>
              <strong>{repository.name}</strong>
              <p className="font-mono text-xs text-muted-foreground">
                {repository.path} · {repository.remote}/{repository.branch}
              </p>
            </div>
            <div>
              <strong>Configured target</strong>
              <p className="font-mono text-xs text-muted-foreground">
                {repository.cloud} · {repository.branch}
              </p>
            </div>
          </label>
        ))}
      </section>
      <section className="rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          {actions.map((item) => (
            <Button
              key={item}
              onClick={() => setAction(item)}
              size="sm"
              variant={action === item ? 'default' : 'outline'}
            >
              {item}
            </Button>
          ))}
        </div>
        <div className="mt-4 rounded-md bg-slate-950 p-4 font-mono text-sm text-slate-100">
          <Terminal className="mr-2 inline size-4 text-emerald-400" />
          {command}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Run this command in a trusted terminal. The runner accepts only registered repositories
          and approved actions; transcript capture is the next Identity-ready step.
        </p>
      </section>
    </main>
  )
}
