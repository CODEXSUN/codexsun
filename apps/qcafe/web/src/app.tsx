import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { MainWorkspace, type MdiNavigationSection } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { Button } from "@codexsun/ui/components/button";
import { Badge } from "@codexsun/ui/components/badge";
import { LayoutDashboardIcon, BellIcon, PowerIcon, ShieldCheckIcon, WrenchIcon } from "lucide-react";
import { createQcafeNavigation, getQcafePages, QcafeWorkspaceView } from "./qcafe-workspace";
import { readWorkspace, type QcafePageId } from "./qcafe-api";
import { CashierLogin } from "./cashier-login";
import { PosPage } from "./pos-page";
import { readFoundationSetup } from "./foundation-setup-api";
import { readAlerts, reportQuery } from "./reports-api";
import { QcafeSettingsWorkspace } from "./settings-workspace";

export function App() {
  const [location, setLocation] = useState(readLocation);
  useEffect(() => {
    const listener = () => setLocation(readLocation());
    window.addEventListener("popstate", listener);
    return () => window.removeEventListener("popstate", listener);
  }, []);

  if (pathnameOf(location) === "/") return <QcafeHome onLogin={() => navigate("/login", setLocation)} />;
  const userPortal = !location.startsWith("/sa/") && !location.startsWith("/admin/");

  return (
    <SessionBoundary
      applicationId="qcafe"
      applicationName="Q Cafe"
      autoLoginPath={import.meta.env.DEV ? "/api/v1/qcafe/auth/development-login" : undefined}
      loginPath="/api/v1/qcafe/auth/login"
      logoutPath="/login"
      onAuthenticated={() => navigate(portalDeskPath(), setLocation)}
      unauthenticated={
        userPortal ? (
          <CashierLogin
            onSuccess={(session) =>
              navigate(session.actor.roles.includes("cashier") ? "/pos" : portalDeskPath(), setLocation)
            }
          />
        ) : undefined
      }
    >
      {(session) => (
        <QcafeAuthenticated
          location={location}
          portal={session.portal}
          request={session.fetch}
          roles={session.roles}
          logout={session.logout}
          onNavigate={(nextPath) => navigate(nextPath, setLocation)}
        />
      )}
    </SessionBoundary>
  );
}

function QcafeAuthenticated({
  location,
  portal,
  request,
  roles,
  logout,
  onNavigate,
}: {
  location: string;
  portal: "admin" | "super-admin" | "user";
  request: typeof fetch;
  roles: readonly string[];
  logout: () => void;
  onNavigate: (path: string) => void;
}) {
  if (portal === "super-admin")
    return <IdentityManagementDesk applicationId="qcafe" applicationName="Q Cafe" logout={logout} request={request} />;
  if (portal === "admin") return <QcafePrivilegedDesk portal={portal} logout={logout} />;
  useEffect(() => {
    if (pathnameOf(location) === "/login") onNavigate(roles.includes("cashier") ? "/pos" : "/overview");
  }, [location, onNavigate, roles]);
  if (roles.includes("cashier"))
    return <CashierPosDesk request={request} logout={logout} onNavigate={onNavigate} />;

  if (pathnameOf(location) === "/login") return null;
  return (
    <QcafeDesk activePageId={pageFromLocation(location)} request={request} logout={logout} onNavigate={onNavigate} />
  );
}

