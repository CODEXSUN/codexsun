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
  useCreateZetroFindingMutation,
  useUpdateZetroFindingStatusMutation,
  useZetroFindingsQuery,
  useZetroRunsQuery,
  type ZetroCreateFindingPayload,
  type ZetroFinding,
} from "../api/zetro-api"

import { ZetroDataState, ZetroPanel, ZetroSectionIntro } from "./zetro-page-shell"

const findingCategories: ZetroFinding["category"][] = [
  "architecture",
  "bug",
  "test",
  "security",
  "type-design",
  "simplification",
  "convention",
  "ui",
]
const findingSeverities: ZetroFinding["severity"][] = [
  "medium",
  "critical",
  "high",
  "low",
  "info",
]
const findingStatuses: ZetroFinding["status"][] = [
  "open",
  "accepted",
  "dismissed",
  "fixed",
  "task-created",
]
const noRunValue = "__none__"

export function ZetroFindingsPage() {
  const findingsQuery = useZetroFindingsQuery()
  const runsQuery = useZetroRunsQuery()
  const createFindingMutation = useCreateZetroFindingMutation()
  const updateFindingStatusMutation = useUpdateZetroFindingStatusMutation()
  const findings = findingsQuery.data ?? []
  const runs = runsQuery.data ?? []
  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [runId, setRunId] = useState(noRunValue)
  const [category, setCategory] = useState<ZetroFinding["category"]>("architecture")
  const [severity, setSeverity] = useState<ZetroFinding["severity"]>("medium")
  const [confidence, setConfidence] = useState("90")

  function handleCreateFinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    createFindingMutation.mutate(
      {
        title,
        summary,
        runId: runId === noRunValue ? undefined : runId,
        category,
        severity,
        confidence: Number(confidence),
        status: "open",
      } satisfies ZetroCreateFindingPayload,
      {
        onSuccess: () => {
          setTitle("")
          setSummary("")
          setRunId(noRunValue)
          setCategory("architecture")
          setSeverity("medium")
          setConfidence("90")
        },
      }
    )
  }

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Findings"
        title="Review findings board"
        description="Persisted findings keep severity, confidence, category, status, run linkage, and follow-up readiness."
      />

      <ZetroDataState
        error={findingsQuery.error ?? runsQuery.error}
        isLoading={findingsQuery.isLoading || runsQuery.isLoading}
      />

      <ZetroPanel>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="font-semibold text-foreground">Create finding</p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Record a manual finding. It can be linked to a run now or left general.
            </p>
          </div>
          <form className="grid gap-3" onSubmit={handleCreateFinding}>
            <div className="grid gap-2 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="zetro-finding-title">Title</Label>
                <Input
                  id="zetro-finding-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Runner policy needs approval"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Run</Label>
                <Select value={runId} onValueChange={setRunId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={noRunValue}>No run</SelectItem>
                    {runs.map((run) => (
                      <SelectItem key={run.id} value={run.id}>
                        {run.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as ZetroFinding["category"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {findingCategories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select
                  value={severity}
                  onValueChange={(value) => setSeverity(value as ZetroFinding["severity"])}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {findingSeverities.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zetro-finding-confidence">Confidence</Label>
                <Input
                  id="zetro-finding-confidence"
                  value={confidence}
                  type="number"
                  min={0}
                  max={100}
                  onChange={(event) => setConfidence(event.target.value)}
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="zetro-finding-summary">Summary</Label>
              <Textarea
                id="zetro-finding-summary"
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Why this finding matters and what should happen next."
                required
              />
            </div>
            {createFindingMutation.error ? (
              <p className="text-sm text-destructive">{createFindingMutation.error.message}</p>
            ) : null}
            <Button type="submit" className="w-fit rounded-md" disabled={createFindingMutation.isPending}>
              Create finding
            </Button>
          </form>
        </CardContent>
      </ZetroPanel>

      <div className="grid gap-4 md:grid-cols-2">
        {findings.map((finding) => (
          <ZetroPanel key={finding.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{finding.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{finding.summary}</p>
                </div>
                <Badge variant={finding.severity === "high" ? "destructive" : "outline"} className="rounded-md">
                  {finding.severity}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="rounded-md">{finding.category}</Badge>
                <Badge variant="secondary" className="rounded-md">{finding.confidence}% confidence</Badge>
                <Badge variant="outline" className="rounded-md">{finding.status}</Badge>
                {finding.runId ? (
                  <Badge variant="outline" className="rounded-md">{finding.runId}</Badge>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {findingStatuses.map((status) => (
                  <Button
                    key={status}
                    variant={finding.status === status ? "secondary" : "outline"}
                    size="sm"
                    className="rounded-md"
                    disabled={updateFindingStatusMutation.isPending}
                    onClick={() =>
                      updateFindingStatusMutation.mutate({
                        findingId: finding.id,
                        status,
                      })
                    }
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </ZetroPanel>
        ))}
      </div>
    </div>
  )
}
