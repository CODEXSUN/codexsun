import { Button } from '@codexsun/ui/components/button'
import { CalendarClock, Plus } from 'lucide-react'
import type { Runbook } from '@codexsun/zetro-contracts'

export function RunbookRegistry({ query, runbooks, selectedId, onCreate, onSelect }: { query: string; runbooks: Runbook[]; selectedId?: string; onCreate(): void; onSelect(id: string): void }) {
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visible = runbooks.filter((runbook) => !normalizedQuery || runbook.title.toLocaleLowerCase().includes(normalizedQuery))
  return <div className="flex min-h-full flex-col gap-2 p-3"><Button className="justify-start" onClick={onCreate} variant="outline"><Plus />New runbook</Button><div className="flex items-center justify-between px-2 py-2 text-sm font-medium"><span>Runbooks</span><span className="text-xs font-normal text-muted-foreground">{visible.length}</span></div><div aria-label="Runbooks" className="grid gap-1">{visible.map((runbook) => <Button className="h-auto min-w-0 justify-start gap-2 px-2 py-2.5 text-left" key={runbook.id} onClick={() => onSelect(runbook.id)} variant={runbook.id === selectedId ? 'secondary' : 'ghost'}><CalendarClock className="size-4 shrink-0 text-muted-foreground" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{runbook.title}</span><span className="block truncate text-xs font-normal text-muted-foreground">{scheduleLabel(runbook)}</span></span></Button>)}{!visible.length ? <p className="px-2 py-8 text-center text-sm text-muted-foreground">{normalizedQuery ? 'No matching runbooks.' : 'Create a runbook for repeatable work.'}</p> : null}</div></div>
}

function scheduleLabel(runbook: Runbook) { return runbook.schedule.mode === 'repeating' ? `Repeats every ${runbook.schedule.intervalMinutes} min` : 'One-time manual run' }
