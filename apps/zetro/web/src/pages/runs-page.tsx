import { useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useAppendZetroRunEventMutation,
  useCreateZetroCommandProposalMutation,
  useCreateZetroOutputSectionMutation,
  useCreateZetroRunMutation,
  useUpdateZetroCommandProposalStatusMutation,
  useZetroPlaybooksQuery,
  useZetroRunQuery,
  useZetroRunsQuery,
  type ZetroCreateRunEventPayload,
  type ZetroCreateRunPayload,
  type ZetroRunEvent,
} from "../api/zetro-api";

import {
  ZetroDataState,
  ZetroPanel,
  ZetroSectionIntro,
} from "./zetro-page-shell";

const runStatuses: Array<NonNullable<ZetroCreateRunPayload["status"]>> = [
  "draft",
  "queued",
  "awaiting-approval",
  "running",
  "blocked",
  "completed",
  "failed",
  "cancelled",
];
const runEventKinds: Array<NonNullable<ZetroCreateRunEventPayload["kind"]>> = [
  "note",
  "status",
  "approval",
  "finding",
  "command-proposal",
  "output",
];
const outputModeSections: Record<string, string[]> = {
  brief: ["Answer", "Next action"],
  normal: ["Summary", "Files", "Steps"],
  detailed: ["Context", "Plan", "Files", "Tests", "Risks"],
  maximum: [
    "Intent",
    "Repo context",
    "Architecture",
    "Implementation plan",
    "Database impact",
    "API impact",
    "UI impact",
    "Risk register",
    "Test plan",
    "Done criteria",
  ],
  audit: [
    "Intent",
    "Assumptions",
    "Approvals",
    "Command log",
    "Findings",
    "Decisions",
    "Follow ups",
  ],
};

