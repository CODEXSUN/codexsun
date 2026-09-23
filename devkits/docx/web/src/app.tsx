import { DocxDocumentationPortal } from "./modules/documentation-portal/documentation-portal";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";

export function App() {
  return <SessionBoundary applicationId="docx" applicationName="DOCX" autoLoginPath="/api/v1/docx/auth/development-login" loginPath="/api/v1/docx/auth/login">{(session) => session.portal === "user" ? <DocxDocumentationPortal logout={session.logout} /> : session.portal === "super-admin" ? <IdentityManagementDesk applicationId="docx" applicationName="DOCX" logout={session.logout} request={session.fetch} /> : <PrivilegedDesk applicationId="docx" applicationName="DOCX" logout={session.logout} portal={session.portal} />}</SessionBoundary>;
}
