import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";

export function App() {
  return <SessionBoundary applicationId="hrms" applicationName="HRMS" autoLoginPath="/api/v1/hrms/auth/development-login" loginPath="/api/v1/hrms/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="hrms" applicationName="HRMS" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="hrms" applicationName="HRMS" logout={session.logout} portal={session.portal} /> : <Desk logout={session.logout} />}
  </SessionBoundary>;
}

function Desk({ logout }: { logout(): void }) {
  return <MainWorkspace applicationId="hrms" applicationName="HRMS" primaryAction={{ label: "Overview" }} user={{ initials: "H", name: "HRMS user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">HRMS overview</h1><p className="mt-1 text-sm text-muted-foreground">Start with application-owned modules and shared identity access.</p></main></MainWorkspace>;
}
