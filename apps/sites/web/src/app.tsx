import { lazy, Suspense } from "react";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { LayoutDashboardIcon } from "lucide-react";
import { SitesOrganizer } from "./shared/sites-organizer";
import { ContentEditor } from "./shared/content-editor";

const ClientsPortal = lazy(() => import("./Clients"));

export function App() {
  const standaloneSlug = normalizeStandaloneSlug(import.meta.env.VITE_SITES_CLIENT_SLUG);
  if (standaloneSlug || window.location.pathname.startsWith("/clients"))
    return (
      <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
        <ClientsPortal standaloneSlug={standaloneSlug} />
      </Suspense>
    );
  return (
    <SessionBoundary
      applicationId="sites"
      applicationName="Sites Studio"
      autoLoginPath="/api/v1/sites/auth/development-login"
      loginPath="/api/v1/sites/auth/login"
    >
      {(session) =>
        session.portal === "user" ? (
          <SitesDesk request={session.fetch} logout={session.logout} />
        ) : session.portal === "super-admin" ? (
          <IdentityManagementDesk
            applicationId="sites"
            applicationName="Sites Studio"
            logout={session.logout}
            request={session.fetch}
          />
        ) : (
          <PrivilegedDesk
            applicationId="sites"
            applicationName="Sites Studio"
            logout={session.logout}
            portal={session.portal}
          />
        )
      }
    </SessionBoundary>
  );
}

function normalizeStandaloneSlug(value: string | undefined): string | undefined {
  const slug = value?.trim().toLowerCase();
  return slug && /^[a-z0-9-]+$/u.test(slug) ? slug : undefined;
}

function SitesDesk({ request, logout }: { request: typeof fetch; logout: () => void }) {
  const editorSlug = window.location.pathname.match(/^\/studio\/content\/([a-z0-9-]+)$/u)?.[1];
  return (
    <MainWorkspace
      applicationId="sites"
      applicationName="Sites Studio"
      primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }}
      user={{ initials: "S", name: "Sites user", onSignOut: logout }}
      contentClassName="overflow-visible"
      workspaceTitle="Sites Studio"
    >
      {editorSlug ? <ContentEditor request={request} slug={editorSlug} /> : <SitesOrganizer request={request} />}
    </MainWorkspace>
  );
}
