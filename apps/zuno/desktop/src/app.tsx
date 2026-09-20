import { MainWorkspace } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { useEffect, useState } from "react";
import { readZunoHealth, readZunoOverview, type ZunoOverview } from "./control-client";

export function App() {
  const [overview, setOverview] = useState<ZunoOverview | null>(null);
  const [connected, setConnected] = useState(false);

  async function refresh(): Promise<void> {
    const [health, nextOverview] = await Promise.allSettled([readZunoHealth(), readZunoOverview()]);
    setConnected(health.status === "fulfilled" && health.value.status === "ok");
    setOverview(nextOverview.status === "fulfilled" ? nextOverview.value : null);
  }

  useEffect(() => { void refresh(); }, []);

  return <MainWorkspace applicationId="zuno-desktop" applicationName="Zuno Desktop" primaryAction={{ label: "Client view" }} statusLabel={connected ? "CXForge connected" : "CXForge offline"} workspaceTitle="Worker server">
    <main className="mx-auto flex size-full max-w-5xl flex-col gap-8 overflow-y-auto p-6 lg:p-10">
      <header className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end"><div><p className="text-sm font-semibold tracking-[0.12em]">ZUNO DESKTOP CLIENT</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Observe the worker. Decide the next move.</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">This desktop app reads the CXForge worker server. It cannot edit source code or start a runner directly.</p></div><Button onClick={() => void refresh()} variant="outline">Refresh</Button></header>
      <section className="grid gap-5 md:grid-cols-3"><Metric label="Connection" value={connected ? "Ready" : "Offline"} detail="CXForge health" /><Metric label="Runner" value={overview ? "Available" : "Checking"} detail={overview?.runnerUrl ?? "No overview returned"} /><Metric label="Task contracts" value={String(overview?.tasks.length ?? 0)} detail="Read-only server state" /></section>
      <section><div className="border-b border-border pb-3"><h2 className="font-semibold">Worker task overview</h2><p className="mt-1 text-sm text-muted-foreground">Task acceptance and code execution stay on CXForge.</p></div><div className="divide-y divide-border">{overview?.tasks.length ? overview.tasks.map((task) => <article className="py-4" key={task.id}><div className="flex items-center justify-between gap-3"><h3 className="truncate font-medium">{task.title}</h3><span className="shrink-0 text-xs text-muted-foreground">{task.status}</span></div><p className="mt-1 truncate text-sm text-muted-foreground">{task.repository}</p><p className="mt-1 truncate font-mono text-xs text-muted-foreground">{task.ownedPaths.join(" · ")}</p></article>) : <p className="py-8 text-sm text-muted-foreground">No worker tasks are available.</p>}</div></section>
    </main>
  </MainWorkspace>;
}

function Metric({ detail, label, value }: { readonly detail: string; readonly label: string; readonly value: string }) {
  return <article className="border-l-2 border-foreground/80 pl-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 truncate text-sm text-muted-foreground" title={detail}>{detail}</p></article>;
}
