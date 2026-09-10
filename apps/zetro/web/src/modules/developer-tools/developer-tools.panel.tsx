import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Braces,
  Code2,
  FileCode2,
  FolderOpen,
  GitBranch,
  GitFork,
  GitCompareArrows,
  GitCommitHorizontal,
  LoaderCircle,
  PanelRightClose,
  RefreshCw,
  RotateCcw,
  Terminal,
  Upload,
} from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@codexsun/ui/components/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import { Input } from '@codexsun/ui/components/input'
import { useDeveloperTools } from './developer-tools.controller'
import type { GitCommitSummary, GitComparison } from './developer-tools.types'
import { RepositoryWorkspace } from './developer-tools.workspace'

export function DeveloperToolsPanel({
  open: controlledOpen,
  topContent,
  onOpenChange,
}: {
  open?: boolean
  topContent?: ReactNode
  onOpenChange?(open: boolean): void
}) {
  const tools = useDeveloperTools()
  const [internalOpen, setInternalOpen] = useState(false)
  const [commitOpen, setCommitOpen] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)
  const [pushOpen, setPushOpen] = useState(false)
  const [revertCommit, setRevertCommit] = useState<GitCommitSummary | null>(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(false)
  if (!tools.project) return null
  const status = tools.status
  const changed = status?.files ?? 0
  const open = controlledOpen ?? internalOpen

  function setOpen(nextOpen: boolean) {
    if (controlledOpen === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        aria-label="Open repository tools"
        className="fixed bottom-10 right-2 z-40 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border bg-background px-2.5 text-xs font-medium shadow-md transition hover:-translate-y-0.5 hover:border-orange-400"
        onClick={() => setOpen(true)}
        title={`Repository tools · ${status?.branch ?? 'Git'}`}
        type="button"
      >
        <GitBranch className="size-3.5" />
        <span className={changed ? 'text-orange-600' : 'text-muted-foreground'}>{changed}</span>
      </Button>
    )
  }

  return (
    <>
      <aside
        aria-label="Repository tools"
        className="fixed bottom-10 right-4 z-40 flex max-h-[calc(100vh-6rem)] w-[22rem] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl"
      >
        <header className="flex items-center gap-2 border-b px-3 py-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background">
            <GitBranch className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{status?.branch ?? 'Repository'}</div>
            <div className="truncate text-xs text-muted-foreground">
              {status?.upstream ?? 'No upstream branch'}
            </div>
          </div>
          <Button
            aria-label="Refresh Git status"
            className="cursor-pointer"
            disabled={tools.busy}
            onClick={() => void tools.refresh()}
            size="icon-xs"
            variant="ghost"
          >
            <RefreshCw className={tools.busy ? 'animate-spin' : ''} />
          </Button>
          <Button
            aria-label="Close repository tools"
            className="cursor-pointer"
            onClick={() => setOpen(false)}
            size="icon-xs"
            variant="ghost"
          >
            <PanelRightClose />
          </Button>
        </header>
        {topContent}
        <div className="min-h-0 overflow-y-auto">
          <section className="grid grid-cols-3 border-b p-2">
            <Metric label="Changed" value={changed} />
            <Metric label="Staged" value={status?.staged ?? 0} />
            <Metric label="Untracked" value={status?.untracked ?? 0} />
          </section>
          <section className="flex items-center gap-4 border-b px-3 py-2 text-xs">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp className="size-3.5" />
              {status?.ahead ?? 0} ahead
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <ArrowDown className="size-3.5" />
              {status?.behind ?? 0} behind
            </span>
            <span className="ml-auto text-muted-foreground">{status?.latencyMs ?? '—'} ms</span>
          </section>
          <section className="grid grid-cols-3 gap-1 border-b p-2">
            <ToolButton
              icon={Code2}
              label="Editor"
              onClick={() => void tools.launch('editor').catch(() => undefined)}
            />
            <ToolButton
              icon={FolderOpen}
              label="Files"
              onClick={() => void tools.launch('files').catch(() => undefined)}
            />
            <ToolButton
              icon={Terminal}
              label="Terminal"
              onClick={() => void tools.launch('terminal').catch(() => undefined)}
            />
          </section>
          <section className="grid grid-cols-2 gap-1 border-b p-2">
            <ToolButton icon={FileCode2} label="Changes" onClick={() => setWorkspaceOpen(true)} />
            <ToolButton
              icon={GitCompareArrows}
              label="Compare"
              onClick={() => setCompareOpen(true)}
            />
            <ToolButton
              icon={RefreshCw}
              label="Fetch"
              onClick={() => void tools.run({ action: 'fetch' }).catch(() => undefined)}
            />
            <ToolButton icon={GitFork} label="New branch" onClick={() => setBranchOpen(true)} />
            <ToolButton
              disabled={!changed}
              icon={GitCommitHorizontal}
              label="Commit"
              onClick={() => setCommitOpen(true)}
            />
            <ToolButton
              disabled={!tools.effective?.allowPush}
              icon={Upload}
              label="Push"
              onClick={() => setPushOpen(true)}
            />
          </section>
          <section className="p-2">
            <div className="px-1 pb-1.5 text-xs font-medium text-muted-foreground">
              Recent commits
            </div>
            {status?.recentCommits.map((commit) => (
              <CommitRow
                commit={commit}
                key={commit.hash}
                onRevert={() => setRevertCommit(commit)}
              />
            ))}
            {!status ? (
              <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                Reading repository
              </div>
            ) : null}
          </section>
        </div>
        <footer className="flex items-center border-t px-3 py-2 text-[11px] text-muted-foreground">
          <Braces className="mr-1.5 size-3.5" />
          <span>+{status?.additions ?? 0}</span>
          <span className="ml-2">−{status?.deletions ?? 0}</span>
          <span className="ml-auto">Live every {tools.effective?.autoRefreshSeconds ?? 15}s</span>
        </footer>
        {tools.error ? (
          <div className="border-t bg-destructive/5 px-3 py-2 text-xs text-destructive">
            {tools.error}
          </div>
        ) : null}
      </aside>
      <CommitDialog onOpenChange={setCommitOpen} open={commitOpen} />
      <RepositoryWorkspace onOpenChange={setWorkspaceOpen} open={workspaceOpen} />
      <CompareDialog onOpenChange={setCompareOpen} open={compareOpen} />
      <BranchDialog onOpenChange={setBranchOpen} open={branchOpen} />
      <PushDialog
        branch={status?.branch ?? 'this branch'}
        onOpenChange={setPushOpen}
        open={pushOpen}
      />
      <ConfirmAction
        destructive
        description={`Create a new commit that reverses ${revertCommit?.shortHash} ${revertCommit?.subject}? Your existing history remains intact.`}
        onConfirm={() =>
          revertCommit &&
          void tools.run({ action: 'revert', commit: revertCommit.hash }).catch(() => undefined)
        }
        onOpenChange={(next) => !next && setRevertCommit(null)}
        open={revertCommit !== null}
        title="Revert commit"
      />
    </>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg px-2 py-1.5 text-center hover:bg-muted">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  )
}
function ToolButton({
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  disabled?: boolean
  icon: typeof GitBranch
  label: string
  onClick(): void
}) {
  return (
    <Button
      className="h-9 cursor-pointer justify-start"
      disabled={disabled}
      onClick={onClick}
      size="sm"
      variant="ghost"
    >
      <Icon />
      {label}
    </Button>
  )
}
function CommitRow({ commit, onRevert }: { commit: GitCommitSummary; onRevert(): void }) {
  return (
    <div className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted">
      <FileCode2 className="size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs">{commit.subject}</div>
        <div className="text-[11px] text-muted-foreground">
          {commit.shortHash} · {new Date(commit.authoredAt).toLocaleDateString()}
        </div>
      </div>
      <Button
        aria-label={`Revert ${commit.shortHash}`}
        className="cursor-pointer opacity-0 group-hover:opacity-100"
        onClick={onRevert}
        size="icon-xs"
        title="Revert commit"
        variant="ghost"
      >
        <RotateCcw />
      </Button>
    </div>
  )
}

function CommitDialog({
  onOpenChange,
  open,
}: {
  onOpenChange(open: boolean): void
  open: boolean
}) {
  const tools = useDeveloperTools()
  const [message, setMessage] = useState('')
  const [stageAll, setStageAll] = useState(false)
  useEffect(() => {
    if (open) {
      setMessage('')
      setStageAll(false)
    }
  }, [open])
  function submit(event: FormEvent) {
    event.preventDefault()
    void tools
      .run({ action: 'commit', message, stageAll })
      .then(() => onOpenChange(false))
      .catch(() => undefined)
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Commit changes</DialogTitle>
            <DialogDescription>
              Commit staged files, or explicitly stage every current change first.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            maxLength={500}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Commit message"
            value={message}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              checked={stageAll}
              className="size-4"
              onChange={(event) => setStageAll(event.target.checked)}
              type="checkbox"
            />
            Stage all tracked and untracked changes
          </label>
          {tools.effective?.commitInstructions ? (
            <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
              {tools.effective.commitInstructions}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              className="cursor-pointer"
              disabled={!message.trim() || tools.busy}
              type="submit"
            >
              <GitCommitHorizontal />
              Commit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function BranchDialog({
  onOpenChange,
  open,
}: {
  onOpenChange(open: boolean): void
  open: boolean
}) {
  const tools = useDeveloperTools()
  const [name, setName] = useState('')
  useEffect(() => {
    if (open) setName('')
  }, [open])
  function submit(event: FormEvent) {
    event.preventDefault()
    void tools
      .run({ action: 'branch', name })
      .then(() => onOpenChange(false))
      .catch(() => undefined)
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>New branch</DialogTitle>
            <DialogDescription>
              Zetro adds the configured prefix before it creates and switches branches.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-1.5 text-sm font-medium">
            Branch name
            <div className="flex items-center rounded-md border bg-background">
              <span className="pl-3 text-sm text-muted-foreground">
                {tools.effective?.branchPrefix}
              </span>
              <Input
                autoFocus
                className="border-0 shadow-none"
                maxLength={160}
                onChange={(event) => setName(event.target.value)}
                placeholder="feature-name"
                value={name}
              />
            </div>
          </label>
          <DialogFooter>
            <Button className="cursor-pointer" disabled={!name.trim() || tools.busy} type="submit">
              <GitFork />
              Create branch
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PushDialog({
  branch,
  onOpenChange,
  open,
}: {
  branch: string
  onOpenChange(open: boolean): void
  open: boolean
}) {
  const tools = useDeveloperTools()
  const [forceWithLease, setForceWithLease] = useState(false)
  useEffect(() => {
    if (open) setForceWithLease(false)
  }, [open])
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Push branch</AlertDialogTitle>
          <AlertDialogDescription>Push {branch} to its configured upstream?</AlertDialogDescription>
        </AlertDialogHeader>
        {tools.effective?.allowForceWithLease ? (
          <label className="flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm">
            <input
              checked={forceWithLease}
              className="mt-0.5 size-4"
              onChange={(event) => setForceWithLease(event.target.checked)}
              type="checkbox"
            />
            <span>
              <span className="block font-medium">Use force-with-lease</span>
              <span className="text-xs text-muted-foreground">
                Reject the push if the remote branch changed.
              </span>
            </span>
          </label>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              void tools.run({ action: 'push', forceWithLease }).catch(() => undefined)
            }
          >
            Push branch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CompareDialog({
  onOpenChange,
  open,
}: {
  onOpenChange(open: boolean): void
  open: boolean
}) {
  const tools = useDeveloperTools()
  const [base, setBase] = useState('')
  const [comparison, setComparison] = useState<GitComparison | null>(null)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    if (open) {
      setBase(tools.effective?.compareBranch ?? 'main')
      setComparison(null)
      setError(null)
    }
  }, [open, tools.effective?.compareBranch])
  async function compare(event: FormEvent) {
    event.preventDefault()
    try {
      setComparison(await tools.compare(base))
      setError(null)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Compare failed.')
    }
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-lg">
        <form className="grid gap-4" onSubmit={(event) => void compare(event)}>
          <DialogHeader>
            <DialogTitle>Compare branch</DialogTitle>
            <DialogDescription>
              Compare the current HEAD with a local or fetched base branch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Input autoFocus onChange={(event) => setBase(event.target.value)} value={base} />
            <Button className="cursor-pointer" type="submit">
              <GitCompareArrows />
              Compare
            </Button>
          </div>
          {comparison ? (
            <div className="grid gap-2">
              <div className="flex gap-4 rounded-lg bg-muted p-3 text-sm">
                <span>{comparison.commitsAhead} commits</span>
                <span className="text-emerald-600">+{comparison.additions}</span>
                <span className="text-destructive">−{comparison.deletions}</span>
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border">
                {comparison.files.map((file) => (
                  <div
                    className="flex gap-2 border-b px-3 py-2 text-xs last:border-b-0"
                    key={`${file.status}-${file.path}`}
                  >
                    <span className="w-8 shrink-0 font-mono text-muted-foreground">
                      {file.status}
                    </span>
                    <span className="truncate">{file.path}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmAction({
  description,
  destructive = false,
  onConfirm,
  onOpenChange,
  open,
  title,
}: {
  description: string
  destructive?: boolean
  onConfirm(): void
  onOpenChange(open: boolean): void
  open: boolean
  title: string
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} variant={destructive ? 'destructive' : 'default'}>
            {title}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
