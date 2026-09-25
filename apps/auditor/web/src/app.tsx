import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";

export function App() {
  return <SessionBoundary applicationId="auditor" applicationName="Auditor" autoLoginPath="/api/v1/auditor/auth/development-login" loginPath="/api/v1/auditor/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="auditor" applicationName="Auditor" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="auditor" applicationName="Auditor" logout={session.logout} portal={session.portal} /> : <Desk logout={session.logout} />}
  </SessionBoundary>;
}

function Desk({ logout }: { logout(): void }) {
  return <MainWorkspace applicationId="auditor" applicationName="Auditor" primaryAction={{ label: "Overview" }} user={{ initials: "A", name: "Auditor user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">Auditor overview</h1><p className="mt-1 text-sm text-muted-foreground">Start with application-owned modules and shared identity access.</p></main></MainWorkspace>;
}
