import { Badge } from '@codexsun/ui/components/badge'
import { Button } from '@codexsun/ui/components/button'
import { Label } from '@codexsun/ui/components/label'
import { Textarea } from '@codexsun/ui/components/textarea'
import { Check, Clipboard, FileCode2, GitBranch, Settings2, Terminal } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  CloudTarget,
  DeploymentAction,
  DeploymentEvidence,
  DeploymentRecord,
  DeploymentRecordCreate,
  ServiceSnapshot,
} from './orchestration.types'

const actions: readonly DeploymentAction[] = ['verify', 'pull', 'prepare', 'deploy']

export function DeploymentConsole({
  cloudTarget,
  evidence,
  recordError,
  recordPending,
  records,
  services,
  onCreateRecord,
  onOpenSettings,
}: {
  cloudTarget: CloudTarget | undefined
  evidence: DeploymentEvidence | undefined
  recordError: string | undefined
  recordPending: boolean
  records: readonly DeploymentRecord[]
  services: readonly ServiceSnapshot[]
  onCreateRecord: (record: DeploymentRecordCreate) => void
  onOpenSettings: () => void
}) {
  const [action, setAction] = useState<DeploymentAction>('verify')
  const [copied, setCopied] = useState(false)
  const [exitCode, setExitCode] = useState('')
  const [output, setOutput] = useState('')
  const [status, setStatus] = useState<DeploymentRecordCreate['status']>('awaiting-verification')
  const command = evidence?.commands.find((candidate) => candidate.action === action)
  const applicationId = services[0]?.applicationId ?? 'application'

  useEffect(() => {
    setExitCode('')
    setOutput('')
    setStatus('awaiting-verification')
  }, [action])

  const copyCommand = async () => {
    if (!command) return
    await navigator.clipboard.writeText(command.command)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1_500)
  }

  const saveEvidence = () => {
    const parsedExitCode = exitCode.trim() === '' ? null : Number(exitCode)
    if (parsedExitCode !== null && !Number.isInteger(parsedExitCode)) return
    onCreateRecord({ action, exitCode: parsedExitCode, output, status })
  }

  if (applicationId !== 'platform') return <UnsupportedDeployment applicationId={applicationId} />

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-muted/20 p-5 pb-10">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border bg-background p-5">
          <div>
            <p className="text-sm text-muted-foreground">Deployment console</p>
            <h2 className="mt-1 text-xl font-semibold">Platform</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Review Local Docker commands and record the result after manual execution.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Local Docker</Badge>
            <Badge variant="outline">platform-only</Badge>
            <Button onClick={onOpenSettings} size="sm" variant="outline">
              <Settings2 />
              Deployment target
            </Button>
          </div>
        </header>

        {evidence ? (
          <RepositoryEvidence evidence={evidence} cloudTarget={cloudTarget} />
        ) : (
          <LoadingEvidence />
        )}

        <section className="grid gap-2 rounded-lg border border-border bg-background p-3 sm:grid-cols-4">
          {actions.map((candidate) => (
            <Button
              className="justify-start"
              key={candidate}
              onClick={() => setAction(candidate)}
              variant={action === candidate ? 'default' : 'ghost'}
            >
              {candidate[0]?.toUpperCase()}
              {candidate.slice(1)}
            </Button>
          ))}
        </section>

        {command ? (
          <>
            <TerminalPreview command={command} copied={copied} onCopy={copyCommand} />
            <FileEvidence command={command} />
            <ManualVerification
              action={action}
              error={recordError}
              exitCode={exitCode}
              output={output}
              pending={recordPending}
              status={status}
              onExitCodeChange={setExitCode}
              onOutputChange={setOutput}
              onSave={saveEvidence}
              onStatusChange={setStatus}
            />
          </>
        ) : null}

        <DeploymentHistory records={records} />
      </section>
    </div>
  )
}

function RepositoryEvidence({
  evidence,
  cloudTarget,
}: {
  evidence: DeploymentEvidence
  cloudTarget: CloudTarget | undefined
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <GitBranch className="size-4 text-muted-foreground" />
        <h3 className="font-semibold">Repository evidence</h3>
      </div>
      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <EvidenceItem label="Branch" value={evidence.repository.branch} />
        <EvidenceItem label="Commit" mono value={evidence.repository.commit} />
        <EvidenceItem
          label="Working tree"
          value={evidence.repository.dirty ? 'Changed' : 'Clean'}
        />
        <EvidenceItem label="Target" value={cloudTarget?.name ?? 'Local Docker'} />
        <EvidenceItem
          className="sm:col-span-2"
          label="Repository"
          mono
          value={evidence.repository.url ?? evidence.repository.path}
        />
        <EvidenceItem
          className="sm:col-span-2"
          label="Workspace"
          mono
          value={evidence.repository.path}
        />
      </dl>
    </section>
  )
}

