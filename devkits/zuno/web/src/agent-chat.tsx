import { useEffect, useState } from "react";
import { CopyIcon, ExternalLinkIcon, SendIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import type { Server } from "./control-api";

type Agent = { id: string; name: string; status: "ready" | "draining" | "disabled"; };
type Assignment = { id: string; agentId: string; cxforgeServerId: string; title: string; prompt: string; ownedPaths: string[]; status: string; result: string | null; updatedAt: string; };
type DeviceCode = { status: "idle" | "awaiting" | "connected" | "failed"; message: string; userCode?: string; verificationUrl?: string; };

export function AgentChat({ request, servers }: { request: typeof fetch; servers: Server[] }) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [agentId, setAgentId] = useState("");
  const [serverId, setServerId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [paths, setPaths] = useState("src/");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [deviceCode, setDeviceCode] = useState<DeviceCode>();

  async function api<T>(path: string, body?: unknown): Promise<T> {
    const response = await request(`${import.meta.env.VITE_ZUNO_API_URL ?? ""}/api/v1/zuno/agents${path}`, { body: body ? JSON.stringify(body) : undefined, headers: body ? { "Content-Type": "application/json" } : undefined, method: body ? "POST" : "GET" });
    const result = await response.json() as T & { error?: string };
    if (!response.ok) throw new Error(result.error || "Zuno could not complete the request.");
    return result;
  }

  async function refresh() {
    try {
      const [agentResult, assignmentResult] = await Promise.all([api<{ agents: Agent[] }>(""), api<{ assignments: Assignment[] }>("/assignments")]);
      setAgents(agentResult.agents);
      setAssignments(assignmentResult.assignments);
      setAgentId((current) => current || agentResult.agents.find((agent) => agent.status === "ready")?.id || "");
      setServerId((current) => current || servers[0]?.id || "");
      setError("");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Chat connection failed."); }
  }

  useEffect(() => { void refresh(); const timer = setInterval(() => void refresh(), 3_000); return () => clearInterval(timer); }, [servers]);

  async function assign(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      await api("/assignments", { agentId, cxforgeServerId: serverId, ownedPaths: paths.split(",").map((path) => path.trim()).filter(Boolean), prompt, title: prompt.split("\n")[0].slice(0, 160) });
      setPrompt("");
      await refresh();
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Assignment failed."); }
    finally { setBusy(false); }
  }

  async function connectCodex() {
    if (!agentId) return;
    setConnecting(true); setError("");
    try { setDeviceCode(await api<DeviceCode>(`/${agentId}/connection/device-code`, {})); }
    catch (failure) { setError(failure instanceof Error ? failure.message : "Could not start Codex device login."); }
    finally { setConnecting(false); }
  }

  async function copyCode() {
    if (!deviceCode?.userCode) return;
    try { await navigator.clipboard.writeText(deviceCode.userCode); }
    catch { setError("The browser could not copy the device code."); }
  }

  return <div className="grid h-full gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <section className="min-h-0 overflow-auto rounded border">
      <header className="border-b p-4"><h2 className="font-semibold">ZXA work chat</h2><p className="text-sm text-muted-foreground">Prompts become traceable Zuno assignments for an isolated CXForge workspace.</p></header>
      <div className="space-y-3 p-4">{assignments.length === 0 ? <p className="text-sm text-muted-foreground">No assignments yet.</p> : assignments.map((assignment) => <article className="border-b pb-3" key={assignment.id}><div className="flex justify-between gap-3"><strong>{assignment.title}</strong><span className="text-sm capitalize">{assignment.status}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{assignment.prompt}</p>{assignment.result && <p className="mt-2 text-sm text-muted-foreground">{assignment.result}</p>}</article>)}</div>
    </section>
    <form className="grid content-start gap-4 rounded border p-4" onSubmit={(event) => void assign(event)}>
      <div><h2 className="font-semibold">Assign work</h2><p className="text-sm text-muted-foreground">Zuno records scope before dispatching to an agent.</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <label className="grid gap-1 text-sm">Agent<select className="h-9 rounded border bg-background px-2" value={agentId} onChange={(event) => { setAgentId(event.target.value); setDeviceCode(undefined); }} required><option value="">Select ZXA</option>{agents.map((agent) => <option key={agent.id} value={agent.id} disabled={agent.status !== "ready"}>{agent.name} · {agent.status}</option>)}</select></label>
      <section className="grid gap-2 border-y py-3"><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">Codex connection</span><Button disabled={!agentId || connecting} size="sm" type="button" variant="outline" onClick={() => void connectCodex()}>{connecting ? "Connecting" : "Connect Codex"}</Button></div><a className="inline-flex items-center gap-1 text-sm underline" href={deviceCode?.verificationUrl || "https://auth.openai.com/codex/device"} target="_blank" rel="noreferrer"><ExternalLinkIcon />Open OpenAI device login</a>{deviceCode?.status === "awaiting" && deviceCode.userCode && <div className="grid gap-2"><p className="text-sm">{deviceCode.message}</p><div className="flex items-center gap-2"><code className="min-w-0 flex-1 rounded bg-muted px-2 py-1.5 text-center text-sm">{deviceCode.userCode}</code><Button aria-label="Copy Codex device code" size="icon-sm" type="button" variant="outline" onClick={() => void copyCode()}><CopyIcon /></Button></div></div>}{deviceCode && deviceCode.status !== "awaiting" && <p className="text-sm text-muted-foreground">{deviceCode.message}</p>}</section>
      <label className="grid gap-1 text-sm">CXForge workspace<select className="h-9 rounded border bg-background px-2" value={serverId} onChange={(event) => setServerId(event.target.value)} required><option value="">Select workspace</option>{servers.map((server) => <option key={server.id} value={server.id}>{server.name}</option>)}</select></label>
      <label className="grid gap-1 text-sm">Owned paths<input className="h-9 rounded border bg-background px-2" value={paths} onChange={(event) => setPaths(event.target.value)} required /></label>
      <label className="grid gap-1 text-sm">Prompt<Textarea className="min-h-40" value={prompt} onChange={(event) => setPrompt(event.target.value)} required /></label>
      <Button disabled={busy || !agentId || !serverId || !prompt.trim()} type="submit"><SendIcon />{busy ? "Assigning" : "Assign work"}</Button>
    </form>
  </div>;
}
