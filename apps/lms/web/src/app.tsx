import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  return <SessionBoundary applicationId="lms" applicationName="LMS" autoLoginPath="/api/v1/lms/auth/development-login" loginPath="/api/v1/lms/auth/login">{(session) => session.portal === "user" ? <LmsDesk request={session.fetch} logout={session.logout} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="lms" applicationName="LMS" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="lms" applicationName="LMS" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}

function LmsDesk({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const health = useQuery({ queryKey: ["lms", "health"], queryFn: () => readHealth(request) });
  return <MainWorkspace applicationId="lms" applicationName="LMS" primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }} user={{ initials: "L", name: "LMS user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">LMS overview</h1><p className="mt-1 text-sm text-muted-foreground">Start learning operations with course, learner, assessment, and reporting modules.</p><p className="mt-3 text-sm text-muted-foreground">{health.isPending ? "Connecting to API…" : health.isError ? "API connection failed." : `API ready: ${health.data.status}`}</p></main></MainWorkspace>;
}

async function readHealth(request: typeof fetch): Promise<Health> {
  const response = await request("/api/v1/lms/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
