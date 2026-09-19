import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  const health = useQuery({ queryKey: ["himsx", "health"], queryFn: readHealth });
  return <MainWorkspace applicationId="himsx" applicationName="HIMSX" primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">HIMSX overview</h1><p className="mt-1 text-sm text-muted-foreground">Start hospital operations with patient, clinical, and service modules in one workspace.</p><p className="mt-3 text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : `API ready: ${health.data.status}`}</p></main></MainWorkspace>;
}

async function readHealth(): Promise<Health> {
  const response = await fetch("/api/v1/himsx/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
