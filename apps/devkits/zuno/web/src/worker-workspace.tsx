import { useEffect, useMemo, useState } from "react";
import { Trash2Icon } from "lucide-react";
import { MainWorkspace } from "@codexsun/ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@codexsun/ui/components/alert-dialog";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import { controlClient, webUrl, type Server, type Snapshot } from "./control-api";
import { WorkspaceCreatePage, type WorkspaceProfile, type WorkspaceProfileInput, type WorkspaceProvisionInput } from "./workspace-create-page";

interface Operation { id: string; name: string; status: string; serverId?: string; taskId?: string; containerId?: string; ports?: number[]; error?: string; }
interface Command { id: string; title: string; status: string; report: string; previewUrl?: string; tools?: { results?: { output: string; exitCode: number }[] }; }
type Page = "workers" | "new";

export function WorkerWorkspace({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const client = useMemo(() => controlClient(request), [request]);
  const [page, setPage] = useState<Page>(currentPage());
  const [servers, setServers] = useState<Server[]>([]);
  const [profiles, setProfiles] = useState<WorkspaceProfile[]>([]);
  const [selected, setSelected] = useState<Server>();
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [operation, setOperation] = useState<Operation>();
  const [command, setCommand] = useState<Command>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [dropCandidate, setDropCandidate] = useState<Server>();
  const [script, setScript] = useState("git status --short && pwd");

  async function portal<T>(path: string, body?: unknown): Promise<T> {
    const response = await request(`${import.meta.env.VITE_ZUNO_API_URL ?? ""}/api/v1/zuno/control${path}`, { method: body ? "POST" : "GET", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result as T;
  }

  async function refresh() {
    const [result, savedProfiles] = await Promise.all([client<{ servers: Server[] }>(), portal<WorkspaceProfile[]>("/workspace-profiles")]);
    setServers(result.servers);
    setProfiles(savedProfiles);
    const entries = await Promise.all(result.servers.map(async (server) => [server.id, await client<Snapshot>(`/${server.id}/snapshot`)] as const));
    setSnapshots(Object.fromEntries(entries));
    setError("");
  }

  useEffect(() => {
    const updatePage = () => setPage(currentPage());
    window.addEventListener("hashchange", updatePage);
    return () => window.removeEventListener("hashchange", updatePage);
  }, []);

  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        await refresh();
        if (operation) { const next = await portal<Operation>(`/provisions/${operation.id}`); if (!disposed) setOperation(next); }
        if (selected && command) { const next = await client<Command>(`/${selected.id}/commands/${command.id}`); if (!disposed) setCommand(next); }
      } catch (failure) { if (!disposed) setError(failure instanceof Error ? failure.message : "Connection failed"); }
      finally { if (!disposed) timer = setTimeout(() => void poll(), 4000); }
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [client, operation?.id, selected?.id, command?.id]);

  async function create(input: WorkspaceProvisionInput) {
    setBusy(true); setError("");
    try { setOperation(await portal<Operation>("/provisions", input)); navigate("workers"); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Creation failed"); }
    finally { setBusy(false); }
  }

  async function saveProfile(input: WorkspaceProfileInput): Promise<WorkspaceProfile> {
    setBusy(true); setError("");
    try {
      const profile = await portal<WorkspaceProfile>("/workspace-profiles", input);
      setProfiles((current) => [...current.filter((item) => item.id !== profile.id), profile].sort((left, right) => left.name.localeCompare(right.name)));
      return profile;
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Profile save failed"); throw failure; }
    finally { setBusy(false); }
  }

  async function execute(event: React.FormEvent) {
    event.preventDefault(); if (!selected) return; setBusy(true); setError("");
    try { setCommand(await client<Command>(`/${selected.id}/commands`, { requestId: crypto.randomUUID(), title: "Workspace command", steps: [{ argv: ["sh", "-lc", script], directory: ".", timeoutSeconds: 300 }] })); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Command failed"); }
    finally { setBusy(false); }
  }

  async function dropWorker() {
    if (!dropCandidate) return;
    setBusy(true); setError("");
    try {
      await portal(`/servers/${dropCandidate.id}/drop`, { requestId: crypto.randomUUID(), confirmed: true });
      if (selected?.id === dropCandidate.id) { setSelected(undefined); setCommand(undefined); }
      setDropCandidate(undefined); await refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Drop failed"); }
    finally { setBusy(false); }
  }

  const snapshot = selected && snapshots[selected.id];
  const title = page === "new" ? "New CXForge workspace" : selected?.name || "CXForge workspaces";
  return <MainWorkspace applicationId="zuno" applicationName="Zuno" showApplicationHeader applicationHeaderTitle={title} showApplicationIdentity={false} user={{ initials: "ZU", name: "Zuno client", onSignOut: logout }} workspaceTitle="Worker control" statusLabel="One workspace per container">
    <main className="h-full overflow-auto p-4 md:p-6">
      {page === "new" ? <WorkspaceCreatePage busy={busy} error={error} onBack={() => navigate("workers")} onCreate={create} onSaveProfile={saveProfile} profiles={profiles} /> : <WorkerListPage command={command} error={error} onCommand={setCommand} onCreate={() => navigate("new")} onDrop={setDropCandidate} onSelect={setSelected} onShowAll={() => { setSelected(undefined); setCommand(undefined); }} operation={operation} selected={selected} servers={servers} snapshot={snapshot} snapshots={snapshots} script={script} setScript={setScript} busy={busy} onExecute={execute} />}
      <DropDialog busy={busy} candidate={dropCandidate} onCancel={() => setDropCandidate(undefined)} onDrop={dropWorker} />
    </main>
  </MainWorkspace>;
}

function WorkerListPage({ command, error, onCommand, onCreate, onDrop, onSelect, onShowAll, operation, selected, servers, snapshot, snapshots, script, setScript, busy, onExecute }: {
  command?: Command; error: string; onCommand: (value: Command | undefined) => void; onCreate: () => void; onDrop: (server: Server) => void; onSelect: (server: Server | undefined) => void; onShowAll: () => void; operation?: Operation; selected?: Server; servers: Server[]; snapshot?: Snapshot; snapshots: Record<string, Snapshot>; script: string; setScript: (value: string) => void; busy: boolean; onExecute: (event: React.FormEvent) => Promise<void>;
}) {
  return <>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><Button variant="ghost" onClick={onShowAll}>All workers</Button><Button onClick={onCreate}>Create workspace</Button></div>
    {error && <p role="alert" className="mb-4 text-destructive">{error}</p>}
    {operation && <OperationNotice operation={operation} servers={servers} onOpen={(server, setup) => { onSelect(server); onCommand(setup); }} />}
    {!selected ? <WorkerRows servers={servers} snapshots={snapshots} onDrop={onDrop} onSelect={(server) => { onSelect(server); onCommand(undefined); }} /> : <WorkerDetail busy={busy} command={command} onCommand={onCommand} onDrop={() => onDrop(selected)} onExecute={onExecute} script={script} selected={selected} setScript={setScript} snapshot={snapshot} />}
  </>;
}

function WorkerRows({ servers, snapshots, onDrop, onSelect }: { servers: Server[]; snapshots: Record<string, Snapshot>; onDrop: (server: Server) => void; onSelect: (server: Server) => void }) {
  return <div className="divide-y rounded border">{servers.map((server) => <div key={server.id} className="flex w-full flex-wrap items-center gap-3 p-2 hover:bg-muted"><button className="min-w-0 flex-1 p-2 text-left" onClick={() => onSelect(server)}><strong>{snapshots[server.id]?.overview?.containerName || server.name}</strong><p className="text-sm text-muted-foreground">{server.apiUrl}</p></button><span className="text-sm">{snapshots[server.id]?.state || "Checking"} · {snapshots[server.id]?.latencyMs ?? "—"} ms</span><Button aria-label={`Drop ${server.name}`} size="icon-sm" type="button" variant="ghost" onClick={() => onDrop(server)}><Trash2Icon /></Button></div>)}</div>;
}

function OperationNotice({ operation, servers, onOpen }: { operation: Operation; servers: Server[]; onOpen: (server: Server | undefined, setup: Command | undefined) => void }) {
  return <section className="mb-5 rounded border p-4" aria-live="polite"><strong>{operation.name}</strong> · {operation.status}<p>{operation.error}</p><p className="text-sm text-muted-foreground">{operation.containerId?.slice(0, 12)} {operation.ports?.map((port, index) => `${index === 0 ? "API" : `Preview ${index}`}: ${port}`).join(" · ")}</p>{operation.serverId && <Button variant="outline" onClick={() => onOpen(servers.find((server) => server.id === operation.serverId), operation.taskId ? { id: operation.taskId, title: "Workspace setup", status: operation.status, report: "" } : undefined)}>Open workspace</Button>}</section>;
}

function WorkerDetail({ busy, command, onCommand, onDrop, onExecute, script, selected, setScript, snapshot }: { busy: boolean; command?: Command; onCommand: (value: Command) => void; onDrop: () => void; onExecute: (event: React.FormEvent) => Promise<void>; script: string; selected: Server; setScript: (value: string) => void; snapshot?: Snapshot }) {
  const runtime = selected.runtime;
  return <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)]"><section><div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">{snapshot?.overview?.containerId?.slice(0, 12)} · {snapshot?.state} · {selected.apiUrl}</p>{runtime && <p className="mt-1 text-xs text-muted-foreground">API {runtime.ports[0]} · preview {runtime.previewUrl} · reserved ports {runtime.ports.slice(1).join(", ")}</p>}</div><Button aria-label={`Drop ${selected.name}`} size="icon-sm" type="button" variant="ghost" onClick={onDrop}><Trash2Icon /></Button></div>{snapshot?.error && <p role="alert">{snapshot.error}</p>}<h2 className="mb-3 font-semibold">Commands and setup runs</h2>{snapshot?.overview?.tasks.map((task) => <button key={task.id} className="flex w-full justify-between gap-3 border-b py-3 text-left" onClick={() => onCommand(task)}>{task.title}<span>{task.status}</span></button>)}{command && <article className="mt-6"><h3 className="font-semibold">{command.title} · {command.status}</h3><p className="my-3 whitespace-pre-wrap">{command.report}</p>{webUrl(command.previewUrl) && <a className="underline" href={webUrl(command.previewUrl)} target="_blank" rel="noreferrer">Open live preview</a>}<pre className="mt-3 max-h-96 overflow-auto rounded bg-muted p-4 text-xs">{command.tools?.results?.map((result) => `[exit ${result.exitCode}]\n${result.output}`).join("\n")}</pre></article>}</section><form onSubmit={(event) => void onExecute(event)} className="grid content-start gap-3 rounded border p-4"><h2 className="font-semibold">Continue in this workspace</h2><p className="text-sm text-muted-foreground">Explicit shell commands, not a model prompt. Each request is queued in this container.</p><label>Command<Textarea className="min-h-40 font-mono" value={script} onChange={(event) => setScript(event.target.value)} required /></label><Button disabled={busy || snapshot?.state !== "ready"} type="submit">Run command</Button></form></div>;
}

function DropDialog({ busy, candidate, onCancel, onDrop }: { busy: boolean; candidate?: Server; onCancel: () => void; onDrop: () => void }) {
  return <AlertDialog open={Boolean(candidate)} onOpenChange={(open) => { if (!open && !busy) onCancel(); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Drop worker?</AlertDialogTitle><AlertDialogDescription><strong>{candidate?.name}</strong> will be stopped and its Docker container, cloned code, environment files, database, installed dependencies, and live preview will be permanently removed. Zuno retains only its final task report.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel><AlertDialogAction disabled={busy} variant="destructive" onClick={() => void onDrop()}>{busy ? "Dropping…" : "Drop worker"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function currentPage(): Page { return window.location.hash === "#/workers/new" ? "new" : "workers"; }
function navigate(page: Page): void { window.location.hash = page === "new" ? "/workers/new" : "/overview"; }
