import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { PlayIcon, PlusIcon, RotateCwIcon, SquareIcon } from "lucide-react";
import { fetchDockerContainers, fetchDockerSnapshot, runDockerContainerAction, type DockerContainer, type DockerContainerAction } from "./infras-api";
import { MariaDBController } from "./mariadb-controller";

export type InfraShowTab = "details" | "maintenance" | "notes";

type InfraTabsProps = {
  readonly activeTab: InfraShowTab;
  readonly onTabChange: (tab: InfraShowTab) => void;
};

type InfraTabScaffoldProps = {
  readonly onCreate: () => void;
  readonly request: typeof fetch;
  readonly tab: Exclude<InfraShowTab, "details">;
};

const tabs: Array<{ label: string; value: InfraShowTab }> = [
  { label: "Details", value: "details" },
  { label: "Maintenance", value: "maintenance" },
  { label: "Notes", value: "notes" },
];

export function InfraTabs({ activeTab, onTabChange }: InfraTabsProps) {
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.value === activeTab));

  return (
    <div className="relative grid w-fit grid-cols-3 rounded-lg border bg-background p-1">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 rounded-md bg-muted transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(${activeIndex * 100}%)`, width: "calc((100% - 0.5rem) / 3)" }}
      />
      {tabs.map((tab) => (
        <button
          className="relative z-10 h-8 min-w-28 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors data-[active=true]:text-foreground"
          data-active={activeTab === tab.value}
          key={tab.value}
          type="button"
          onClick={() => onTabChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function InfraTabScaffold({ onCreate, request, tab }: InfraTabScaffoldProps) {
  if (tab === "maintenance") return <MaintenancePanel onCreate={onCreate} request={request} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Capture operator notes, runbook context, and follow-up decisions for this infra record.</CardDescription>
      </CardHeader>
    </Card>
  );
}

function MaintenancePanel({ onCreate, request }: { onCreate: () => void; request: typeof fetch }) {
  const [filter, setFilter] = useState("");
  const queryClient = useQueryClient();
  const containers = useQuery({
    queryKey: ["orship", "docker", "containers"],
    queryFn: () => fetchDockerContainers(request),
    refetchInterval: 10_000,
  });
  const action = useMutation({
    mutationFn: ({ id, name }: { id: string; name: DockerContainerAction }) => runDockerContainerAction(request, id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orship", "docker", "containers"] }),
  });
  const filteredContainers = containers.data?.filter((container) =>
    `${container.name} ${container.image}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
  );

  return (
    <div className="grid gap-4">
      <MariaDBController request={request} />
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Docker maintenance</CardTitle>
              <CardDescription className="mt-1">Live containers from the connected Docker host.</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" type="button" onClick={onCreate}>
                <PlusIcon />
                Create New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Input aria-label="Filter Docker containers" placeholder="Filter by name or image" value={filter} onChange={(event) => setFilter(event.target.value)} />
          {containers.isPending ? <p className="text-sm text-muted-foreground">Connecting to Docker...</p> : null}
          {containers.isError ? <p role="alert" className="text-sm text-destructive">{containers.error.message}</p> : null}
          {action.isError ? <p role="alert" className="text-sm text-destructive">{action.error.message}</p> : null}
          {containers.data && filteredContainers?.length === 0 ? <p className="text-sm text-muted-foreground">No Docker containers match this filter.</p> : null}
          <section className="grid gap-3" aria-label="Docker target list">
            {filteredContainers?.map((container) => (
              <DockerTargetRow
                busy={action.isPending}
                container={container}
                key={container.id}
                onAction={(name) => action.mutate({ id: container.id, name })}
                request={request}
              />
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function DockerTargetRow({
  busy,
  container,
  onAction,
  request,
}: {
  busy: boolean;
  container: DockerContainer;
  onAction: (action: DockerContainerAction) => void;
  request: typeof fetch;
}) {
  const running = container.state === "running";
  const snapshot = useQuery({
    enabled: running,
    queryKey: ["orship", "docker", "snapshot", container.id],
    queryFn: () => fetchDockerSnapshot(request, container.id),
    refetchInterval: 10_000,
  });

  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="grid min-w-0 gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-all font-medium">{container.name || container.id.slice(0, 12)}</span>
          <Badge variant={running ? "default" : "outline"}>{container.state}</Badge>
        </span>
        <span className="break-all text-sm text-muted-foreground">{container.image} · {container.status}</span>
        <span className="text-xs text-muted-foreground">{formatPorts(container)}</span>
        {snapshot.data ? <span className="text-xs text-muted-foreground">{formatSnapshotMetrics(snapshot.data.metrics.cpuPercent, snapshot.data.metrics.memoryPercent)}</span> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {running ? (
          <>
            <Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("restart")}>
              <RotateCwIcon />
              Restart
            </Button>
            <Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("stop")}>
              <SquareIcon />
              Stop
            </Button>
          </>
        ) : (
          <Button disabled={busy} size="sm" type="button" variant="outline" onClick={() => onAction("start")}>
            <PlayIcon />
            Start
          </Button>
        )}
      </div>
    </div>
  );
}

function formatSnapshotMetrics(cpuPercent: number, memoryPercent: number): string {
  return `CPU ${cpuPercent.toFixed(1)}% · Memory ${memoryPercent.toFixed(1)}%`;
}

function formatPorts(container: DockerContainer): string {
  if (container.ports.length === 0) return "No published ports";
  return container.ports.map((port) => port.publicPort
    ? `${port.ip ? `${port.ip}:` : ""}${port.publicPort}->${port.privatePort}/${port.type}`
    : `${port.privatePort}/${port.type}`,
  ).join(", ");
}
