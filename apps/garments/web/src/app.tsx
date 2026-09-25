import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";

export function App() {
  return <SessionBoundary applicationId="garments" applicationName="Garments" autoLoginPath="/api/v1/garments/auth/development-login" loginPath="/api/v1/garments/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="garments" applicationName="Garments" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="garments" applicationName="Garments" logout={session.logout} portal={session.portal} /> : <Desk logout={session.logout} />}
  </SessionBoundary>;
}

function Desk({ logout }: { logout(): void }) {
  return <MainWorkspace applicationId="garments" applicationName="Garments" primaryAction={{ label: "Overview" }} user={{ initials: "G", name: "Garments user", onSignOut: logout }} workspaceTitle="Overview"><main className="p-6"><h1 className="text-lg font-semibold">Garments overview</h1><p className="mt-1 text-sm text-muted-foreground">Start with application-owned modules and shared identity access.</p></main></MainWorkspace>;
}