function CashierPosDesk({
  request,
  logout,
  onNavigate,
}: {
  request: typeof fetch;
  logout: () => void;
  onNavigate: (path: string) => void;
}) {
  useEffect(() => {
    document.title = "Q Cafe | Point of sale";
  }, []);
  useEffect(() => {
    if (pathnameOf(window.location.pathname) !== "/pos") onNavigate("/pos");
  }, [onNavigate]);
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-white px-3 dark:bg-card">
        <span className="grid size-6 place-items-center rounded border border-foreground/70 text-xs font-bold">☕</span>
        <span className="text-sm font-semibold tracking-tight">Q CAFE</span>
        <span className="mx-1 h-6 w-px bg-foreground/15" />
        <h1 className="px-1 text-sm font-semibold tracking-tight">Point of sale</h1>
        <div className="ml-auto flex items-center gap-2">
          <button type="button" aria-label="Notifications" className="relative grid size-9 cursor-pointer place-items-center rounded-md text-foreground/65 transition-colors hover:bg-accent hover:text-accent-foreground">
            <BellIcon size={18} />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-white" />
          </button>
          <span className="grid size-9 place-items-center rounded-full border bg-muted text-sm font-semibold">M</span>
          <Button size="sm" variant="outline" onClick={logout} className="gap-2">
            <PowerIcon size={16} />
            Exit
          </Button>
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <PosPage request={request} />
      </main>
    </div>
  );
}

function QcafePrivilegedDesk({ portal, logout }: { portal: "admin" | "super-admin"; logout: () => void }) {
  const navigation = portal === "super-admin" ? superAdminNavigation() : adminNavigation();
  const title = portal === "super-admin" ? "Q Cafe Super Admin Desk" : "Q Cafe Admin Desk";
  const description =
    portal === "super-admin"
      ? "Maintenance, platform controls, and higher-end operational reports."
      : "Manager controls, approvals, and operational reports.";
  useEffect(() => {
    document.title = `${title}`;
  }, [title]);
  return (
    <MainWorkspace
      applicationId="qcafe"
      applicationName="Q Cafe"
      navigation={navigation}
      primaryAction={null}
      user={{
        initials: portal === "super-admin" ? "SA" : "A",
        name: portal === "super-admin" ? "Super administrator" : "Administrator",
        onSignOut: logout,
      }}
      workspaceTitle={title}
    >
      <main className="p-6">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </main>
    </MainWorkspace>
  );
}

function adminNavigation(): MdiNavigationSection[] {
  return [
    { items: [{ active: true, icon: LayoutDashboardIcon, label: "Overview" }], label: "Desk" },
    {
      items: [
        { icon: ShieldCheckIcon, label: "Approvals" },
        { icon: LayoutDashboardIcon, label: "Reports" },
      ],
      label: "Administration",
    },
  ];
}

function superAdminNavigation(): MdiNavigationSection[] {
  return [
    { items: [{ active: true, icon: LayoutDashboardIcon, label: "Overview" }], label: "Maintenance" },
    {
      items: [
        { icon: WrenchIcon, label: "System maintenance" },
        { icon: ShieldCheckIcon, label: "Access audit" },
        { icon: LayoutDashboardIcon, label: "Higher-end reports" },
      ],
      label: "Platform",
    },
  ];
}

