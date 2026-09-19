import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  const health = useQuery({ queryKey: ["crm", "health"], queryFn: readHealth });

  return (
    <MainWorkspace
      applicationId="crm"
      applicationName="CRM"
      primaryAction={{
        icon: LayoutDashboardIcon,
        label: "Overview",
      }}
      statusLabel={statusLabel(health)}
      workspaceTitle="Overview"
    >
      <main className="p-6">
        <h1 className="text-lg font-semibold">CRM overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start with customer accounts, sales activity, and service work in one CRM workspace.</p>
        <p className="mt-3 text-sm text-muted-foreground">{statusMessage(health)}</p>
      </main>
    </MainWorkspace>
  );
}

function statusLabel(health: ReturnType<typeof useQuery<Health>>): string {
  if (health.isPending) return "Connecting";
  if (health.isError) return "API offline";
  return `API ${health.data.status}`;
}

function statusMessage(health: ReturnType<typeof useQuery<Health>>): string {
  if (health.isPending) return "Connecting to API…";
  if (health.isError) return "API connection failed.";
  return `API ready: ${health.data.status}`;
}

async function readHealth(): Promise<Health> {
  const response = await fetch("/api/v1/crm/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
