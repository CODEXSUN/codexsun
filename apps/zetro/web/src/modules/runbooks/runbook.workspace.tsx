import { useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '@codexsun/ui/components/button'
import { Input } from '@codexsun/ui/components/input'
import { Label } from '@codexsun/ui/components/label'
import { Switch } from '@codexsun/ui/components/switch'
import { Textarea } from '@codexsun/ui/components/textarea'
import { CalendarClock, Play, Power, Square } from 'lucide-react'
import type { Runbook, RunbookCreateRequest, RunbookRun } from '@codexsun/zetro-contracts'

export function RunbookWorkspace({ busy, runbook, runs, onCreate, onEnabled, onStart, onStop }: Props) {
  return <section className="size-full overflow-y-auto bg-background px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto max-w-4xl">{runbook ? <RunbookDetails busy={busy} runbook={runbook} runs={runs} onEnabled={onEnabled} onStart={onStart} onStop={onStop} /> : <RunbookForm busy={busy} onCreate={onCreate} />}</div></section>
}

function RunbookForm({ busy, onCreate }: { busy: boolean; onCreate(input: RunbookCreateRequest): Promise<void> }) {
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [repositoryPath, setRepositoryPath] = useState('')
  const [modulePath, setModulePath] = useState('')
  const [intervalMinutes, setIntervalMinutes] = useState('60')
  const [repeating, setRepeating] = useState(false)
  async function submit(event: FormEvent) { event.preventDefault(); await onCreate({ title, prompt, repositoryPath, modulePath, schedule: repeating ? { intervalMinutes: Number(intervalMinutes), mode: 'repeating' } : { mode: 'one-time' } }) }
  return <><Header eyebrow="New runbook" title="One-time and repeating work" description="Each run starts an isolated worker. Repeating runbooks need an explicit schedule." /><form className="grid gap-5 py-6" onSubmit={(event) => void submit(event)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Title"><Input required value={title} onChange={(event) => setTitle(event.target.value)} /></Field><ModeSwitch checked={repeating} onCheckedChange={setRepeating} /><Field label="Repository path"><Input required value={repositoryPath} onChange={(event) => setRepositoryPath(event.target.value)} /></Field><Field label="Approved module path"><Input required value={modulePath} onChange={(event) => setModulePath(event.target.value)} /></Field></div>{repeating ? <Schedule intervalMinutes={intervalMinutes} onChange={setIntervalMinutes} /> : null}<Field label="Refined worker prompt"><Textarea required className="min-h-28" value={prompt} onChange={(event) => setPrompt(event.target.value)} /></Field><div><Button className="cursor-pointer" disabled={busy} type="submit"><CalendarClock />Create {repeating ? 'repeating' : 'one-time'} runbook</Button></div></form></>
}

function RunbookDetails({ busy, runbook, runs, onEnabled, onStart, onStop }: { busy: boolean; runbook: Runbook; runs: RunbookRun[]; onEnabled(id: string, enabled: boolean): Promise<void>; onStart(id: string): Promise<void>; onStop(id: string): Promise<void> }) {
  const ownRuns = runs.filter((run) => run.runbookId === runbook.id)
  const activeRun = ownRuns.find((run) => ['queued', 'running'].includes(run.status))
  const schedule = runbook.schedule.mode === 'repeating' ? `Repeats every ${runbook.schedule.intervalMinutes} minutes` : 'One-time manual run'
  return <><Header eyebrow="Runbook" title={runbook.title} description={schedule} /><section className="grid gap-4 border-b py-6 text-sm sm:grid-cols-2"><Value label="Repository" value={runbook.repositoryPath} /><Value label="Approved module" value={runbook.modulePath} /><Value label="Schedule" value={schedule} /><Value label="State" value={runbook.enabled ? 'Enabled' : 'Manual'} /></section><section className="border-b py-6"><p className="text-sm font-medium">Worker prompt</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{runbook.prompt}</p></section><div className="flex flex-wrap gap-2 py-6">{activeRun ? <Button className="cursor-pointer" disabled={busy} onClick={() => void onStop(activeRun.id)} type="button" variant="destructive"><Square />Stop run</Button> : <Button className="cursor-pointer" disabled={busy} onClick={() => void onStart(runbook.id)} type="button"><Play />Start now</Button>}{runbook.schedule.mode === 'repeating' ? <Button className="cursor-pointer" disabled={busy} onClick={() => void onEnabled(runbook.id, !runbook.enabled)} type="button" variant={runbook.enabled ? 'neutral' : 'outline'}><Power />{runbook.enabled ? 'Disable schedule' : 'Enable schedule'}</Button> : null}</div><section className="border-t py-6"><h2 className="text-sm font-semibold">Run history</h2><div className="mt-3 grid gap-3">{ownRuns.map((run) => <article className="rounded-lg border p-3 text-sm" key={run.id}><p className="font-medium">{run.triggeredBy} · {run.status}</p>{run.initiator ? <p className="mt-1 text-xs text-muted-foreground">Initiated by {run.initiator.moduleId} · {run.initiator.itemId}</p> : null}<p className="mt-2 whitespace-pre-wrap text-xs text-muted-foreground">{run.report || 'Worker queued.'}</p></article>)}{!ownRuns.length ? <p className="py-8 text-sm text-muted-foreground">This runbook has not started yet.</p> : null}</div></section></>
}

function Header({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) { return <header className="border-b pb-5"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{eyebrow}</p><h1 className="mt-1 text-xl font-semibold">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p></header> }
function ModeSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange(value: boolean): void }) { return <div className="flex items-center justify-between rounded-lg border px-4 py-3"><div><Label htmlFor="runbook-repeat">Repeating schedule</Label><p className="mt-1 text-xs text-muted-foreground">{checked ? 'Runs on the saved interval.' : 'Runs only when you start it.'}</p></div><Switch checked={checked} id="runbook-repeat" onCheckedChange={onCheckedChange} /></div> }
function Schedule({ intervalMinutes, onChange }: { intervalMinutes: string; onChange(value: string): void }) { return <section className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2"><Field label="Run every minutes"><Input min="15" required type="number" value={intervalMinutes} onChange={(event) => onChange(event.target.value)} /></Field><p className="self-end pb-2 text-sm text-muted-foreground">The scheduler checks due work every 15 seconds. The interval must be at least 15 minutes.</p></section> }
function Value({ label, value }: { label: string; value: string }) { return <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 break-all font-medium">{value}</p></div> }
function Field({ children, label }: { children: ReactNode; label: string }) { return <label className="grid gap-2 text-sm font-medium"><Label>{label}</Label>{children}</label> }
type Props = { busy: boolean; runbook?: Runbook; runs: RunbookRun[]; onCreate(input: RunbookCreateRequest): Promise<void>; onEnabled(id: string, enabled: boolean): Promise<void>; onStart(id: string): Promise<void>; onStop(id: string): Promise<void> }
