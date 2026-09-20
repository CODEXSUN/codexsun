import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { ArrowLeftIcon, BotIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { InfraTabScaffold, InfraTabs, type InfraShowTab } from "./infra-tabs";
import { fetchDockerContainers, fetchDockerSnapshot, fetchInfra, fetchInfras, type DockerContainer, type DockerContainerSnapshot, type OrshipInfraMetric, type OrshipInfraRecord } from "./infras-api";
import { InfrasUpsertPage } from "./infras-upsert";

export type InfrasWorkspaceProps = {
  readonly request: typeof fetch;
  readonly selectedUuid?: string;
  readonly view: "infras-list" | "infras-show" | "infras-upsert";
  readonly onBack: () => void;
  readonly onCreate: () => void;
  readonly onSaved: (uuid: string) => void;
  readonly onSelect: (uuid: string) => void;
};

export function InfrasWorkspace({ request, selectedUuid, view, onBack, onCreate, onSaved, onSelect }: InfrasWorkspaceProps) {
  if (view === "infras-upsert") {
    return <InfrasUpsertPage request={request} onBack={onBack} onSaved={(infra) => onSaved(infra.uuid)} />;
  }

  if (view === "infras-show" && selectedUuid) {
    return <InfrasShowPage request={request} uuid={selectedUuid} onBack={onBack} onCreate={onCreate} />;
  }

  return <InfrasListPage request={request} onCreate={onCreate} onSelect={onSelect} />;
}

function InfrasListPage({ request, onCreate, onSelect }: { request: typeof fetch; onCreate: () => void; onSelect: (uuid: string) => void }) {
  const infras = useQuery({ queryKey: ["orship", "infras"], queryFn: () => fetchInfras(request) });
  const containers = useQuery({ queryKey: ["orship", "docker", "containers"], queryFn: () => fetchDockerContainers(request), refetchInterval: 5_000 });

  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Infras"
            description="Runtime infrastructure records for deployment, monitoring, and maintenance."
          />
          <Button type="button" onClick={onCreate}>Create New</Button>
        </div>

        {infras.isPending ? <StateMessage message="Loading infras." /> : null}
        {infras.isError ? <StateMessage message="Infras API is unavailable." /> : null}
        {infras.data ? (
          <section className="grid gap-4 md:grid-cols-3" aria-label="Infras list">
            {infras.data.map((infra) => (
              <InfraCard container={containers.data?.find((item) => item.name === infra.detail.containerName)} infra={infra} key={infra.uuid} onSelect={onSelect} request={request} />
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function InfrasShowPage({ request, uuid, onBack, onCreate }: { request: typeof fetch; uuid: string; onBack: () => void; onCreate: () => void }) {
  const infra = useQuery({ queryKey: ["orship", "infras", uuid], queryFn: () => fetchInfra(request, uuid) });

  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Button size="sm" type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon />
          Back to infras
        </Button>
        {infra.isPending ? <StateMessage message="Loading infra details." /> : null}
        {infra.isError ? <StateMessage message="Infra record is unavailable." /> : null}
        {infra.data ? <InfraDetails infra={infra.data} onCreate={onCreate} request={request} /> : null}
      </section>
    </main>
  );
}

function InfraCard({ container, infra, onSelect, request }: { container?: DockerContainer; infra: OrshipInfraRecord; onSelect: (uuid: string) => void; request: typeof fetch }) {
  const snapshot = useQuery({
    enabled: container?.state === "running",
    queryKey: ["orship", "docker", "snapshot", container?.id],
    queryFn: () => fetchDockerSnapshot(request, container?.id ?? ""),
    refetchInterval: 5_000,
  });
  function select(): void {
    onSelect(infra.uuid);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>): void {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    select();
  }

  return (
    <Card
      className="h-full cursor-pointer transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      role="button"
      tabIndex={0}
      onClick={select}
      onKeyDown={onKeyDown}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-1">
            <CardTitle className="text-base">{infra.name}</CardTitle>
            <CardDescription>{container ? `${container.image} · ${formatPorts(container)}` : "Container not found on the connected Docker host."}</CardDescription>
          </div>
          <StatusPill label={container?.state ?? "not found"} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{container?.status ?? "The persisted record is waiting for a live Docker container."}</p>
        <MetricGrid
          items={[
            ["Container", container?.name ?? infra.detail.containerName],
            ["CPU", snapshot.data ? `${snapshot.data.metrics.cpuPercent.toFixed(1)}%` : "--"],
            ["Memory", snapshot.data ? `${snapshot.data.metrics.memoryPercent.toFixed(1)}%` : "--"],
            ["Updated", snapshot.data ? new Date(snapshot.data.metrics.collectedAt).toLocaleTimeString() : "Waiting for live metrics"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function InfraDetails({ infra, onCreate, request }: { infra: OrshipInfraRecord; onCreate: () => void; request: typeof fetch }) {
  const [activeTab, setActiveTab] = useState<InfraShowTab>("details");
  const containers = useQuery({ queryKey: ["orship", "docker", "containers"], queryFn: () => fetchDockerContainers(request), refetchInterval: 10_000 });
  const dockerContainer = containers.data?.find((container) => container.name === infra.detail.containerName);
  const snapshot = useQuery({
    enabled: Boolean(dockerContainer),
    queryKey: ["orship", "docker", "snapshot", dockerContainer?.id],
    queryFn: () => fetchDockerSnapshot(request, dockerContainer?.id ?? ""),
    refetchInterval: 5_000,
  });
  const displayMetrics = snapshot.data ? liveMetrics(snapshot.data, infra.metrics) : [];

  return (
    <div className="grid gap-6">
      <PageHeader title={infra.name} description={infra.description} />
      <InfraTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "details" ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-label="Infra status">
            <div className="grid gap-4 md:grid-cols-2">
              {displayMetrics.length > 0
                ? displayMetrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)
                : <StateMessage message="Waiting for live Docker metrics." />}
              <LiveRuntimeCard container={dockerContainer} snapshot={snapshot.data} />
            </div>
            <ContainerDetailsCard container={dockerContainer} infra={infra} snapshot={snapshot.data} />
          </section>
          <ContainerLogsCard infra={infra} snapshot={snapshot.data} />
        </>
      ) : (
        <InfraTabScaffold tab={activeTab} onCreate={onCreate} request={request} />
      )}
    </div>
  );
}

function MetricCard({ metric }: { metric: OrshipInfraMetric }) {
  return (
    <Card className="h-full">
      <CardContent className="grid gap-3">
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            <p className="text-2xl font-semibold tracking-tight">{metric.value}</p>
          </div>
          {metric.percent !== undefined ? <ProgressRing percent={metric.percent} /> : <Sparkline series={metric.series} />}
        </div>
        {metric.percent !== undefined ? <Sparkline series={metric.series} compact /> : null}
      </CardContent>
    </Card>
  );
}

function LiveRuntimeCard({ container, snapshot }: { container?: DockerContainer; snapshot?: DockerContainerSnapshot }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        <CardTitle>Runtime health</CardTitle>
        <CardDescription>Live facts from the connected Docker host.</CardDescription>
      </CardHeader>
      <CardContent>
        <MetricGrid
          items={[
            ["State", container?.state ?? "Not found"],
            ["Image", container?.image ?? "Waiting for container"],
            ["Published ports", container ? formatPorts(container) : "Waiting for container"],
            ["Log lines", snapshot ? String(snapshot.logs.length) : "Waiting for snapshot"],
            ["Last sample", snapshot ? new Date(snapshot.metrics.collectedAt).toLocaleTimeString() : "Waiting for snapshot"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ContainerDetailsCard({ container, infra, snapshot }: { container?: DockerContainer; infra: OrshipInfraRecord; snapshot?: DockerContainerSnapshot }) {
  const metrics = snapshot ? liveMetrics(snapshot, infra.metrics) : [];
  const status = snapshot?.container.state ?? container?.state ?? "not found";
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Container details</CardDescription>
            <CardTitle className="mt-3 text-base">{infra.detail.containerName}</CardTitle>
          </div>
          <StatusPill label={status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <p className="font-medium text-primary">{container ? formatPorts(container) : "No live container ports"}</p>
          <p className="text-muted-foreground">{container?.status ?? "Container not found on the connected Docker host."}</p>
        </div>
        <MetricGrid
          items={[
            ["CPU", metrics.find((metric) => metric.label === "CPU usage")?.value ?? "Waiting for metrics"],
            ["RAM", metrics.find((metric) => metric.label === "Memory usage")?.value ?? "Waiting for metrics"],
            ["Incoming traffic", metrics.find((metric) => metric.label === "Incoming traffic")?.value ?? "Waiting for metrics"],
            ["Outgoing traffic", metrics.find((metric) => metric.label === "Outgoing traffic")?.value ?? "Waiting for metrics"],
            ["Root user", infra.detail.rootUser],
            ["Password", infra.detail.rootPasswordHidden],
            ["Image", container?.image ?? "Waiting for container"],
            ["Collected", snapshot ? new Date(snapshot.metrics.collectedAt).toLocaleTimeString() : "Waiting for snapshot"],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ContainerLogsCard({ infra, snapshot }: { infra: OrshipInfraRecord; snapshot?: DockerContainerSnapshot }) {
  const logs = snapshot?.logs ?? infra.logs.map((log) => `[${log.time}] ${infra.detail.containerName}: [${log.level}] ${log.line}`);
  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Container logs</CardTitle>
            <CardDescription className="mt-1">View activity logs from your container.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" type="button" variant="outline">
              <BotIcon />
              Analyze
            </Button>
            <Button size="sm" type="button" variant="outline">
              <RefreshCwIcon />
              Refresh logs
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 rounded-lg bg-neutral-950 p-4 text-neutral-50">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{infra.detail.containerName}</p>
            <CopyIcon className="size-4 text-neutral-300" />
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap font-mono text-xs leading-5">
            {logs.map(sanitizeLogLine).join("\n")}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

function Sparkline({ compact = false, series }: { compact?: boolean; series: number[] }) {
  const points = sparklinePoints(series, compact ? 140 : 160, compact ? 36 : 48);
  return (
    <svg className={compact ? "h-9 w-full" : "h-12 w-36"} role="img" viewBox={`0 0 ${compact ? 140 : 160} ${compact ? 36 : 48}`}>
      <defs>
        <linearGradient id="orship-sparkline-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(124 58 237 / 0.28)" />
          <stop offset="100%" stopColor="rgb(124 58 237 / 0)" />
        </linearGradient>
      </defs>
      <polyline fill="none" points={points} stroke="rgb(124 58 237)" strokeWidth="2" />
      <polygon fill="url(#orship-sparkline-fill)" points={`0,${compact ? 36 : 48} ${points} ${compact ? 140 : 160},${compact ? 36 : 48}`} />
    </svg>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      aria-label={`${value}%`}
      className="size-14 rounded-full"
      style={{ background: `conic-gradient(rgb(124 58 237) ${value * 3.6}deg, rgb(229 231 235) 0deg)` }}
    >
      <div className="m-1 size-12 rounded-full bg-background" />
    </div>
  );
}

function MetricGrid({ items }: { items: Array<readonly [string, string]> }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div className="grid gap-1 rounded-md bg-muted/45 p-3" key={label}>
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="break-all text-sm text-foreground">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function PageHeader({ description, eyebrow, title }: { description: string; eyebrow?: string; title: string }) {
  return (
    <header className="flex flex-col gap-2">
      {eyebrow ? <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p> : null}
      <div className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </header>
  );
}

function StateMessage({ message }: { message: string }) {
  return <p className="rounded-md bg-muted/45 p-4 text-sm text-muted-foreground">{message}</p>;
}

function StatusPill({ label }: { label: string }) {
  const healthy = label === "running";
  const missing = label === "not found" || label === "unknown";
  return (
    <span className={`inline-flex h-7 shrink-0 items-center rounded-md border px-2.5 text-xs font-medium capitalize ${healthy ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300" : missing ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300" : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"}`}>
      {label}
    </span>
  );
}

function formatPorts(container: DockerContainer): string {
  if (container.ports.length === 0) return "No published ports";
  return container.ports.map((port) => port.publicPort
    ? `${port.ip ? `${port.ip}:` : ""}${port.publicPort}->${port.privatePort}/${port.type}`
    : `${port.privatePort}/${port.type}`,
  ).join(", ");
}

function sparklinePoints(series: number[], width: number, height: number): string {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  return series
    .map((value, index) => {
      const x = (index / Math.max(series.length - 1, 1)) * width;
      const y = height - ((value - min) / span) * (height - 8) - 4;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function liveMetrics(snapshot: DockerContainerSnapshot, fallback: OrshipInfraMetric[]): OrshipInfraMetric[] {
  const byLabel = new Map(fallback.map((metric) => [metric.label, metric]));
  const values: Array<[string, string, number?]> = [
    ["CPU usage", `${snapshot.metrics.cpuPercent.toFixed(1)}%`, snapshot.metrics.cpuPercent],
    ["Memory usage", `${formatBytes(snapshot.metrics.memoryUsageBytes)} / ${formatBytes(snapshot.metrics.memoryLimitBytes)}`, snapshot.metrics.memoryPercent],
    ["Incoming traffic", formatBytes(snapshot.metrics.networkRxBytes)],
    ["Outgoing traffic", formatBytes(snapshot.metrics.networkTxBytes)],
    ["Disk usage", `Read ${formatBytes(snapshot.metrics.blockReadBytes)} / Write ${formatBytes(snapshot.metrics.blockWriteBytes)}`],
  ];
  return values.map(([label, value, percent]) => ({
    label,
    percent,
    series: [...(byLabel.get(label)?.series ?? [0, 0]).slice(-10), percent ?? 0],
    value,
  }));
}

function sanitizeLogLine(line: string): string {
  return Array.from(line).filter((character) => {
    const code = character.charCodeAt(0);
    return !(code < 0x20 && code !== 0x09) && code !== 0x7f;
  }).join("");
}

function formatBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let amount = value;
  let unit = -1;
  while (amount >= 1024 && unit < units.length - 1) {
    amount /= 1024;
    unit += 1;
  }
  return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${units[unit]}`;
}