function TerminalPreview({
  command,
  copied,
  onCopy,
}: {
  command: DeploymentEvidence['commands'][number]
  copied: boolean
  onCopy: () => Promise<void>
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-100">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-sm">
          <Terminal className="size-4 text-emerald-400" />
          command preview
        </div>
        <Button
          className="border-zinc-700 text-zinc-100 hover:bg-zinc-800"
          onClick={() => void onCopy()}
          size="sm"
          variant="outline"
        >
          {copied ? <Check /> : <Clipboard />}
          {copied ? 'Copied' : 'Copy command'}
        </Button>
      </div>
      <div className="p-5 font-mono text-sm leading-7">
        <p className="text-emerald-400">$ {command.command}</p>
        <p className="mt-4 text-zinc-400"># {command.title}</p>
        <p className="text-zinc-500">
          Manual execution required. Orship does not run this command.
        </p>
      </div>
    </section>
  )
}

function FileEvidence({ command }: { command: DeploymentEvidence['commands'][number] }) {
  const files = [...command.requiredFiles, ...command.expectedFiles]
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <div className="flex items-center gap-2">
        <FileCode2 className="size-4 text-muted-foreground" />
        <h3 className="font-semibold">Files involved</h3>
      </div>
      <div className="mt-4 grid gap-2">
        {files.map((file) => (
          <div
            className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm sm:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
            key={file.path}
          >
            <span className="truncate font-mono">{file.path}</span>
            <div className="flex items-center gap-2 sm:contents">
              <Badge variant="outline">{file.kind}</Badge>
              <span className={file.exists ? 'text-emerald-700' : 'text-amber-700'}>
                {file.exists ? 'Present' : 'Missing'}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {file.modifiedAt ? new Date(file.modifiedAt).toLocaleString() : 'Not generated'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ManualVerification({
  action,
  error,
  exitCode,
  output,
  pending,
  status,
  onExitCodeChange,
  onOutputChange,
  onSave,
  onStatusChange,
}: {
  action: DeploymentAction
  error: string | undefined
  exitCode: string
  output: string
  pending: boolean
  status: DeploymentRecordCreate['status']
  onExitCodeChange: (value: string) => void
  onOutputChange: (value: string) => void
  onSave: () => void
  onStatusChange: (value: DeploymentRecordCreate['status']) => void
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h3 className="font-semibold">Manual verification</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Paste real terminal output. Orship redacts common secrets before it stores immutable
        evidence.
      </p>
      <div className="mt-4 grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="deployment-output">Captured output</Label>
          <Textarea
            id="deployment-output"
            onChange={(event) => onOutputChange(event.target.value)}
            placeholder="Paste terminal output after you run the command."
            value={output}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-[12rem_1fr_auto]">
          <div className="grid gap-2">
            <Label htmlFor="deployment-exit-code">Exit code</Label>
            <input
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              id="deployment-exit-code"
              inputMode="numeric"
              onChange={(event) => onExitCodeChange(event.target.value)}
              placeholder="0"
              value={exitCode}
            />
          </div>
          <div className="grid gap-2">
            <Label>Status</Label>
            <div className="flex gap-2">
              <StatusButton
                active={status === 'awaiting-verification'}
                label="Awaiting"
                onClick={() => onStatusChange('awaiting-verification')}
              />
              <StatusButton
                active={status === 'verified'}
                label="Verified"
                onClick={() => onStatusChange('verified')}
              />
              <StatusButton
                active={status === 'failed'}
                label="Failed"
                onClick={() => onStatusChange('failed')}
              />
            </div>
          </div>
          <Button className="self-end" disabled={pending || output.trim() === ''} onClick={onSave}>
            {pending ? 'Saving' : `Save ${action} evidence`}
          </Button>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </section>
  )
}

function StatusButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <Button onClick={onClick} size="sm" type="button" variant={active ? 'default' : 'outline'}>
      {label}
    </Button>
  )
}

function DeploymentHistory({ records }: { records: readonly DeploymentRecord[] }) {
  return (
    <section className="rounded-lg border border-border bg-background p-5">
      <h3 className="font-semibold">Deployment history</h3>
      {records.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No manual deployment evidence has been recorded.
        </p>
      ) : (
        <div className="mt-4 grid gap-2">
          {records.slice(0, 8).map((record) => (
            <details className="rounded-md border border-border" key={record.id}>
              <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="font-medium capitalize">{record.action}</span>
                <Badge variant={record.status === 'verified' ? 'secondary' : 'outline'}>
                  {record.status}
                </Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {record.repository.commit}
                </span>
                <span className="text-muted-foreground">
                  {new Date(record.startedAt).toLocaleString()}
                </span>
              </summary>
              <pre className="max-h-64 overflow-auto border-t border-border bg-zinc-950 p-3 font-mono text-xs leading-5 text-zinc-100">
                {record.output || 'No terminal output was captured.'}
              </pre>
            </details>
          ))}
        </div>
      )}
    </section>
  )
}

function EvidenceItem({
  className,
  label,
  mono,
  value,
}: {
  className?: string
  label: string
  mono?: boolean
  value: string
}) {
  return (
    <div className={className}>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={`mt-1 truncate font-medium ${mono ? 'font-mono text-xs' : ''}`} title={value}>
        {value}
      </dd>
    </div>
  )
}

function LoadingEvidence() {
  return (
    <section className="rounded-lg border border-border bg-background p-5 text-sm text-muted-foreground">
      Reading local repository and file evidence…
    </section>
  )
}

function UnsupportedDeployment({ applicationId }: { applicationId: string }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-muted-foreground">
      Local Docker deployment evidence is available for Platform only. {applicationId} remains
      observable from Overview.
    </div>
  )
}
