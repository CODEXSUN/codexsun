import { useCallback, useEffect, useState } from 'react'
import { Archive, GitPullRequest, Play, RefreshCw, Trash2 } from 'lucide-react'
import { Button } from '@codexsun/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@codexsun/ui/components/dialog'
import { Input } from '@codexsun/ui/components/input'
import { Textarea } from '@codexsun/ui/components/textarea'
import { useDeveloperTools } from './developer-tools.controller'
import {
  createGitPullRequest,
  deleteBranch,
  getBranches,
  getChangedFiles,
  getConflicts,
  getFileBlame,
  getFileDiff,
  getFileHistory,
  getRepositoryScripts,
  getStashes,
  resolveGitConflict,
  runRepositoryScriptTask,
  setChangeStaged,
  updateStash,
} from './developer-tools.services'
import type {
  GitBlameLine,
  GitBranchSummary,
  GitChangedFile,
  GitConflictFile,
  GitFileDiff,
  GitFileHistoryEntry,
  GitStashSummary,
} from './developer-tools.types'

type View = 'branches' | 'changes' | 'conflicts' | 'pull-request' | 'scripts' | 'stashes'
export function RepositoryWorkspace({
  onOpenChange,
  open,
}: {
  onOpenChange(value: boolean): void
  open: boolean
}) {
  const tools = useDeveloperTools()
  const [view, setView] = useState<View>('changes')
  const [files, setFiles] = useState<GitChangedFile[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [diff, setDiff] = useState<GitFileDiff | null>(null)
  const [history, setHistory] = useState<GitFileHistoryEntry[]>([])
  const [blame, setBlame] = useState<GitBlameLine[]>([])
  const [branches, setBranches] = useState<GitBranchSummary[]>([])
  const [stashes, setStashes] = useState<GitStashSummary[]>([])
  const [conflicts, setConflicts] = useState<GitConflictFile[]>([])
  const [scripts, setScripts] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const projectId = tools.projectId
  const load = useCallback(async () => {
    if (!projectId) return
    try {
      const changed = await getChangedFiles(projectId)
      setFiles(changed)
      const path =
        selected && changed.some((file) => file.path === selected)
          ? selected
          : (changed[0]?.path ?? null)
      setSelected(path)
      const selectedFile = changed.find((file) => file.path === path)
      setDiff(path ? await getFileDiff(projectId, path, isStagedOnly(selectedFile)) : null)
      const [nextBranches, nextStashes, nextConflicts, nextScripts] = await Promise.all([
        getBranches(projectId),
        getStashes(projectId),
        getConflicts(projectId),
        getRepositoryScripts(projectId),
      ])
      setBranches(nextBranches)
      setStashes(nextStashes)
      setConflicts(nextConflicts)
      setScripts(nextScripts)
      setError(null)
    } catch (reason) {
      setError(toMessage(reason))
    }
  }, [projectId, selected])
  useEffect(() => {
    if (open) void load()
  }, [load, open])
  async function selectFile(path: string) {
    if (!projectId) return
    setSelected(path)
    setDiff(
      await getFileDiff(projectId, path, isStagedOnly(files.find((file) => file.path === path))),
    )
    setHistory([])
    setBlame([])
  }
  async function stage(staged: boolean, hunk?: number) {
    if (!projectId || !selected) return
    await setChangeStaged(projectId, selected, staged, hunk)
    await tools.refresh()
    await load()
  }
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="h-[85vh] max-w-[92vw] overflow-hidden p-0 sm:max-w-6xl">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>Repository workspace</DialogTitle>
          <DialogDescription>
            Review, stage, test, recover, and deliver repository changes.
          </DialogDescription>
        </DialogHeader>
        <nav className="flex flex-wrap gap-1 border-b px-3 py-2">
          {(
            ['changes', 'conflicts', 'scripts', 'branches', 'stashes', 'pull-request'] as View[]
          ).map((item) => (
            <Button
              className="cursor-pointer capitalize"
              key={item}
              onClick={() => setView(item)}
              size="sm"
              variant={view === item ? 'secondary' : 'ghost'}
            >
              {item.replace('-', ' ')}
            </Button>
          ))}
          <Button
            aria-label="Refresh repository workspace"
            className="ml-auto cursor-pointer"
            onClick={() => void load()}
            size="icon-sm"
            variant="ghost"
          >
            <RefreshCw />
          </Button>
        </nav>
        <div className="min-h-0 flex-1 overflow-auto">
          {view === 'changes' ? (
            <Changes
              blame={blame}
              diff={diff}
              files={files}
              history={history}
              onBlame={() =>
                projectId && selected && void getFileBlame(projectId, selected).then(setBlame)
              }
              onHistory={() =>
                projectId && selected && void getFileHistory(projectId, selected).then(setHistory)
              }
              onSelect={(path) => void selectFile(path)}
              onStage={(staged, hunk) => void stage(staged, hunk)}
              selected={selected}
            />
          ) : null}
          {view === 'conflicts' ? (
            <Conflicts
              files={conflicts}
              onResolve={(file, resolution, content) =>
                projectId &&
                void resolveGitConflict(projectId, { content, path: file, resolution }).then(load)
              }
            />
          ) : null}
          {view === 'scripts' ? (
            <Scripts
              scripts={scripts}
              trusted={tools.effective?.trustedRepository ?? false}
              onRun={(script) => projectId && void runRepositoryScriptTask(projectId, script)}
            />
          ) : null}
          {view === 'branches' ? (
            <Branches
              branches={branches}
              onDelete={(branch) =>
                projectId && void deleteBranch(projectId, branch).then(setBranches)
              }
            />
          ) : null}
          {view === 'stashes' ? (
            <Stashes
              stashes={stashes}
              onChange={(input) => projectId && void updateStash(projectId, input).then(setStashes)}
            />
          ) : null}
          {view === 'pull-request' ? (
            <PullRequest
              enabled={tools.effective?.allowPullRequests ?? false}
              onCreate={(input) =>
                projectId
                  ? createGitPullRequest(projectId, input)
                  : Promise.reject(new Error('Select a project.'))
              }
            />
          ) : null}
        </div>
        {error ? <p className="border-t px-4 py-2 text-sm text-destructive">{error}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
function Changes({
  blame,
  diff,
  files,
  history,
  onBlame,
  onHistory,
  onSelect,
  onStage,
  selected,
}: {
  blame: GitBlameLine[]
  diff: GitFileDiff | null
  files: GitChangedFile[]
  history: GitFileHistoryEntry[]
  onBlame(): void
  onHistory(): void
  onSelect(path: string): void
  onStage(staged: boolean, hunk?: number): void
  selected: string | null
}) {
  return (
    <div className="grid h-full min-h-[32rem] grid-cols-[16rem_1fr]">
      <aside className="border-r p-2">
        {files.map((file) => (
          <button
            aria-current={selected === file.path ? 'page' : undefined}
            className="flex w-full cursor-pointer gap-2 rounded px-2 py-1.5 text-left text-xs hover:bg-muted aria-[current=page]:bg-muted"
            key={file.path}
            onClick={() => onSelect(file.path)}
            type="button"
          >
            <span className={file.conflict ? 'text-destructive' : 'text-orange-600'}>
              {file.indexStatus}
              {file.worktreeStatus}
            </span>
            <span className="truncate">{file.path}</span>
          </button>
        ))}
        {!files.length ? (
          <p className="p-2 text-sm text-muted-foreground">Working tree is clean.</p>
        ) : null}
      </aside>
      <section className="min-w-0">
        <header className="flex items-center gap-2 border-b px-3 py-2">
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {selected ?? 'Select a changed file'}
          </span>
          <Button disabled={!selected} onClick={() => onStage(true)} size="sm">
            Stage file
          </Button>
          <Button disabled={!selected} onClick={() => onStage(false)} size="sm" variant="outline">
            Unstage
          </Button>
          <Button disabled={!selected} onClick={onHistory} size="sm" variant="ghost">
            History
          </Button>
          <Button disabled={!selected} onClick={onBlame} size="sm" variant="ghost">
            Blame
          </Button>
        </header>
        {diff ? (
          <>
            <div className="grid h-[25rem] grid-cols-2 overflow-hidden">
              <Code title="Before" value={diff.before} />
              <Code title="Working tree" value={diff.after} />
            </div>
            {diff.hunks ? (
              <div className="flex flex-wrap gap-1 border-t p-2">
                {Array.from({ length: diff.hunks }, (_, index) => (
                  <Button
                    key={index}
                    onClick={() => onStage(!diff.staged, index)}
                    size="sm"
                    variant="outline"
                  >
                    {diff.staged ? 'Unstage' : 'Stage'} hunk {index + 1}
                  </Button>
                ))}
              </div>
            ) : null}
          </>
        ) : null}
        {history.length ? (
          <div className="border-t p-3 text-xs">
            <strong>File history</strong>
            {history.map((item) => (
              <div className="flex gap-3 py-1" key={item.hash}>
                <code>{item.shortHash}</code>
                <span className="truncate">{item.subject}</span>
                <span className="ml-auto text-muted-foreground">{item.author}</span>
              </div>
            ))}
          </div>
        ) : null}
        {blame.length ? (
          <div className="max-h-56 overflow-auto border-t font-mono text-xs">
            {blame.map((item) => (
              <div className="flex gap-2 px-3 py-0.5" key={`${item.commit}-${item.line}`}>
                <span className="w-8 text-right text-muted-foreground">{item.line}</span>
                <span className="w-20 truncate text-muted-foreground">{item.author}</span>
                <span className="whitespace-pre">{item.content}</span>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  )
}
function Code({ title, value }: { title: string; value: string }) {
  return (
    <div className="min-w-0 overflow-auto border-r last:border-r-0">
      <div className="sticky top-0 border-b bg-background px-3 py-1 text-xs font-medium">
        {title}
      </div>
      <pre className="p-3 text-xs">
        <code>{value || 'No content'}</code>
      </pre>
    </div>
  )
}
function Conflicts({
  files,
  onResolve,
}: {
  files: GitConflictFile[]
  onResolve(path: string, resolution: 'ours' | 'theirs' | 'manual', content?: string): void
}) {
  return (
    <div className="p-4">
      {files.map((file) => (
        <Conflict key={file.path} file={file} onResolve={onResolve} />
      ))}
      {!files.length ? <p className="text-sm text-muted-foreground">No merge conflicts.</p> : null}
    </div>
  )
}
function Conflict({
  file,
  onResolve,
}: {
  file: GitConflictFile
  onResolve(path: string, resolution: 'ours' | 'theirs' | 'manual', content?: string): void
}) {
  const [content, setContent] = useState(file.content)
  return (
    <div className="mb-3 rounded-lg border p-3">
      <strong className="text-sm">{file.path}</strong>
      <Textarea
        className="my-2 font-mono text-xs"
        onChange={(event) => setContent(event.target.value)}
        rows={10}
        value={content}
      />
      <div className="flex gap-2">
        <Button onClick={() => onResolve(file.path, 'ours')} size="sm" variant="outline">
          Use ours
        </Button>
        <Button onClick={() => onResolve(file.path, 'theirs')} size="sm" variant="outline">
          Use theirs
        </Button>
        <Button onClick={() => onResolve(file.path, 'manual', content)} size="sm">
          Save resolution
        </Button>
      </div>
    </div>
  )
}
function Scripts({
  onRun,
  scripts,
  trusted,
}: {
  onRun(script: string): void
  scripts: string[]
  trusted: boolean
}) {
  return (
    <div className="p-4">
      <p className="mb-3 text-sm text-muted-foreground">
        Only build, check, lint, test, and typecheck scripts are listed. Trust is required.
      </p>
      {scripts.map((script) => (
        <div className="flex items-center border-b py-2" key={script}>
          <code className="flex-1 text-sm">npm run {script}</code>
          <Button disabled={!trusted} onClick={() => onRun(script)} size="sm">
            <Play /> Run task
          </Button>
        </div>
      ))}
    </div>
  )
}
function Branches({
  branches,
  onDelete,
}: {
  branches: GitBranchSummary[]
  onDelete(branch: string): void
}) {
  return (
    <div className="p-4">
      {branches.map((branch) => (
        <div className="flex items-center border-b py-2" key={branch.name}>
          <span className="flex-1 text-sm">
            {branch.name}
            {branch.current ? ' · current' : ''}
          </span>
          <span className="mr-3 text-xs text-muted-foreground">
            {branch.merged ? 'merged' : 'unmerged'}
          </span>
          <Button
            aria-label={`Delete ${branch.name}`}
            disabled={branch.current || !branch.merged}
            onClick={() => onDelete(branch.name)}
            size="icon-xs"
            variant="ghost"
          >
            <Trash2 />
          </Button>
        </div>
      ))}
    </div>
  )
}
function Stashes({
  onChange,
  stashes,
}: {
  onChange(
    input: { action: 'create'; message: string } | { action: 'apply' | 'drop'; index: number },
  ): void
  stashes: GitStashSummary[]
}) {
  const [message, setMessage] = useState('')
  return (
    <div className="p-4">
      <div className="mb-4 flex gap-2">
        <Input
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Stash message"
          value={message}
        />
        <Button onClick={() => onChange({ action: 'create', message })}>
          <Archive /> Stash changes
        </Button>
      </div>
      {stashes.map((stash) => (
        <div className="flex items-center gap-2 border-b py-2" key={stash.reference}>
          <span className="flex-1 text-sm">{stash.message}</span>
          <Button
            onClick={() => onChange({ action: 'apply', index: stash.index })}
            size="sm"
            variant="outline"
          >
            Apply
          </Button>
          <Button
            onClick={() => onChange({ action: 'drop', index: stash.index })}
            size="sm"
            variant="ghost"
          >
            Drop
          </Button>
        </div>
      ))}
    </div>
  )
}
function PullRequest({
  enabled,
  onCreate,
}: {
  enabled: boolean
  onCreate(input: {
    base: string
    body: string
    draft: boolean
    title: string
  }): Promise<{ url: string }>
}) {
  const [base, setBase] = useState('main')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [url, setUrl] = useState('')
  return (
    <div className="mx-auto grid max-w-2xl gap-3 p-5">
      <Input
        onChange={(event) => setBase(event.target.value)}
        placeholder="Base branch"
        value={base}
      />
      <Input
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Pull request title"
        value={title}
      />
      <Textarea
        onChange={(event) => setBody(event.target.value)}
        placeholder="Summary and test plan"
        rows={8}
        value={body}
      />
      <Button
        disabled={!enabled || !title.trim()}
        onClick={() =>
          void onCreate({ base, body, draft: true, title }).then((result) => setUrl(result.url))
        }
      >
        <GitPullRequest /> Create draft pull request
      </Button>
      {!enabled ? (
        <p className="text-sm text-muted-foreground">
          Enable pull-request creation in project developer settings.
        </p>
      ) : null}
      {url ? (
        <a className="text-sm underline" href={url} rel="noreferrer" target="_blank">
          {url}
        </a>
      ) : null}
    </div>
  )
}
function toMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Repository tools are unavailable.'
}

function isStagedOnly(file?: GitChangedFile) {
  return Boolean(
    file && file.indexStatus !== ' ' && file.indexStatus !== '?' && file.worktreeStatus === ' ',
  )
}
