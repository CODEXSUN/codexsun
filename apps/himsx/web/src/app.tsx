import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  return <SessionBoundary applicationId="himsx" applicationName="HIMSX" autoLoginPath="/api/v1/himsx/auth/development-login" loginPath="/api/v1/himsx/auth/login">{(session) => session.portal === "user" ? <HimsxDesk request={session.fetch} logout={session.logout} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="himsx" applicationName="HIMSX" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="himsx" applicationName="HIMSX" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}

function HimsxDesk({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const health = useQuery({ queryKey: ["himsx", "health"], queryFn: () => readHealth(request) });
  return <MainWorkspace applicationId="himsx" applicationName="HIMSX" primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }} user={{ initials: "H", name: "HIMSX user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">HIMSX overview</h1><p className="mt-1 text-sm text-muted-foreground">Start hospital operations with patient, clinical, and service modules in one workspace.</p><p className="mt-3 text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : `API ready: ${health.data.status}`}</p></main></MainWorkspace>;
}

async function readHealth(request: typeof fetch): Promise<Health> {
  const response = await request("/api/v1/himsx/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
