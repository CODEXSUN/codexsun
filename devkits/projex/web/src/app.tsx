import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { ProjexDashboard } from "./projex-dashboard";

export function App() {
  return <SessionBoundary applicationId="projex" applicationName="Projex" autoLoginPath="/api/v1/projex/auth/development-login" loginPath="/api/v1/projex/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="projex" applicationName="Projex" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="projex" applicationName="Projex" logout={session.logout} portal={session.portal} /> : <ProjexDashboard logout={session.logout} request={session.fetch} />}
  </SessionBoundary>;
}
