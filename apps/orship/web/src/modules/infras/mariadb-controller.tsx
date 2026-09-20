import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, DatabaseIcon, HardDriveIcon, PauseIcon, PlayIcon, RefreshCwIcon, RotateCwIcon, ServerIcon, SquareIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { dropMariaDB, fetchDockerContainers, fetchDockerSnapshot, installMariaDB, runDockerContainerAction, type DockerContainer, type DockerContainerAction, type DockerContainerSnapshot } from "./infras-api";

type MariaDBControllerProps = { readonly request: typeof fetch };
type Density = "compact" | "relaxed";

export function MariaDBController({ request }: MariaDBControllerProps) {
  const queryClient = useQueryClient();
  const [density, setDensity] = useState<Density>("compact");
  const containers = useQuery({ queryKey: ["orship", "docker", "containers"], queryFn: () => fetchDockerContainers(request), refetchInterval: 5_000 });
  const container = containers.data?.find((item) => item.name === "orship-mariadb-sample");
  const snapshot = useQuery({
    enabled: Boolean(container),
    queryKey: ["orship", "docker", "snapshot", container?.id],
    queryFn: () => fetchDockerSnapshot(request, container?.id ?? ""),
    refetchInterval: 5_000,
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["orship", "docker"] });
  const lifecycle = useMutation({
    mutationFn: (action: "install" | "reinstall") => installMariaDB(request, action),
    onSuccess: invalidate,
  });
  const drop = useMutation({ mutationFn: () => dropMariaDB(request), onSuccess: invalidate });
  const action = useMutation({
    mutationFn: (name: DockerContainerAction) => runDockerContainerAction(request, container?.id ?? "", name),
    onSuccess: invalidate,
  });
  const busy = lifecycle.isPending || drop.isPending || action.isPending;

  return (
    <section className={density === "compact" ? "grid gap-3" : "grid gap-5"} aria-label="MariaDB controller">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300"><DatabaseIcon className="size-5" /></span>
          <div className="grid gap-1"><h2 className="text-lg font-semibold">MariaDB controller</h2><p className="text-sm text-muted-foreground">Operate the CXApp-compatible sample on codexsun-network.</p></div>
        </div>
        <div className="flex items-center gap-2">
          <Button aria-label="Refresh MariaDB metrics" disabled={containers.isFetching} size="icon" title="Refresh metrics" type="button" variant="outline" onClick={() => void containers.refetch()}><RefreshCwIcon className={containers.isFetching ? "animate-spin" : ""} /></Button>
          <Button size="sm" type="button" variant="outline" onClick={() => setDensity(density === "compact" ? "relaxed" : "compact")}><ServerIcon />{density === "compact" ? "Relaxed" : "Compact"}</Button>
        </div>
      </div>
      {containers.isError ? <Message tone="error">{containers.error.message}</Message> : null}
      {lifecycle.isError ? <Message tone="error">{lifecycle.error.message}</Message> : null}
      {drop.isError ? <Message tone="error">{drop.error.message}</Message> : null}
      {action.isError ? <Message tone="error">{action.error.message}</Message> : null}
      <ControllerOverview busy={busy} container={container} snapshot={snapshot.data} onAction={(name) => action.mutate(name)} onDrop={() => { if (window.confirm("Drop MariaDB data and container?")) drop.mutate(); }} onInstall={() => lifecycle.mutate("install")} onReinstall={() => { if (window.confirm("Reinstall MariaDB and remove its data volume?")) lifecycle.mutate("reinstall"); }} />
      <ControllerMetrics snapshot={snapshot.data} />
      <ControllerLogs container={container} snapshot={snapshot.data} />
      <div className="fixed bottom-5 right-5 z-20 hidden items-center gap-2 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur sm:flex">
        <span className="px-2 text-xs font-medium text-muted-foreground">View density</span>
        <Button aria-label="Use compact density" className="size-8" data-active={density === "compact"} size="icon" title="Compact density" type="button" variant="ghost" onClick={() => setDensity("compact")}><PauseIcon /></Button>
        <Button aria-label="Use relaxed density" className="size-8" data-active={density === "relaxed"} size="icon" title="Relaxed density" type="button" variant="ghost" onClick={() => setDensity("relaxed")}><PlayIcon /></Button>
      </div>
    </section>
  );
}