function QcafeDesk({
  activePageId,
  request,
  logout,
  onNavigate,
}: {
  activePageId: QcafePageId;
  request: typeof fetch;
  logout: () => void;
  onNavigate: (path: string) => void;
}) {
  const workspace = useQuery({ queryKey: ["qcafe", "workspace"], queryFn: () => readWorkspace(request) });
  const [settingsPageLabel, setSettingsPageLabel] = useState<string>();
  const pages = getQcafePages(workspace.data);
  const activePage = pages.find((page) => page.id === activePageId) ?? pages[0];
  const setup = useQuery({ queryKey: ["qcafe", "foundation", "setup"], queryFn: () => readFoundationSetup(request) });
  const alertBusiness = setup.data?.businesses[0];
  const alertLocation = alertBusiness?.locations[0];
  const alertDayId =
    alertLocation?.businessDay && alertLocation.businessDay.status === "open" ? alertLocation.businessDay.id : "";
  const alertQuery =
    alertBusiness && alertLocation && alertDayId ? reportQuery(alertBusiness.id, alertLocation.id, alertDayId) : null;
  const alerts = useQuery({
    enabled: Boolean(alertQuery),
    queryKey: ["qcafe", "reports", "alerts", alertBusiness?.id, alertLocation?.id, alertDayId],
    queryFn: () => readAlerts(request, alertQuery!),
  });
  const badges = useMemo(() => {
    const counts: Partial<Record<QcafePageId, number>> = {};
    for (const alert of alerts.data?.alerts ?? []) {
      if (alert.type === "stock-risk") counts.inventory = (counts.inventory ?? 0) + 1;
      else if (alert.type === "pending-kot") counts.kot = (counts.kot ?? 0) + 1;
      else if (alert.type === "booking-conflict") counts.booking = (counts.booking ?? 0) + 1;
      else if (alert.type === "failed-print") counts.documents = (counts.documents ?? 0) + 1;
      else if (alert.type === "unsettled-shift") counts.billing = (counts.billing ?? 0) + 1;
      counts.reports = (counts.reports ?? 0) + 1;
    }
    return counts;
  }, [alerts.data]);
  const navigation = useMemo(
    () => createQcafeNavigation(activePageId, pages, (page) => onNavigate(pathFromPage(page)), badges),
    [activePageId, badges, onNavigate, pages],
  );
  const connectionState = workspace.isPending ? "connecting" : workspace.isError ? "failed" : "connected";

  useEffect(() => {
    document.title = `Q Cafe | ${settingsPageLabel ?? activePage?.label ?? "Overview"}`;
  }, [activePage?.label, settingsPageLabel]);

  return (
    <MainWorkspace
      applicationId="qcafe"
      applicationName="Q Cafe"
      user={{ initials: "Q", name: "Q Cafe user", onSignOut: logout }}
      navigation={navigation}
      primaryAction={null}
      searchPlaceholder="Search Q Cafe"
      settingsContent={({ features, onBack, onFeatureChange }) => (
        <QcafeSettingsWorkspace
          features={features}
          onBack={onBack}
          onFeatureChange={onFeatureChange}
          onPageChange={setSettingsPageLabel}
          request={request}
        />
      )}
      sidebarStateKey="codexsun.qcafe.sidebar"
      statusLabel={connectionState === "connected" ? "API ready" : "Connecting"}
      workspaceTitle={settingsPageLabel ?? activePage?.label ?? "Overview"}
    >
      <QcafeWorkspaceView
        activePageId={activePageId}
        connectionState={connectionState}
        request={request}
        workspace={workspace.data}
      />
    </MainWorkspace>
  );
}

function QcafeHome({ onLogin }: { onLogin: () => void }) {
  useEffect(() => {
    document.title = "Q Cafe | Home";
  }, []);
  return (
    <main className="grid min-h-svh place-items-center bg-muted p-6">
      <section className="max-w-md rounded-lg border bg-background p-8 shadow-sm">
        <h1 className="text-2xl font-semibold">Q Cafe</h1>
        <p className="mt-2 text-sm text-muted-foreground">Restaurant operations desk for your team.</p>
        <Button className="mt-6" onClick={onLogin}>
          Log in
        </Button>
      </section>
    </main>
  );
}

function navigate(path: string, setLocation: (location: string) => void): void {
  window.history.pushState({}, "", path);
  setLocation(readLocation());
}

function pathFromPage(page: QcafePageId): string {
  return page === "overview" ? "/overview" : `/${page}`;
}

function pageFromLocation(location: string): QcafePageId {
  const pathname = pathnameOf(location);
  if (
    pathname === "/setup" ||
    pathname === "/menu" ||
    pathname === "/pos" ||
    pathname === "/kot" ||
    pathname === "/booking" ||
    pathname === "/billing" ||
    pathname === "/inventory" ||
    pathname === "/documents" ||
    pathname === "/backup" ||
    pathname === "/sync" ||
    pathname === "/marketplace" ||
    pathname === "/accounting" ||
    pathname === "/reports"
  )
    return pathname.slice(1) as QcafePageId;
  return "overview";
}

function pathnameOf(location: string): string {
  return new URL(location, window.location.origin).pathname;
}

function readLocation(): string {
  return `${window.location.pathname}${window.location.search}`;
}

function portalDeskPath(): string {
  if (window.location.pathname.startsWith("/sa/")) return "/sa/desk";
  if (window.location.pathname.startsWith("/admin/")) return "/admin/desk";
  return "/overview";
}
