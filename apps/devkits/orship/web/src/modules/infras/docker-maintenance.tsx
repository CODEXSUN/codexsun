import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { PlayIcon, RotateCwIcon, SquareIcon } from "lucide-react";
import { useState } from "react";
import { fetchDockerContainers, fetchDockerSnapshot, runDockerContainerAction, type DockerContainer, type DockerContainerAction } from "./infras-api";

export function DockerMaintenancePage({ request }: { request: typeof fetch }) {
  const [filter, setFilter] = useState("");
  const queryClient = useQueryClient();
  const containers = useQuery({
    queryKey: ["orship", "docker", "containers"],
    queryFn: () => fetchDockerContainers(request),
    refetchInterval: 5_000,
  });
  const action = useMutation({
    mutationFn: ({ id, name }: { id: string; name: DockerContainerAction }) => runDockerContainerAction(request, id, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["orship", "docker", "containers"] }),
  });
  const filteredContainers = containers.data?.filter((container) =>
    `${container.name} ${container.image}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()),
  );

  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Runtime operations</p>
          <div className="grid gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">Docker maintenance</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Inspect and control live containers from the connected Docker host.</p>
          </div>
        </header>
        <Card>
          <CardHeader>
            <CardTitle>Containers</CardTitle>
            <CardDescription>Live state, published ports, and resource snapshots.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Input aria-label="Filter Docker containers" placeholder="Filter by name or image" value={filter} onChange={(event) => setFilter(event.target.value)} />
            {containers.isPending ? <p className="text-sm text-muted-foreground">Connecting to Docker...</p> : null}
            {containers.isError ? <p role="alert" className="text-sm text-destructive">{containers.error.message}</p> : null}
            {action.isError ? <p role="alert" className="text-sm text-destructive">{action.error.message}</p> : null}
            {containers.data && filteredContainers?.length === 0 ? <p className="text-sm text-muted-foreground">No Docker containers match this filter.</p> : null}
            <section className="grid gap-3" aria-label="Docker container list">
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
      </section>
    </main>
  );
}

function DockerTargetRow({ busy, container, onAction, request }: { busy: boolean; container: DockerContainer; onAction: (action: DockerContainerAction) => void; request: typeof fetch }) {
  const running = container.state === "running";
  const snapshot = useQuery({
    enabled: running,
    queryKey: ["orship", "docker", "snapshot", container.id],
    queryFn: () => fetchDockerSnapshot(request, container.id),
    refetchInterval: 5_000,
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
