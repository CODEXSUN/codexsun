import { useState } from "react";
import type { AuthenticatedRequest } from "@codexsun/ui/blocks/auth";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Badge } from "@codexsun/ui/components/badge";
import { CheckCircle2, GitBranch, Loader2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";

type TaskStatus = "planned" | "running" | "validating" | "retrying" | "awaiting_approval" | "completed" | "failed" | "rolled_back";
type Task = { id: string; title: string; prompt: string; status: TaskStatus; attempt: number; maxAttempts: number; checkpointId?: string; error?: string };

export function TaskActivity({ request, providerIds }: { request: AuthenticatedRequest; providerIds: readonly string[] }) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [task, setTask] = useState<Task | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createTask = async () => {
    if (!title.trim() || !prompt.trim()) return;
    setBusy(true); setMessage(null);
    try {
      const response = await request("/api/v1/codeloop/tasks", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, prompt }) });
      const body = await response.json() as { task?: Task; error?: string };
      if (!response.ok || !body.task) throw new Error(body.error ?? "Task could not be created.");
      setTask(body.task); setMessage("Task planned. Run requires approval and a writable sandbox.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Task creation failed."); }
    finally { setBusy(false); }
  };

  const runTask = async () => {
    if (!task || !providerIds.length) { setMessage("Select at least one connected provider."); return; }
    setBusy(true); setMessage(null);
    try {
      const response = await request(`/api/v1/codeloop/tasks/${encodeURIComponent(task.id)}/run`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approved: true, providerIds }) });
      const body = await response.json() as { task?: Task; responses?: Array<{ status: string; message: string }> ; error?: string };
      if (!response.ok || !body.task) throw new Error(body.error ?? "Task run failed.");
      setTask(body.task); setMessage(body.responses?.map((result) => result.message).join(" · ") ?? "Agent run finished. Validate the changes next.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Task run failed."); }
    finally { setBusy(false); }
  };

  const rollbackTask = async () => {
    if (!task) return;
    setBusy(true); setMessage(null);
    try {
      const response = await request(`/api/v1/codeloop/tasks/${encodeURIComponent(task.id)}/rollback`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ approved: true }) });
      const body = await response.json() as { task?: Task; error?: string };
      if (!response.ok || !body.task) throw new Error(body.error ?? "Rollback failed.");
      setTask(body.task); setMessage("Task rolled back to its checkpoint.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Rollback failed."); }
    finally { setBusy(false); }
  };

  return <section className="border-b border-border/60 bg-muted/10 px-4 py-3 sm:px-6">
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground"><GitBranch className="size-3.5 text-amber-500" />Task activity</div>
        {task && <Badge variant="outline" className="text-[10px] uppercase tracking-wide">{task.status}</Badge>}
      </div>
      {!task ? <div className="grid gap-2 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)_auto]">
        <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Task title" className="h-8 text-xs" />
        <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Describe the code task" className="h-8 text-xs" />
        <Button type="button" size="sm" disabled={busy || !title.trim() || !prompt.trim()} onClick={() => void createTask()} className="h-8 text-xs">Plan task</Button>
      </div> : <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-foreground">{task.title}</span>
        <span className="text-muted-foreground">Attempt {task.attempt}/{task.maxAttempts}</span>
        {task.checkpointId && <span className="flex items-center gap-1 text-muted-foreground"><ShieldCheck className="size-3" /> checkpoint ready</span>}
        {(task.status === "planned" || task.status === "retrying" || task.status === "failed") && <Button type="button" size="sm" disabled={busy} onClick={() => void runTask()} className="h-7 text-xs"><Loader2 className={`mr-1 size-3 ${busy ? "animate-spin" : "hidden"}`} />Run approved task</Button>}
        {task.status !== "rolled_back" && task.checkpointId && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void rollbackTask()} className="h-7 text-xs"><RotateCcw className="mr-1 size-3" />Rollback</Button>}
        <span className="flex items-center gap-1 text-muted-foreground">{task.status === "completed" ? <CheckCircle2 className="size-3 text-emerald-500" /> : task.status === "failed" ? <XCircle className="size-3 text-red-500" /> : null}{message}</span>
      </div>}
      {!providerIds.length && <p className="text-[11px] text-amber-600">Connect a provider before running a task.</p>}
    </div>
  </section>;
}
