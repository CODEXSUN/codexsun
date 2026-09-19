import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { LayoutDashboardIcon } from "lucide-react";

type Health = { status: "ok"; providers: string[] };

export function App() {
  return <SessionBoundary applicationId="crm" applicationName="CRM" autoLoginPath="/api/v1/crm/auth/development-login" loginPath="/api/v1/crm/auth/login">{(session) => session.portal === "user" ? <CrmDesk request={session.fetch} logout={session.logout} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="crm" applicationName="CRM" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="crm" applicationName="CRM" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}

function CrmDesk({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const health = useQuery({ queryKey: ["crm", "health"], queryFn: () => readHealth(request) });

  return (
    <MainWorkspace
      applicationId="crm"
      applicationName="CRM"
      user={{ initials: "C", name: "CRM user", onSignOut: logout }}
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

async function readHealth(request: typeof fetch): Promise<Health> {
  const response = await request("/api/v1/crm/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
