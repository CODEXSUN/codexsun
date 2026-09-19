import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { LayoutDashboardIcon, ServerCogIcon } from "lucide-react";
import { useState } from "react";
import { InfrasWorkspace } from "./modules/infras/infras-workspace";

type Health = { status: "ok"; providers: string[] };
type WorkspacePage = "overview" | "infras-list" | "infras-show" | "infras-upsert";

type OverviewItem = {
  readonly description: string;
  readonly label: string;
  readonly value: string;
};

const overviewItems: OverviewItem[] = [
  {
    description: "Prepare and follow application releases from one operations workspace.",
    label: "Deployment",
    value: "Scaffold",
  },
  {
    description: "Track API, web, database, cache, and storage service health.",
    label: "Monitoring",
    value: "Ready",
  },
  {
    description: "Plan restart, backup, restore, and check tasks with an audit trail.",
    label: "Maintenance",
    value: "Planned",
  },
];

export function App() {
  const health = useQuery({ queryKey: ["orship", "health"], queryFn: readHealth });
  const [page, setPage] = useState<WorkspacePage>("overview");
  const [selectedInfraUuid, setSelectedInfraUuid] = useState<string>();

  function showInfrasList(): void {
    setSelectedInfraUuid(undefined);
    setPage("infras-list");
  }

  function showInfra(uuid: string): void {
    setSelectedInfraUuid(uuid);
    setPage("infras-show");
  }

  function showInfrasUpsert(): void {
    setSelectedInfraUuid(undefined);
    setPage("infras-upsert");
  }

  return (
    <MainWorkspace
      applicationId="orship"
      applicationName="Orship"
      navigation={[
        {
          items: [
            {
              active: page === "overview",
              icon: LayoutDashboardIcon,
              label: "Overview",
              onSelect: () => setPage("overview"),
            },
          ],
        },
        {
          items: [
            {
              active: page.startsWith("infras"),
              icon: ServerCogIcon,
              label: "Infras",
              onSelect: showInfrasList,
            },
          ],
        },
      ]}
      primaryAction={null}
      showTopologyTools={false}
      statusLabel={statusLabel(health)}
      workspaceTitle={page === "overview" ? "Overview" : page === "infras-list" ? "Infras" : page === "infras-upsert" ? "Create infra" : "Infra details"}
    >
      {page === "overview" ? (
        <OverviewPage health={health} />
      ) : (
        <InfrasWorkspace
          selectedUuid={selectedInfraUuid}
          view={page}
          onBack={showInfrasList}
          onCreate={showInfrasUpsert}
          onSaved={(uuid) => showInfra(uuid)}
          onSelect={showInfra}
        />
      )}
    </MainWorkspace>
  );
}

function OverviewPage({ health }: { health: ReturnType<typeof useQuery<Health>> }) {
  return (
    <main className="size-full overflow-y-auto bg-background p-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Orship overview</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="grid gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Orship</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                Orchestration workspace for deployment, monitoring, and maintenance.
              </p>
            </div>
            <StatusPill label={statusLabel(health)} />
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3" aria-label="Orship scaffold">
          {overviewItems.map((item) => (
            <Card key={item.label} className="h-full">
              <CardHeader>
                <CardDescription>{item.label}</CardDescription>
                <CardTitle className="text-xl">{item.value}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    </main>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex h-7 shrink-0 items-center rounded-md border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-medium text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
      {label}
    </span>
  );
}

function statusLabel(health: ReturnType<typeof useQuery<Health>>): string {
  if (health.isPending) return "Connecting";
  if (health.isError) return "API offline";
  return `API ${health.data.status}`;
}

async function readHealth(): Promise<Health> {
  const response = await fetch("/api/v1/orship/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