export function ZetroRunsPage() {
  const runsQuery = useZetroRunsQuery();
  const playbooksQuery = useZetroPlaybooksQuery();
  const runs = runsQuery.data ?? [];
  const playbooks = playbooksQuery.data ?? [];
  const [requestedRunId, setRequestedRunId] = useState<string | null>(null);
  const selectedRunId = requestedRunId ?? runs[0]?.id ?? null;
  const selectedRunQuery = useZetroRunQuery(selectedRunId);
  const createRunMutation = useCreateZetroRunMutation();
  const appendEventMutation = useAppendZetroRunEventMutation(selectedRunId);
  const createOutputSectionMutation =
    useCreateZetroOutputSectionMutation(selectedRunId);
  const createCommandProposalMutation =
    useCreateZetroCommandProposalMutation(selectedRunId);
  const updateCommandProposalStatusMutation =
    useUpdateZetroCommandProposalStatusMutation(selectedRunId);
  const [runTitle, setRunTitle] = useState("");
  const [runSummary, setRunSummary] = useState("");
  const [runPlaybookId, setRunPlaybookId] = useState("");
  const selectedPlaybookId = runPlaybookId || playbooks[0]?.id || "";
  const [runStatus, setRunStatus] =
    useState<NonNullable<ZetroCreateRunPayload["status"]>>("draft");
  const [eventKind, setEventKind] =
    useState<NonNullable<ZetroRunEvent["kind"]>>("note");
  const [eventSummary, setEventSummary] = useState("");
  const [eventDetail, setEventDetail] = useState("");
  const [outputSection, setOutputSection] = useState("");
  const [outputContent, setOutputContent] = useState("");
  const [proposalCommand, setProposalCommand] = useState("");
  const [proposalArgs, setProposalArgs] = useState("");
  const [proposalSummary, setProposalSummary] = useState("");
  const [proposalRationale, setProposalRationale] = useState("");
  const playbookNameById = new Map(
    playbooks.map((playbook) => [playbook.id, playbook.name]),
  );

  function handleCreateRun(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createRunMutation.mutate(
      {
        title: runTitle,
        playbookId: selectedPlaybookId,
        status: runStatus,
        summary: runSummary,
      },
      {
        onSuccess: (run) => {
          setRequestedRunId(run.id);
          setRunTitle("");
          setRunSummary("");
          setRunStatus("draft");
        },
      },
    );
  }

  function handleAppendEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    appendEventMutation.mutate(
      {
        kind: eventKind,
        summary: eventSummary,
        detail: eventDetail || undefined,
      },
      {
        onSuccess: () => {
          setEventKind("note");
          setEventSummary("");
          setEventDetail("");
        },
      },
    );
  }

  function handleCreateOutputSection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createOutputSectionMutation.mutate(
      {
        section: outputSection,
        content: outputContent,
      },
      {
        onSuccess: () => {
          setOutputSection("");
          setOutputContent("");
        },
      },
    );
  }

  function fillTemplateSection(section: string) {
    setOutputSection(section);
    setOutputContent(`[${section}]\n\n`);
  }

  function handleCreateCommandProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const args = proposalArgs
      .split(" ")
      .map((a) => a.trim())
      .filter((a) => a.length > 0);
    createCommandProposalMutation.mutate(
      {
        command: proposalCommand,
        args,
        summary: proposalSummary,
        rationale: proposalRationale,
      },
      {
        onSuccess: () => {
          setProposalCommand("");
          setProposalArgs("");
          setProposalSummary("");
          setProposalRationale("");
        },
      },
    );
  }

  function handleApproveProposal(proposalId: string) {
    updateCommandProposalStatusMutation.mutate({
      proposalId,
      payload: { status: "approved", reviewedBy: "operator" },
    });
  }

  function handleRejectProposal(proposalId: string) {
    updateCommandProposalStatusMutation.mutate({
      proposalId,
      payload: { status: "rejected", reviewedBy: "operator" },
    });
  }

  return (
    <div className="space-y-4">
      <ZetroSectionIntro
        eyebrow="Runs"
        title="Manual run console"
        description="Persisted manual runs keep output mode, status, playbook context, event timeline, and findings without command execution."
      />

      <ZetroDataState
        error={
          runsQuery.error ?? playbooksQuery.error ?? selectedRunQuery.error
        }
        isLoading={runsQuery.isLoading || playbooksQuery.isLoading}
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <div className="space-y-4">
          <ZetroPanel>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-foreground font-semibold">Create run</p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
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
                    <Select
                      value={selectedPlaybookId}
                      onValueChange={setRunPlaybookId}
                    >
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
                        setRunStatus(
                          value as NonNullable<ZetroCreateRunPayload["status"]>,
                        )
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
                  <p className="text-destructive text-sm">
                    {createRunMutation.error.message}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-fit rounded-md"
                  disabled={createRunMutation.isPending}
                >
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
                      <p className="text-foreground font-semibold">
                        {run.title}
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {run.summary}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-md">
                      {run.status}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="border-border/70 bg-background rounded-md border p-3">
                      <p className="text-muted-foreground text-xs font-semibold uppercase">
                        Playbook
                      </p>
                      <p className="text-foreground mt-1 text-sm">
                        {playbookNameById.get(run.playbookId) ?? run.playbookId}
                      </p>
                    </div>
                    <div className="border-border/70 bg-background rounded-md border p-3">
                      <p className="text-muted-foreground text-xs font-semibold uppercase">
                        Output mode
                      </p>
                      <p className="text-foreground mt-1 text-sm">
                        {run.outputMode}
                      </p>
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
                  <p className="text-foreground font-semibold">
                    {selectedRunQuery.data?.title ?? "Run detail"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    {selectedRunQuery.data?.summary ??
                      "Select a run to inspect timeline and findings."}
                  </p>
                </div>
                {selectedRunQuery.data ? (
                  <Badge variant="outline" className="rounded-md">
                    {selectedRunQuery.data.status}
                  </Badge>
                ) : null}
              </div>

              <div className="space-y-3">
                <p className="text-foreground text-sm font-semibold">
                  Timeline
                </p>
                {(selectedRunQuery.data?.events ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No events yet.
                  </p>
                ) : null}
                {(selectedRunQuery.data?.events ?? []).map((event) => (
                  <div
                    key={event.id}
                    className="border-border/70 bg-background rounded-md border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {event.sequence}. {event.kind}
                      </p>
                      <Badge variant="outline" className="rounded-md">
                        {new Date(event.createdAt).toLocaleString()}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {event.summary}
                    </p>
                    {event.detail ? (
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {event.detail}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>

              <form className="grid gap-3" onSubmit={handleAppendEvent}>
                <div className="grid gap-2">
                  <Label>Event kind</Label>
                  <Select
                    value={eventKind}
                    onValueChange={(value) =>
                      setEventKind(value as ZetroRunEvent["kind"])
                    }
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
                  <p className="text-destructive text-sm">
                    {appendEventMutation.error.message}
                  </p>
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
                <p className="text-foreground text-sm font-semibold">
                  Linked findings
                </p>
                {(selectedRunQuery.data?.findings ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No findings linked to this run.
                  </p>
                ) : null}
                {(selectedRunQuery.data?.findings ?? []).map((finding) => (
                  <div
                    key={finding.id}
                    className="border-border/70 bg-background rounded-md border p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-foreground text-sm font-semibold">
                        {finding.title}
                      </p>
                      <Badge variant="outline" className="rounded-md">
                        {finding.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                      {finding.summary}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <p className="text-foreground text-sm font-semibold">
                  Output sections
                </p>
                {(selectedRunQuery.data?.outputSections ?? []).length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No output sections yet.
                  </p>
                ) : null}
                {(selectedRunQuery.data?.outputSections ?? []).map(
                  (section) => (
                    <div
                      key={section.id}
                      className="border-border/70 bg-background rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-foreground text-sm font-semibold">
                          {section.sequence}. {section.section}
                        </p>
                        <Badge variant="secondary" className="rounded-md">
                          {new Date(section.createdAt).toLocaleString()}
                        </Badge>
                      </div>
                      <pre className="text-muted-foreground mt-2 font-mono text-sm leading-6 whitespace-pre-wrap">
                        {section.content}
                      </pre>
                    </div>
                  ),
                )}
              </div>

              <form className="grid gap-3" onSubmit={handleCreateOutputSection}>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-output-section">Section</Label>
                  <Select
                    value={outputSection}
                    onValueChange={setOutputSection}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(outputModeSections).flatMap(
                        ([mode, sections]) =>
                          sections.map((section) => (
                            <SelectItem
                              key={`${mode}:${section}`}
                              value={`${mode}:${section}`}
                            >
                              {section} ({mode})
                            </SelectItem>
                          )),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outputSection &&
                    outputModeSections[outputSection.split(":")[0]]?.map(
                      (s) => (
                        <Button
                          key={s}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-md text-xs"
                          onClick={() =>
                            fillTemplateSection(
                              `${outputSection.split(":")[0]}:${s}`,
                            )
                          }
                        >
                          {s}
                        </Button>
                      ),
                    )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-output-content">Content</Label>
                  <Textarea
                    id="zetro-output-content"
                    value={outputContent}
                    onChange={(e) => setOutputContent(e.target.value)}
                    placeholder="Structured output content for this section."
                    className="min-h-[120px] font-mono text-sm"
                  />
                </div>
                {createOutputSectionMutation.error ? (
                  <p className="text-destructive text-sm">
                    {createOutputSectionMutation.error.message}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-fit rounded-md"
                  disabled={
                    !selectedRunId ||
                    !outputSection ||
                    createOutputSectionMutation.isPending
                  }
                >
                  Add section
                </Button>
              </form>

              <div className="space-y-3">
                <p className="text-foreground text-sm font-semibold">
                  Command proposals
                </p>
                {(selectedRunQuery.data?.commandProposals ?? []).length ===
                0 ? (
                  <p className="text-muted-foreground text-sm">
                    No command proposals yet.
                  </p>
                ) : null}
                {(selectedRunQuery.data?.commandProposals ?? []).map(
                  (proposal) => (
                    <div
                      key={proposal.id}
                      className="border-border/70 bg-background rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-foreground text-sm font-semibold">
                          {proposal.command} {proposal.args.join(" ")}
                        </p>
                        <Badge
                          variant={
                            proposal.status === "approved"
                              ? "default"
                              : proposal.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="rounded-md"
                        >
                          {proposal.status}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {proposal.summary}
                      </p>
                      {proposal.rationale ? (
                        <p className="text-muted-foreground mt-1 text-sm leading-6 italic">
                          {proposal.rationale}
                        </p>
                      ) : null}
                      {proposal.status === "pending" ? (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-md"
                            disabled={
                              updateCommandProposalStatusMutation.isPending
                            }
                            onClick={() => handleApproveProposal(proposal.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-md"
                            disabled={
                              updateCommandProposalStatusMutation.isPending
                            }
                            onClick={() => handleRejectProposal(proposal.id)}
                          >
                            Reject
                          </Button>
                        </div>
                      ) : null}
                      {proposal.reviewedAt ? (
                        <p className="text-muted-foreground mt-2 text-xs">
                          Reviewed:{" "}
                          {new Date(proposal.reviewedAt).toLocaleString()}
                          {proposal.reviewedBy
                            ? ` by ${proposal.reviewedBy}`
                            : ""}
                        </p>
                      ) : null}
                    </div>
                  ),
                )}
              </div>

              <form
                className="grid gap-3"
                onSubmit={handleCreateCommandProposal}
              >
                <div>
                  <p className="text-foreground text-sm font-semibold">
                    Propose command
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs leading-6">
                    No execution happens. Proposals stay pending until approved.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-proposal-command">Command</Label>
                  <Input
                    id="zetro-proposal-command"
                    value={proposalCommand}
                    onChange={(e) => setProposalCommand(e.target.value)}
                    placeholder="npm"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-proposal-args">Args</Label>
                  <Input
                    id="zetro-proposal-args"
                    value={proposalArgs}
                    onChange={(e) => setProposalArgs(e.target.value)}
                    placeholder="run build"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-proposal-summary">Summary</Label>
                  <Input
                    id="zetro-proposal-summary"
                    value={proposalSummary}
                    onChange={(e) => setProposalSummary(e.target.value)}
                    placeholder="What this command does"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="zetro-proposal-rationale">Rationale</Label>
                  <Textarea
                    id="zetro-proposal-rationale"
                    value={proposalRationale}
                    onChange={(e) => setProposalRationale(e.target.value)}
                    placeholder="Why this command is needed"
                    className="min-h-[60px]"
                  />
                </div>
                {createCommandProposalMutation.error ? (
                  <p className="text-destructive text-sm">
                    {createCommandProposalMutation.error.message}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="w-fit rounded-md"
                  disabled={
                    !selectedRunId ||
                    !proposalCommand ||
                    !proposalSummary ||
                    createCommandProposalMutation.isPending
                  }
                >
                  Propose command
                </Button>
              </form>
            </CardContent>
          </ZetroPanel>
        </div>
      </div>
    </div>
  );
}
