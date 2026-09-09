import { useEffect, useState, type FormEvent } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileClock,
  GitMerge,
  GitPullRequestArrow,
  LoaderCircle,
  PackageCheck,
  Rocket,
} from 'lucide-react'
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
import { useGitDelivery } from './git-delivery.controller'
import type { DatabaseUpdateChoice, DeliverySyncStrategy } from './git-delivery.types'

const syncOptions = [
  { label: 'Pull with rebase', value: 'rebase' },
  { label: 'Pull with merge', value: 'merge' },
  { label: 'Do not pull', value: 'none' },
]
const databaseOptions = [
  { label: 'Auto detect', value: 'auto' },
  { label: 'Database update', value: 'yes' },
  { label: 'No database update', value: 'no' },
]

export function GitDeliveryFlowBuilder() {
  const delivery = useGitDelivery()
  const [expanded, setExpanded] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [title, setTitle] = useState('Release changes')
  const [note, setNote] = useState('Updated Zetro coding tools and delivery workflow.')
  const [commitMessage, setCommitMessage] = useState('')
  const [writeChangelog, setWriteChangelog] = useState(true)
  const [bumpVersion, setBumpVersion] = useState(true)
  const [push, setPush] = useState(true)
  const [syncStrategy, setSyncStrategy] = useState<DeliverySyncStrategy>('rebase')
  const [databaseUpdate, setDatabaseUpdate] = useState<DatabaseUpdateChoice>('auto')

  useEffect(() => {
    if (!delivery.effective) return
    setWriteChangelog(delivery.effective.defaultChangelog)
    setBumpVersion(delivery.effective.defaultVersionBump)
    setPush(delivery.effective.defaultPush)
    setSyncStrategy(delivery.effective.defaultSyncStrategy)
    setDatabaseUpdate(delivery.effective.defaultDatabaseUpdate)
  }, [delivery.effective])

  useEffect(() => {
    if (delivery.preview) setCommitMessage(delivery.preview.suggestedCommitMessage)
  }, [delivery.preview])

  if (!delivery.effective?.enabled) return null
  const preview = delivery.preview
  const latestFlow = delivery.flows[0]

  function changeTitle(nextTitle: string) {
    setTitle(nextTitle)
    const targetVersion = bumpVersion ? preview?.nextVersion : preview?.currentVersion
    const reference = targetVersion?.split('.')[2]
    setCommitMessage(reference ? `#${reference} - ${nextTitle}` : nextTitle)
  }

  function review(event: FormEvent) {
    event.preventDefault()
    void delivery
      .refresh(title)
      .then(() => setConfirmOpen(true))
      .catch(() => undefined)
  }

  function run() {
    if (!preview) return
    void delivery
      .run({
        bumpVersion: bumpVersion && preview.canBumpVersion,
        commitMessage,
        databaseUpdate,
        expectedFiles: preview.changedFiles,
        expectedHead: preview.head,
        note,
        push,
        syncStrategy,
        title,
        writeChangelog: writeChangelog && preview.canWriteChangelog,
      })
      .then(() => setExpanded(false))
      .catch(() => undefined)
  }

  return (
    <section className="border-b bg-muted/20 p-2" aria-label="Git delivery flow">
      <div className="flex items-center gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
          <Rocket className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">GitHub now</div>
          <div className="truncate text-xs text-muted-foreground">
            {preview?.githubUrl ?? 'No GitHub remote'}
          </div>
        </div>
        <Button
          aria-label={expanded ? 'Close delivery flow' : 'Open delivery flow'}
          className="cursor-pointer"
          onClick={() => setExpanded((value) => !value)}
          size="icon-xs"
          variant="ghost"
        >
          {expanded ? <ChevronUp /> : <ChevronDown />}
        </Button>
      </div>
      {expanded ? (
        <form className="grid gap-3 pt-3" onSubmit={review}>
          <Input
            aria-label="Release title"
            maxLength={160}
            onChange={(event) => changeTitle(event.target.value)}
            placeholder="Release title"
            value={title}
          />
          <FlowStep icon={FileClock} label="1. Changelog">
            <Switch
              aria-label="Write changelog"
              checked={writeChangelog}
              disabled={!preview?.canWriteChangelog}
              onCheckedChange={setWriteChangelog}
            />
          </FlowStep>
          {writeChangelog ? (
            <Textarea
              aria-label="Changelog note"
              maxLength={2000}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Describe the completed change"
              rows={2}
              value={note}
            />
          ) : null}
          <FlowStep icon={PackageCheck} label="2. Version update">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {preview?.currentVersion ?? '—'} → {preview?.nextVersion ?? '—'}
              </span>
              <Switch
                aria-label="Update version"
                checked={bumpVersion}
                disabled={!preview?.canBumpVersion}
                onCheckedChange={setBumpVersion}
              />
            </div>
          </FlowStep>
          {(bumpVersion || writeChangelog) && (
            <Select
              items={databaseOptions}
              onValueChange={(value) => value && setDatabaseUpdate(value as DatabaseUpdateChoice)}
              value={databaseUpdate}
            >
              <SelectTrigger size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {databaseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <FlowStep icon={GitMerge} label="3. Pull strategy">
            <Select
              items={syncOptions}
              onValueChange={(value) => value && setSyncStrategy(value as DeliverySyncStrategy)}
              value={syncStrategy}
            >
              <SelectTrigger className="w-40" size="sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {syncOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FlowStep>
          <FlowStep icon={GitPullRequestArrow} label="4. Commit and push">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              Push
              <Switch aria-label="Push after commit" checked={push} onCheckedChange={setPush} />
            </label>
          </FlowStep>
          <Input
            aria-label="Commit message"
            maxLength={500}
            onChange={(event) => setCommitMessage(event.target.value)}
            placeholder="Commit message"
            value={commitMessage}
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{preview?.changedFiles.length ?? 0} reviewed files</span>
            <span>·</span>
            <span>{preview?.branch ?? 'Reading branch'}</span>
          </div>
          {latestFlow ? (
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2
                className={
                  latestFlow.status === 'complete'
                    ? 'size-4 text-emerald-600'
                    : 'size-4 text-destructive'
                }
              />
              <span className="truncate">
                Last system task: {latestFlow.status} · {latestFlow.input.title}
              </span>
            </div>
          ) : null}
          <Button
            className="w-full cursor-pointer"
            disabled={delivery.busy || !title.trim() || !note.trim() || !commitMessage.trim()}
            type="submit"
          >
            {delivery.busy ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}
            Review system task
          </Button>
          {delivery.error ? <p className="text-xs text-destructive">{delivery.error}</p> : null}
        </form>
      ) : null}
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run Git delivery system task?</AlertDialogTitle>
            <AlertDialogDescription>
              Zetro will update the selected release files, pull with {syncStrategy}, commit{' '}
              {preview?.changedFiles.length ?? 0} reviewed files, and{' '}
              {push ? 'push' : 'stop locally'}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-44 overflow-y-auto rounded-lg bg-muted p-3 text-xs">
            {preview?.changedFiles.map((file) => (
              <div key={file}>{file}</div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={run}>Run system task</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

function FlowStep({
  children,
  icon: Icon,
  label,
}: {
  children: React.ReactNode
  icon: typeof FileClock
  label: string
}) {
  return (
    <div className="flex min-h-9 items-center gap-2">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
      <div className="shrink-0">{children}</div>
    </div>
  )
}
