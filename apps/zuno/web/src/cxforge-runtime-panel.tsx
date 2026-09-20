import { Button } from "@codexsun/ui/components/button";
import { HammerIcon, PlayIcon, RefreshCwIcon, RotateCwIcon, SquareIcon } from "lucide-react";
import type { CxforgeRuntimeAction, CxforgeRuntimeStatus } from "./cxforge-api";

interface CxforgeRuntimePanelProps {
  readonly busyAction: CxforgeRuntimeAction | null;
  readonly logs: readonly string[];
  readonly message: string | null;
  readonly onAction: (action: CxforgeRuntimeAction) => void;
  readonly onRefresh: () => void;
  readonly status: CxforgeRuntimeStatus | null;
}

export function CxforgeRuntimePanel({ busyAction, logs, message, onAction, onRefresh, status }: CxforgeRuntimePanelProps) {
  const installed = status?.container.installed === true;
  const running = status?.container.running === true;
  return <div className="flex flex-col gap-7">
    <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
      <div><h2 className="text-lg font-semibold">Local CXForge runtime</h2><p className="mt-1 text-sm text-muted-foreground">Zuno manages the fixed local Compose project used for development.</p></div>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busyAction !== null || !status?.dockerAvailable} onClick={() => onAction("install")} size="sm"><PlayIcon />{installed ? "Rebuild & apply" : "Install"}</Button>
        <Button disabled={busyAction !== null || !status?.dockerAvailable} onClick={() => onAction("build")} size="sm" variant="outline"><HammerIcon />Build image</Button>
        {installed && !running ? <Button disabled={busyAction !== null} onClick={() => onAction("start")} size="sm"><PlayIcon />Start</Button> : null}
        {running ? <Button disabled={busyAction !== null} onClick={() => onAction("restart")} size="sm" variant="outline"><RotateCwIcon />Restart</Button> : null}
        {running ? <Button disabled={busyAction !== null} onClick={() => onAction("stop")} size="sm" variant="outline"><SquareIcon />Stop</Button> : null}
        <Button aria-label="Refresh runtime" disabled={busyAction !== null} onClick={onRefresh} size="icon-sm" title="Refresh runtime" variant="ghost"><RefreshCwIcon /></Button>
      </div>
    </div>

    {message ? <p className="text-sm text-muted-foreground" role="status">{message}</p> : null}
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <RuntimeMetric detail={status?.dockerVersion ?? "Docker daemon unavailable"} label="Docker" value={status?.dockerAvailable ? "Ready" : "Offline"} />
      <RuntimeMetric detail={status?.composeVersion ?? status?.composeFile ?? "Compose unavailable"} label="Compose" value={status?.composeVersion ? "Ready" : "Unavailable"} />
      <RuntimeMetric detail={status?.container.image ?? status?.container.name ?? "cxforge"} label="Container" value={status?.container.state ?? "Unknown"} />
      <RuntimeMetric detail={status?.container.id ?? status?.projectName ?? "cxforgefresh"} label="Health" value={status?.container.health ?? (running ? "starting" : "inactive")} />
    </div>

    <section>
      <h3 className="text-sm font-semibold">Development toolchain</h3>
      <div className="mt-3 divide-y divide-border border-y border-border">
        {toolRows(status).map(([name, version]) => <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-4 py-3 text-sm" key={name}><span className="font-medium">{name}</span><code className="truncate text-xs text-muted-foreground" title={version}>{version}</code></div>)}
      </div>
    </section>

    <section>
      <h3 className="text-sm font-semibold">Recent container logs</h3>
      <pre className="mt-3 max-h-72 overflow-auto border border-border bg-muted/20 p-4 text-xs leading-5 text-muted-foreground">{logs.length ? logs.join("\n") : "No CXForge logs available."}</pre>
    </section>
  </div>;
}

function RuntimeMetric({ detail, label, value }: { readonly detail: string; readonly label: string; readonly value: string }) {
  return <div className="border-l-2 border-foreground/80 pl-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold capitalize">{value}</p><p className="mt-1 truncate text-xs text-muted-foreground" title={detail}>{detail}</p></div>;
}

function toolRows(status: CxforgeRuntimeStatus | null): [string, string][] {
  return [
    ["Go", status?.toolchain.go ?? "Unavailable"],
    ["Node.js", status?.toolchain.node ?? "Unavailable"],
    ["npm", status?.toolchain.npm ?? "Unavailable"],
    ["Python", status?.toolchain.python ?? "Unavailable"],
    ["Git", status?.toolchain.git ?? "Unavailable"],
  ];
}
