import { useQuery } from "@tanstack/react-query";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { ArrowLeftIcon, BotIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useState, type KeyboardEvent } from "react";
import { InfraTabScaffold, InfraTabs, type InfraShowTab } from "./infra-tabs";
import { fetchInfra, fetchInfras, type OrshipInfraMetric, type OrshipInfraRecord } from "./infras-api";
import { InfrasUpsertPage } from "./infras-upsert";

export type InfrasWorkspaceProps = {
  readonly selectedUuid?: string;
  readonly view: "infras-list" | "infras-show" | "infras-upsert";
  readonly onBack: () => void;
  readonly onCreate: () => void;
  readonly onSaved: (uuid: string) => void;
  readonly onSelect: (uuid: string) => void;
};

export function InfrasWorkspace({ selectedUuid, view, onBack, onCreate, onSaved, onSelect }: InfrasWorkspaceProps) {
  if (view === "infras-upsert") {
    return <InfrasUpsertPage onBack={onBack} onSaved={(infra) => onSaved(infra.uuid)} />;
  }

  if (view === "infras-show" && selectedUuid) {
    return <InfrasShowPage uuid={selectedUuid} onBack={onBack} onCreate={onCreate} />;
  }

  return <InfrasListPage onCreate={onCreate} onSelect={onSelect} />;
}

function InfrasListPage({ onCreate, onSelect }: { onCreate: () => void; onSelect: (uuid: string) => void }) {
  const infras = useQuery({ queryKey: ["orship", "infras"], queryFn: fetchInfras });

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
              <InfraCard infra={infra} key={infra.uuid} onSelect={onSelect} />
            ))}
          </section>
        ) : null}
      </section>
    </main>
  );
}

function InfrasShowPage({ uuid, onBack, onCreate }: { uuid: string; onBack: () => void; onCreate: () => void }) {
  const infra = useQuery({ queryKey: ["orship", "infras", uuid], queryFn: () => fetchInfra(uuid) });

  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <Button size="sm" type="button" variant="outline" onClick={onBack}>
          <ArrowLeftIcon />
          Back to infras
        </Button>
        {infra.isPending ? <StateMessage message="Loading infra details." /> : null}
        {infra.isError ? <StateMessage message="Infra record is unavailable." /> : null}
        {infra.data ? <InfraDetails infra={infra.data} onCreate={onCreate} /> : null}
      </section>
    </main>
  );
}

function InfraCard({ infra, onSelect }: { infra: OrshipInfraRecord; onSelect: (uuid: string) => void }) {
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
            <CardDescription>{infra.summary}</CardDescription>
          </div>
          <StatusPill label={infra.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">{infra.description}</p>
        <MetricGrid
          items={[
            ["Container", infra.detail.containerName],
            ["Port", String(infra.detail.port)],
            ["Latency", `${infra.detail.latencyMs} ms`],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function InfraDetails({ infra, onCreate }: { infra: OrshipInfraRecord; onCreate: () => void }) {
  const metrics = visibleMetrics(infra.metrics);
  const [activeTab, setActiveTab] = useState<InfraShowTab>("details");

  return (
    <div className="grid gap-6">
      <PageHeader title={infra.name} description={infra.description} />
      <InfraTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === "details" ? (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-label="Infra status">
            <div className="grid gap-4 md:grid-cols-2">
              {metrics.map((metric) => (
                <MetricCard key={metric.label} metric={metric} />
              ))}
            </div>
            <ContainerDetailsCard infra={infra} />
          </section>
          <ContainerLogsCard infra={infra} />
        </>
      ) : (
        <InfraTabScaffold tab={activeTab} onCreate={onCreate} />
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

function ContainerDetailsCard({ infra }: { infra: OrshipInfraRecord }) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>Container details</CardDescription>
            <CardTitle className="mt-3 text-base">{infra.detail.containerName}</CardTitle>
          </div>
          <StatusPill label={infra.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <p className="font-medium text-primary">{infra.detail.port}:{infra.detail.port}</p>
          <p className="font-medium text-primary">Terminal</p>
        </div>
        <MetricGrid
          items={[
            ["CPU", infra.metrics.find((metric) => metric.label === "CPU usage")?.value ?? "0%"],
            ["RAM", infra.metrics.find((metric) => metric.label === "Memory usage")?.value ?? "0 MB"],
            ["Incoming traffic", infra.metrics.find((metric) => metric.label === "Incoming traffic")?.value ?? "0 GB"],
            ["Outgoing traffic", infra.metrics.find((metric) => metric.label === "Outgoing traffic")?.value ?? "0 GB"],
            ["Root user", infra.detail.rootUser],
            ["Password", infra.detail.rootPasswordHidden],
            ["Connection", infra.detail.connectionStrength],
            ["Latency", `${infra.detail.latencyMs} ms`],
          ]}
        />
      </CardContent>
    </Card>
  );
}

function ContainerLogsCard({ infra }: { infra: OrshipInfraRecord }) {
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
            {infra.logs.map((log) => `[${log.time}] ${infra.detail.containerName}: [${log.level}] ${log.line}`).join("\n")}
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
  return (
    <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium capitalize text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
      {label}
    </span>
  );
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

function visibleMetrics(metrics: OrshipInfraMetric[]): OrshipInfraMetric[] {
  const labels = ["CPU usage", "Memory usage", "Outgoing traffic", "Disk usage"];
  return labels.flatMap((label) => metrics.find((metric) => metric.label === label) ?? []);
}
