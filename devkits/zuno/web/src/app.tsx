import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { WorkerWorkspace } from "./worker-workspace";

export function App() {
  return <SessionBoundary applicationId="zuno" applicationName="Zuno" autoLoginPath="/api/v1/zuno/auth/development-login" loginPath="/api/v1/zuno/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="zuno" applicationName="Zuno" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="zuno" applicationName="Zuno" logout={session.logout} portal={session.portal} /> : <WorkerWorkspace logout={session.logout} request={session.fetch} />}
  </SessionBoundary>;
}
