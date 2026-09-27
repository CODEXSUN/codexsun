import { lazy, Suspense, useState } from "react";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import {
  ActivityIcon,
  BoxesIcon,
  DatabaseIcon,
  LayoutDashboardIcon,
  PaletteIcon,
  PanelsTopLeftIcon,
  RocketIcon,
} from "lucide-react";
import { ContentEditor, ContentPreview } from "./shared/content-editor";
import { SitesStudio } from "./shared/sites-studio";
import type { MdiNavigationSection } from "@codexsun/ui/layouts/main-workspace";

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
  const [section, setSection] = useState<
    "overview" | "clients" | "delivery" | "design" | "forms" | "backoffice" | "activity"
  >("overview");
  const [selectedSlug, setSelectedSlug] = useState<string>();
  const editorSlug = window.location.pathname.match(/^\/studio\/content\/([a-z0-9-]+)$/u)?.[1];
  const previewSlug = window.location.pathname.match(/^\/studio\/content\/([a-z0-9-]+)\/preview$/u)?.[1];
  const navigation: MdiNavigationSection[] = [
    {
      label: "Studio",
      items: [
        {
          active: section === "overview",
          icon: LayoutDashboardIcon,
          label: "Overview",
          onSelect: () => {
            setSection("overview");
            setSelectedSlug(undefined);
          },
        },
        { active: section === "clients", icon: BoxesIcon, label: "Clients", onSelect: () => setSection("clients") },
        { active: section === "delivery", icon: RocketIcon, label: "Delivery", onSelect: () => setSection("delivery") },
        {
          active: section === "design",
          icon: PaletteIcon,
          label: "Design system",
          onSelect: () => setSection("design"),
        },
        { active: section === "forms", icon: PanelsTopLeftIcon, label: "Forms", onSelect: () => setSection("forms") },
        {
          active: section === "backoffice",
          icon: DatabaseIcon,
          label: "Back office",
          onSelect: () => setSection("backoffice"),
        },
        {
          active: section === "activity",
          icon: ActivityIcon,
          label: "Activity",
          onSelect: () => setSection("activity"),
        },
      ],
    },
  ];
  return (
    <MainWorkspace
      applicationId="sites"
      applicationName="Sites Studio"
      navigation={navigation}
      primaryAction={{ icon: BoxesIcon, label: "Clients", onSelect: () => setSection("clients") }}
      user={{ initials: "S", name: "Sites user", onSignOut: logout }}
      contentClassName="overflow-visible"
      workspaceTitle="Sites Studio"
    >
      {previewSlug ? (
        <ContentPreview request={request} slug={previewSlug} />
      ) : editorSlug ? (
        <ContentEditor request={request} slug={editorSlug} />
      ) : (
        <SitesStudio
          request={request}
          section={section}
          selectedSlug={selectedSlug}
          onSelectClient={(slug) => {
            setSelectedSlug(slug || undefined);
            setSection("clients");
          }}
        />
      )}
    </MainWorkspace>
  );
}
