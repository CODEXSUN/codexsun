import { useState, type FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  useAppendZetroRunEventMutation,
  useCreateZetroRunMutation,
  useZetroPlaybooksQuery,
  useZetroRunQuery,
  useZetroRunsQuery,
  type ZetroCreateRunEventPayload,
  type ZetroCreateRunPayload,
  type ZetroRunEvent,
} from "../api/zetro-api"

import { ZetroDataState, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

const runStatuses: Array<NonNullable<ZetroCreateRunPayload["status"]>> = [
  "draft",
  "queued",
  "awaiting-approval",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
]
const runEventKinds: Array<NonNullable<ZetroCreateRunEventPayload["kind"]>> = [
  "note",
  "status",
  "approval",
  "finding",
  "command-proposal",
  "output",
]

export function ZetroRunsPage() {
  const runsQuery = useZetroRunsQuery()
  const playbooksQuery = useZetroPlaybooksQuery()
  const runs = runsQuery.data ?? []
  const playbooks = playbooksQuery.data ?? []
  const [requestedRunId, setRequestedRunId] = useState<string | null>(null)
  const selectedRunId = requestedRunId ?? runs[0]?.id ?? null
  const selectedRunQuery = useZetroRunQuery(selectedRunId)
  const createRunMutation = useCreateZetroRunMutation()
  const appendEventMutation = useAppendZetroRunEventMutation(selectedRunId)
  const [runTitle, setRunTitle] = useState("")
  const [runSummary, setRunSummary] = useState("")
  const [runPlaybookId, setRunPlaybookId] = useState("")
  const selectedPlaybookId = runPlaybookId || playbooks[0]?.id || ""
  const [runStatus, setRunStatus] = useState<NonNullable<ZetroCreateRunPayload["status"]>>("draft")
  const [eventKind, setEventKind] = useState<NonNullable<ZetroRunEvent["kind"]>>("note")
  const [eventSummary, setEventSummary] = useState("")
  const [eventDetail, setEventDetail] = useState("")
  const playbookNameById = new Map(playbooks.map((playbook) => [playbook.id, playbook.name]))

  function handleCreateRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    createRunMutation.mutate(
      {
        title: runTitle,
        playbookId: selectedPlaybookId,
        status: runStatus,
        summary: runSummary,
      },
      {
        onSuccess: (run) => {
          setRequestedRunId(run.id)
          setRunTitle("")
          setRunSummary("")
          setRunStatus("draft")
        },
      }
    )
  }

  function handleAppendEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    appendEventMutation.mutate(
      {
        kind: eventKind,
        summary: eventSummary,
        detail: eventDetail || undefined,
      },
      {
        onSuccess: () => {
          setEventKind("note")
          setEventSummary("")
          setEventDetail("")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Runs"
        title="Manual run console"
        description="Persisted manual runs keep output mode, status, playbook context, event timeline, and findings without command execution."
      />

      <ZetroDataState
        error={runsQuery.error ?? playbooksQuery.error ?? selectedRunQuery.error}
        isLoading={runsQuery.isLoading || playbooksQuery.isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <div className="space-y-4">
          <ZetroPanel>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="font-semibold text-foreground">Create run</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Start a manual Zetro run. This stores the run only.
                </p>
              </div>
              <form className="grid gap-3" onSubmit={handleCreateRun}>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-run-title">Title</Label>
                  <Input
                    id="zetro-run-title"
                    value={runTitle}
                    onChange={(event) => setRunTitle(event.target.value)}
                    placeholder="Review Zetro manual console"
                    required
                  />
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Playbook</Label>
                    <Select value={selectedPlaybookId} onValueChange={setRunPlaybookId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select playbook" />
                      </SelectTrigger>
                      <SelectContent>
                        {playbooks.map((playbook) => (
                          <SelectItem key={playbook.id} value={playbook.id}>
                            {playbook.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Status</Label>
                    <Select
                      value={runStatus}
                      onValueChange={(value) =>
                        setRunStatus(value as NonNullable<ZetroCreateRunPayload["status"]>)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {runStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-run-summary">Summary</Label>
                  <Textarea
                    id="zetro-run-summary"
                    value={runSummary}
                    onChange={(event) => setRunSummary(event.target.value)}
                    placeholder="What this manual run is tracking."
                    required
                  />
                </div>
                {createRunMutation.error ? (
                  <p className="text-sm text-destructive">{createRunMutation.error.message}</p>
                ) : null}
                <Button type="submit" className="w-fit rounded-md" disabled={createRunMutation.isPending}>
                  Create run
                </Button>
              </form>
            </CardContent>
          </ZetroPanel>

          <div className="grid gap-4 md:grid-cols-2">
            {runs.map((run) => (
              <ZetroPanel
                key={run.id}
                className={run.id === selectedRunId ? "border-primary/50" : ""}
              >
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-foreground">{run.title}</p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{run.summary}</p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {run.status}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-md border border-border/70 bg-background p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Playbook</p>
                      <p className="mt-1 text-sm text-foreground">{playbookNameById.get(run.playbookId) ?? run.playbookId}</p>
                    </div>
                    <div className="rounded-md border border-border/70 bg-background p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Output mode</p>
                      <p className="mt-1 text-sm text-foreground">{run.outputMode}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-md"
                    onClick={() => setRequestedRunId(run.id)}
                  >
                    Open run
                  </Button>
                </CardContent>
              </ZetroPanel>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <ZetroPanel>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">
                    {selectedRunQuery.data?.title ?? "Run detail"}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {selectedRunQuery.data?.summary ?? "Select a run to inspect timeline and findings."}
                  </p>
                </div>
                {selectedRunQuery.data ? (
                  <Badge variant="outline" className="rounded-md">
                    {selectedRunQuery.data.status}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Timeline</p>
                {(selectedRunQuery.data?.events ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events yet.</p>
                ) : null}
                {(selectedRunQuery.data?.events ?? []).map((event) => (
                  <div key={event.id} className="rounded-md border border-border/70 bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {event.sequence}. {event.kind}
                      </p>
                      <Badge variant="outline" className="rounded-md">
                        {new Date(event.createdAt).toLocaleString()}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.summary}</p>
                    {event.detail ? (
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{event.detail}</p>
                    ) : null}
                  </div>
                ))}
              </div>

              <form className="grid gap-3" onSubmit={handleAppendEvent}>
                <div className="grid gap-2">
                  <Label>Event kind</Label>
                  <Select
                    value={eventKind}
                    onValueChange={(value) => setEventKind(value as ZetroRunEvent["kind"])}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {runEventKinds.map((kind) => (
                        <SelectItem key={kind} value={kind}>
                          {kind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-event-summary">Event summary</Label>
                  <Input
                    id="zetro-event-summary"
                    value={eventSummary}
                    onChange={(event) => setEventSummary(event.target.value)}
                    placeholder="Manual note recorded."
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-event-detail">Detail</Label>
                  <Textarea
                    id="zetro-event-detail"
                    value={eventDetail}
                    onChange={(event) => setEventDetail(event.target.value)}
                    placeholder="Optional event detail."
                  />
                </div>
                {appendEventMutation.error ? (
                  <p className="text-sm text-destructive">{appendEventMutation.error.message}</p>
                ) : null}
                <Button
                  type="submit"
                  className="w-fit rounded-md"
                  disabled={!selectedRunId || appendEventMutation.isPending}
                >
                  Add event
                </Button>
              </form>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-foreground">Linked findings</p>
                {(selectedRunQuery.data?.findings ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No findings linked to this run.</p>
                ) : null}
                {(selectedRunQuery.data?.findings ?? []).map((finding) => (
                  <div key={finding.id} className="rounded-md border border-border/70 bg-background p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">{finding.title}</p>
                      <Badge variant="outline" className="rounded-md">
                        {finding.status}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.summary}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </ZetroPanel>
        </div>
      </div>
    </div>
  )
}
