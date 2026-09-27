import { useMutation, useQuery } from "@tanstack/react-query";
import { ClipboardListIcon, FileWarningIcon, Users2Icon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceSectionCard } from "@codexsun/ui/blocks/workspace";
import type {
  ClientDeliveryWorkspace,
  DeliveryStatus,
  ActionPriority,
  WorkPlanItem,
} from "../../../contracts/delivery";
import type { ClientWorkspace } from "../../../contracts/workspace";

const stages = ["brief", "design", "content", "development", "review", "launch"] as const;

export function ClientDeliveryWorkspaceView({ request, client }: { request: typeof fetch; client: ClientWorkspace }) {
  const delivery = useQuery({
    queryKey: ["sites", "delivery", client.slug],
    queryFn: () => readDelivery(request, client.slug),
  });
  const [reportOpen, setReportOpen] = useState(false);
  const [handoffOpen, setHandoffOpen] = useState(false);
  if (delivery.isPending) return <p className="text-sm text-muted-foreground">Loading delivery workspace…</p>;
  if (delivery.isError || !delivery.data)
    return <p className="text-sm text-amber-800">Delivery workspace is unavailable.</p>;
  const data = delivery.data;
  const done = data.workPlan.filter((item) => item.status === "done").length;
  return (
    <div className="mt-6 space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <WorkspaceSectionCard
          title="Handoff brief"
          description="The next developer can start here without changing another client lane."
        >
          <div className="space-y-3 text-sm">
            <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
              {data.handoff.brief || "Add the client brief, approved direction, and requested scope."}
            </p>
            <div className="flex flex-wrap gap-2">
              {data.handoff.successCriteria.length ? (
                data.handoff.successCriteria.map((item) => (
                  <Badge key={item} variant="outline">
                    {item}
                  </Badge>
                ))
              ) : (
                <Badge variant="outline">Acceptance criteria pending</Badge>
              )}
            </div>
            <Button size="sm" variant="outline" onClick={() => setHandoffOpen((open) => !open)}>
              {handoffOpen ? "Close handoff editor" : "Edit handoff notes"}
            </Button>
            {handoffOpen && (
              <HandoffEditor
                request={request}
                client={client}
                handoff={data.handoff}
                onSaved={() => {
                  void delivery.refetch();
                  setHandoffOpen(false);
                }}
              />
            )}
          </div>
        </WorkspaceSectionCard>
        <WorkspaceSectionCard title="Delivery pulse" description="A compact view of work remaining for this client.">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <Pulse icon={ClipboardListIcon} value={`${done}/${data.workPlan.length}`} label="tasks done" />
            <Pulse icon={FileWarningIcon} value={String(data.actionReports.length)} label="reports" />
            <Pulse icon={Users2Icon} value={String(data.developers.length)} label="developers" />
          </div>
        </WorkspaceSectionCard>
      </div>
      <WorkspaceSectionCard
        title="Work plan"
        description="Assign each stage to the right developer and update it as the client request moves forward."
      >
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => (
            <PlanLane
              key={stage}
              stage={stage}
              items={data.workPlan.filter((item) => item.stage === stage)}
              developers={data.developers}
              request={request}
              onUpdated={() => void delivery.refetch()}
            />
          ))}
        </div>
      </WorkspaceSectionCard>
      <WorkspaceSectionCard
        title="Action reports"
        description="Capture client requests, blockers, decisions, and follow-up actions in this client only."
        action={
          <Button size="sm" onClick={() => setReportOpen((open) => !open)}>
            {reportOpen ? "Close" : "Add report"}
          </Button>
        }
      >
        {reportOpen && (
          <ReportEditor
            request={request}
            client={client}
            developers={data.developers}
            onSaved={() => {
              void delivery.refetch();
              setReportOpen(false);
            }}
          />
        )}
        <div className="mt-4 space-y-2">
          {data.actionReports.length ? (
            data.actionReports.map((report) => (
              <div className="rounded-xl border border-border p-3" key={report.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{report.title}</p>
                  <Badge variant={report.priority === "urgent" ? "destructive" : "outline"}>{report.priority}</Badge>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{report.summary}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              No action reports yet. Add the first client request or blocker.
            </p>
          )}
        </div>
      </WorkspaceSectionCard>
    </div>
  );
}

function PlanLane({
  stage,
  items,
  developers,
  request,
  onUpdated,
}: {
  stage: string;
  items: WorkPlanItem[];
  developers: ClientDeliveryWorkspace["developers"];
  request: typeof fetch;
  onUpdated: () => void;
}) {
  return (
    <div className="rounded-xl border border-border p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{stage}</p>
      <div className="mt-3 space-y-3">
        {items.map((item) => (
          <PlanItem key={item.id} item={item} developers={developers} request={request} onUpdated={onUpdated} />
        ))}
      </div>
    </div>
  );
}

function PlanItem({
  item,
  developers,
  request,
  onUpdated,
}: {
  item: WorkPlanItem;
  developers: ClientDeliveryWorkspace["developers"];
  request: typeof fetch;
  onUpdated: () => void;
}) {
  const update = useMutation({
    mutationFn: (body: { status?: DeliveryStatus; assigneeId?: string | null }) =>
      request(`/api/v1/sites/workspaces/${item.clientSlug}/work-plan/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: onUpdated,
  });
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <p className="text-sm font-medium">{item.title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.details}</p>
      <div className="mt-3 grid gap-2">
        <label className="sr-only" htmlFor={`${item.id}-status`}>
          Status
        </label>
        <select
          id={`${item.id}-status`}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          value={item.status}
          onChange={(event) => update.mutate({ status: event.target.value as DeliveryStatus })}
        >
          {["todo", "in-progress", "blocked", "done"].map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor={`${item.id}-assignee`}>
          Assignee
        </label>
        <select
          id={`${item.id}-assignee`}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
          value={item.assigneeId ?? ""}
          onChange={(event) => update.mutate({ assigneeId: event.target.value || null })}
        >
          <option value="">Unassigned</option>
          {developers.map((developer) => (
            <option key={developer.id} value={developer.id}>
              {developer.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function ReportEditor({
  request,
  client,
  developers,
  onSaved,
}: {
  request: typeof fetch;
  client: ClientWorkspace;
  developers: ClientDeliveryWorkspace["developers"];
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [priority, setPriority] = useState<ActionPriority>("normal");
  const [ownerId, setOwnerId] = useState("");
  const save = useMutation({
    mutationFn: () =>
      request(`/api/v1/sites/workspaces/${client.slug}/action-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, priority, ownerId: ownerId || undefined }),
      }),
    onSuccess: onSaved,
  });
  return (
    <div className="grid gap-2 rounded-xl border border-dashed border-border p-3 md:grid-cols-2">
      <input
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Report title"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
      />
      <select
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={priority}
        onChange={(event) => setPriority(event.target.value as ActionPriority)}
      >
        {["low", "normal", "high", "urgent"].map((value) => (
          <option key={value}>{value}</option>
        ))}
      </select>
      <textarea
        className="min-h-20 rounded-md border border-border bg-background px-3 py-2 text-sm md:col-span-2"
        placeholder="What changed, what is blocked, or what did the client request?"
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
      />
      <select
        className="rounded-md border border-border bg-background px-3 py-2 text-sm"
        value={ownerId}
        onChange={(event) => setOwnerId(event.target.value)}
      >
        <option value="">Owner</option>
        {developers.map((developer) => (
          <option key={developer.id} value={developer.id}>
            {developer.name}
          </option>
        ))}
      </select>
      <Button disabled={!title.trim() || !summary.trim() || save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save report"}
      </Button>
    </div>
  );
}

