import { useEffect, useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import type { AuthenticatedRequest } from "@codexsun/ui/blocks/auth";
import type { ProjectConversation } from "./types";

type Entry = { path: string; kind: "file" | "directory"; size: number; modifiedAt: string };

export function WorkspaceFilesDesk({ request }: { request: AuthenticatedRequest }) {
  const [path, setPath] = useState(".");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selected, setSelected] = useState<{ path: string; content: string } | null>(null);
  const [error, setError] = useState("");
  const [sandboxMode, setSandboxMode] = useState("unknown");
  const load = async (nextPath = path) => {
    const response = await request(`/api/v1/codeloop/workspace/files?path=${encodeURIComponent(nextPath)}&recursive=false&limit=200`);
    const body = await response.json() as { items?: Entry[]; error?: string };
    if (!response.ok) return setError(body.error ?? "Workspace listing failed.");
    setPath(nextPath); setEntries(body.items ?? []); setError(""); setSelected(null);
  };
  useEffect(() => { void load(); void request("/api/v1/codeloop/workspace/capabilities").then(async (response) => { if (response.ok) setSandboxMode(((await response.json()) as { mode?: string }).mode ?? "unknown"); }); }, []);
  const open = async (entry: Entry) => {
    if (entry.kind === "directory") return load(entry.path);
    const response = await request(`/api/v1/codeloop/workspace/file?path=${encodeURIComponent(entry.path)}`);
    const body = await response.json() as { content?: string; error?: string };
    if (!response.ok) return setError(body.error ?? "File read failed.");
    setSelected({ path: entry.path, content: body.content ?? "" });
  };
  return <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
    <div className="rounded-xl border bg-card p-3">
      <p className="mb-3 text-xs text-muted-foreground">Sandbox: <span className="font-medium text-foreground">{sandboxMode}</span></p>
      <div className="mb-3 flex gap-2"><Input value={path} onChange={(event) => setPath(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} /><Button size="sm" onClick={() => void load()}>Open</Button></div>
      <div className="space-y-1">{entries.map((entry) => <button key={entry.path} type="button" onClick={() => void open(entry)} className="block w-full truncate rounded px-2 py-1 text-left text-sm hover:bg-muted">{entry.kind === "directory" ? "📁" : "📄"} {entry.path.split("/").at(-1)}</button>)}</div>
      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
    </div>
    <div className="min-h-[420px] rounded-xl border bg-card p-4"><p className="mb-3 text-sm font-medium">{selected?.path ?? "Select a file"}</p><pre className="max-h-[620px] overflow-auto whitespace-pre-wrap rounded-lg bg-muted/40 p-4 font-mono text-xs">{selected?.content ?? "Choose a file from the workspace tree."}</pre></div>
  </div>;
}

export function ChangesDesk({ request }: { request: AuthenticatedRequest }) {
  const [status, setStatus] = useState<{ branch: string; entries: string[]; clean: boolean } | null>(null);
  const [diff, setDiff] = useState("");
  const [error, setError] = useState("");
  const refresh = async () => {
    const [statusResponse, diffResponse] = await Promise.all([
      request("/api/v1/codeloop/git/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: "git.status" }) }),
      request("/api/v1/codeloop/git/execute", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tool: "git.diff" }) }),
    ]);
    const statusBody = await statusResponse.json() as { branch?: string; entries?: string[]; clean?: boolean; error?: string };
    const diffBody = await diffResponse.json() as { output?: string; error?: string };
    if (!statusResponse.ok || !diffResponse.ok) return setError(statusBody.error ?? diffBody.error ?? "Git state unavailable.");
    setStatus({ branch: statusBody.branch ?? "", entries: statusBody.entries ?? [], clean: Boolean(statusBody.clean) }); setDiff(diffBody.output ?? ""); setError("");
  };
  useEffect(() => { void refresh(); }, []);
  return <div className="space-y-4"><div className="flex items-center justify-between rounded-xl border bg-card p-4"><div><p className="text-sm font-medium">{status?.branch || "Repository"}</p><p className="text-xs text-muted-foreground">{status?.clean ? "Working tree clean" : `${status?.entries.length ?? 0} changed entries`}</p></div><Button size="sm" variant="outline" onClick={() => void refresh()}>Refresh</Button></div>{error && <p className="text-sm text-destructive">{error}</p>}<div className="grid gap-4 lg:grid-cols-[280px_1fr]"><div className="rounded-xl border bg-card p-4"><p className="mb-2 text-sm font-medium">Changed files</p>{status?.entries.map((entry) => <p key={entry} className="truncate font-mono text-xs">{entry}</p>)}</div><pre className="min-h-[360px] overflow-auto rounded-xl border bg-card p-4 font-mono text-xs">{diff || "No unstaged diff."}</pre></div></div>;
}

export function HistoryDesk({ conversation }: { conversation: ProjectConversation }) {
  const events = conversation.messages.flatMap((message) => (message.trace ?? []).map((trace) => ({ ...trace, messageId: message.id, role: message.role })));
  return <div className="space-y-3">{events.length === 0 ? <div className="rounded-xl border border-dashed p-8 text-sm text-muted-foreground">No agent tool activity has been recorded in this conversation.</div> : events.map((event, index) => <div key={`${event.messageId}-${index}`} className="flex items-start gap-3 rounded-xl border bg-card p-4"><span className={`mt-1 size-2 rounded-full ${event.type.includes("error") || event.type.includes("failed") ? "bg-red-500" : event.type.includes("tool") ? "bg-amber-500" : "bg-emerald-500"}`} /><div><p className="text-sm font-medium">{event.type}</p><p className="text-xs text-muted-foreground">{event.message}</p></div></div>)}</div>;
}
