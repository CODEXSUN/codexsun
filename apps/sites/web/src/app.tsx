import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  const health = useQuery({ queryKey: ["sites", "health"], queryFn: readHealth });
  return <MainWorkspace applicationId="sites" applicationName="Sites" primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">Sites overview</h1><p className="mt-1 text-sm text-muted-foreground">Start site delivery with page, content, theme, and publishing modules.</p><p className="mt-3 text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : `API ready: ${health.data.status}`}</p></main></MainWorkspace>;
}

async function readHealth(): Promise<Health> {
  const response = await fetch("/api/v1/sites/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
