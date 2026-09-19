import { useState } from "react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { PlayIcon, PlusIcon, SquareIcon, Trash2Icon } from "lucide-react";

export type InfraShowTab = "details" | "maintenance" | "notes";

type InfraTabsProps = {
  readonly activeTab: InfraShowTab;
  readonly onTabChange: (tab: InfraShowTab) => void;
};

type InfraTabScaffoldProps = {
  readonly onCreate: () => void;
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

export function InfraTabScaffold({ onCreate, tab }: InfraTabScaffoldProps) {
  if (tab === "maintenance") return <MaintenancePanel onCreate={onCreate} />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Capture operator notes, runbook context, and follow-up decisions for this infra record.</CardDescription>
      </CardHeader>
    </Card>
  );
}

type DockerTarget = {
  readonly image: string;
  readonly name: string;
  readonly ports: string;
  readonly status: "running" | "stopped";
};

const dockerTargets: DockerTarget[] = [
  { image: "mariadb:11", name: "orship-mariadb", ports: "3306:3306", status: "running" },
  { image: "redis:7", name: "orship-redis", ports: "6379:6379", status: "running" },
  { image: "filebrowser/filebrowser", name: "orship-file-browser", ports: "8080:8080", status: "stopped" },
];

function MaintenancePanel({ onCreate }: { onCreate: () => void }) {
  const [dockerName, setDockerName] = useState("orship-mariadb");

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Docker maintenance</CardTitle>
              <CardDescription className="mt-1">Manage existing Docker services or prepare a new install feeder.</CardDescription>
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
          <label className="grid gap-2 text-sm font-medium">
            Existing or new Docker name
            <Input value={dockerName} placeholder="orship-mariadb" onChange={(event) => setDockerName(event.target.value)} />
          </label>
          <section className="grid gap-3" aria-label="Docker target list">
            {dockerTargets.map((target) => (
              <DockerTargetRow key={target.name} target={target} onSelect={setDockerName} />
            ))}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}

function DockerTargetRow({ target, onSelect }: { target: DockerTarget; onSelect: (name: string) => void }) {
  return (
    <div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <button className="grid gap-1 text-left" type="button" onClick={() => onSelect(target.name)}>
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{target.name}</span>
          <Badge variant={target.status === "running" ? "default" : "outline"}>{target.status}</Badge>
        </span>
        <span className="text-sm text-muted-foreground">{target.image} · {target.ports}</span>
      </button>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" type="button" variant="outline">
          <PlayIcon />
          Start
        </Button>
        <Button size="sm" type="button" variant="outline">
          <SquareIcon />
          Stop
        </Button>
        <Button size="sm" type="button" variant="destructive">
          <Trash2Icon />
          Drop
        </Button>
      </div>
    </div>
  );
}
