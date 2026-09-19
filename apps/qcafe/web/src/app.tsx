import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";

type Health = { status: "ok"; providers: string[] };

export function App() {
  const health = useQuery({ queryKey: ["qcafe", "health"], queryFn: readHealth });
  return <MainWorkspace applicationId="qcafe" applicationName="Q Cafe" workspaceTitle="Q Cafe"><main className="p-6"><h1 className="text-lg font-semibold">Q Cafe</h1><p className="text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : `API ready: ${health.data.status}`}</p></main></MainWorkspace>;
}

async function readHealth(): Promise<Health> {
  const response = await fetch("/api/v1/qcafe/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