function ControllerOverview({ busy, container, onAction, onDrop, onInstall, onReinstall, snapshot }: { busy: boolean; container?: DockerContainer; onAction: (action: DockerContainerAction) => void; onDrop: () => void; onInstall: () => void; onReinstall: () => void; snapshot?: DockerContainerSnapshot }) {
  const running = container?.state === "running";
  return (
    <Card>
      <CardContent className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="grid gap-2"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">orship-mariadb-sample</span><Badge variant={running ? "default" : "outline"}>{container?.state ?? "not installed"}</Badge>{snapshot ? <span className="text-xs text-muted-foreground">Updated {new Date(snapshot.metrics.collectedAt).toLocaleTimeString()}</span> : null}</div><p className="text-sm text-muted-foreground">{container?.status ?? "Install the managed MariaDB sample to begin."}</p></div>
        <div className="flex flex-wrap gap-2">{container ? (running ? <><Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("restart")}><RotateCwIcon />Restart</Button><Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("stop")}><SquareIcon />Stop</Button></> : <Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("start")}><PlayIcon />Start</Button>) : <Button disabled={busy} size="sm" type="button" onClick={onInstall}><DatabaseIcon />Install</Button>}<Button disabled={busy || !container} size="sm" type="button" variant="outline" onClick={onReinstall}><RotateCwIcon />Reinstall</Button><Button disabled={busy || !container} size="sm" type="button" variant="destructive" onClick={onDrop}><HardDriveIcon />Drop</Button></div>
      </CardContent>
    </Card>
  );
}

function ControllerMetrics({ snapshot }: { snapshot?: DockerContainerSnapshot }) {
  const metrics = snapshot?.metrics;
  const items = [
    ["CPU", metrics ? `${metrics.cpuPercent.toFixed(1)}%` : "--", "Live process usage"],
    ["Memory", metrics ? `${formatBytes(metrics.memoryUsageBytes)} / ${formatBytes(metrics.memoryLimitBytes)}` : "--", metrics ? `${metrics.memoryPercent.toFixed(1)}% of limit` : "Waiting for sample"],
    ["Network", metrics ? `${formatBytes(metrics.networkRxBytes)} in / ${formatBytes(metrics.networkTxBytes)} out` : "--", "Container totals"],
    ["Storage I/O", metrics ? `${formatBytes(metrics.blockReadBytes)} read / ${formatBytes(metrics.blockWriteBytes)} written` : "--", "Container totals"],
  ];
  return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{items.map(([label, value, hint]) => <Card key={label}><CardHeader className="gap-1 pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-xl">{value}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">{hint}</p></CardContent></Card>)}</div>;
}

function ControllerLogs({ container, snapshot }: { container?: DockerContainer; snapshot?: DockerContainerSnapshot }) {
  return <Card><CardHeader><CardTitle>MariaDB logs</CardTitle><CardDescription>Latest output from the managed container.</CardDescription></CardHeader><CardContent>{container ? <pre className="max-h-72 overflow-auto rounded-md bg-neutral-950 p-4 font-mono text-xs leading-5 text-neutral-50">{snapshot?.logs.join("\n") || "Waiting for container logs..."}</pre> : <Message>Install MariaDB to view logs.</Message>}</CardContent></Card>;
}

function Message({ children, tone = "muted" }: { children: string; tone?: "error" | "muted" }) {
  return <p className={tone === "error" ? "rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" : "rounded-md bg-muted/45 p-3 text-sm text-muted-foreground"} role={tone === "error" ? "alert" : undefined}>{tone === "error" ? <AlertTriangleIcon className="mr-2 inline size-4" /> : null}{children}</p>;
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value;
  let unit = -1;
  while (amount >= 1024 && unit < units.length - 1) { amount /= 1024; unit += 1; }
  return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${units[unit]}`;
}
