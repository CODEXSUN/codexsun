import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { useQuery } from "@tanstack/react-query";

export function App() {
  return (
    <SessionBoundary
      applicationId="billing"
      applicationName="Billing"
      autoLoginPath="/api/v1/billing/auth/development-login"
      loginPath="/api/v1/billing/auth/login"
    >
      {(session) =>
        session.portal === "super-admin" ? (
          <IdentityManagementDesk
            applicationId="billing"
            applicationName="Billing"
            logout={session.logout}
            request={session.fetch}
          />
        ) : session.portal === "admin" ? (
          <PrivilegedDesk
            applicationId="billing"
            applicationName="Billing"
            logout={session.logout}
            portal={session.portal}
          />
        ) : (
          <Desk logout={session.logout} request={session.fetch} roles={session.roles} />
        )
      }
    </SessionBoundary>
  );
}

function Desk({
  logout,
  request,
  roles,
}: {
  logout(): void;
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
  roles: readonly string[];
}) {
  const workspace = useQuery({
    queryKey: ["billing", "workspace"],
    queryFn: async () => {
      const response = await request("/api/v1/billing/workspace");
      if (!response.ok) throw new Error("Billing workspace is unavailable.");
      return response.json() as Promise<{
        state: "ready";
        modules: Array<{ id: string; state: "active" }>;
        identity: { provider: string; roles: string[] };
      }>;
    },
  });
  const role = roles.includes("admin") ? "Administrator" : "Billing user";

  return (
    <MainWorkspace
      applicationId="billing"
      applicationName="Billing"
      primaryAction={{ label: "Overview" }}
      user={{ initials: "B", name: role, onSignOut: logout }}
      workspaceTitle="Overview"
    >
      <main className="space-y-6 p-6">
        <header>
          <p className="text-sm font-medium text-muted-foreground">Billing workspace</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Foundation ready</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Identity and workspace boundaries are prepared for the first Billing business module.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-3">
          <WorkspaceCard
            label="Workspace"
            value={workspace.isPending ? "Loading" : workspace.isError ? "Unavailable" : workspace.data.state}
          />
          <WorkspaceCard
            label="Identity"
            value={workspace.isError ? "Unavailable" : (workspace.data?.identity.provider ?? "Checking")}
          />
          <WorkspaceCard label="Modules" value={workspace.data?.modules.length.toString() ?? "—"} />
        </section>
      </main>
    </MainWorkspace>
  );
}

function WorkspaceCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