function HandoffEditor({
  request,
  client,
  handoff,
  onSaved,
}: {
  request: typeof fetch;
  client: ClientWorkspace;
  handoff: ClientDeliveryWorkspace["handoff"];
  onSaved: () => void;
}) {
  const [brief, setBrief] = useState(handoff.brief);
  const [criteria, setCriteria] = useState(handoff.successCriteria.join("\n"));
  const [assets, setAssets] = useState(handoff.assets.join("\n"));
  const [accessNotes, setAccessNotes] = useState(handoff.accessNotes);
  const save = useMutation({
    mutationFn: () =>
      request(`/api/v1/sites/workspaces/${client.slug}/handoff`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, successCriteria: lines(criteria), assets: lines(assets), accessNotes }),
      }),
    onSuccess: onSaved,
  });
  return (
    <div className="mt-3 grid gap-2">
      <textarea
        className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Client brief"
        value={brief}
        onChange={(event) => setBrief(event.target.value)}
      />
      <textarea
        className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Success criteria, one per line"
        value={criteria}
        onChange={(event) => setCriteria(event.target.value)}
      />
      <textarea
        className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Assets and links, one per line"
        value={assets}
        onChange={(event) => setAssets(event.target.value)}
      />
      <textarea
        className="min-h-16 rounded-md border border-border bg-background px-3 py-2 text-sm"
        placeholder="Access notes"
        value={accessNotes}
        onChange={(event) => setAccessNotes(event.target.value)}
      />
      <Button disabled={save.isPending} onClick={() => save.mutate()}>
        {save.isPending ? "Saving…" : "Save handoff"}
      </Button>
    </div>
  );
}

function Pulse({ icon: Icon, value, label }: { icon: typeof ClipboardListIcon; value: string; label: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <Icon className="mx-auto size-4 text-muted-foreground" />
      <p className="mt-2 font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
function lines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
async function readDelivery(request: typeof fetch, slug: string): Promise<ClientDeliveryWorkspace> {
  const response = await request(`/api/v1/sites/workspaces/${slug}/delivery`);
  if (!response.ok) throw new Error("Delivery request failed");
  return response.json() as Promise<ClientDeliveryWorkspace>;
}
