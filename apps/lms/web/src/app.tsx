import { useEffect, useSyncExternalStore } from "react";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { LmsOverviewDesk } from "./lms-overview";
import { PublicSite } from "./public-site";

export function App() {
  const url = useBrowserUrl();
  const canonicalPath = canonicalDeskRoute(url);
  useEffect(() => {
    const currentPath = `${url.pathname}${url.search}`;
    if (canonicalPath === currentPath) return;
    window.history.replaceState({}, "", canonicalPath);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, [canonicalPath, url.pathname, url.search]);
  if (canonicalPath !== `${url.pathname}${url.search}`) return null;
  if (!requiresAuthentication(url.pathname)) return <PublicSite page={publicPage(url)} />;
  return (
    <SessionBoundary
      applicationId="lms"
      applicationName="LMS"
      autoLoginPath="/api/v1/lms/auth/development-login"
      loginPath="/api/v1/lms/auth/login"
    >
      {(session) =>
        session.portal === "super-admin" && url.pathname.startsWith("/sa/identity") ? (
          <IdentityManagementDesk
            applicationId="lms"
            applicationName="LMS"
            logout={session.logout}
            request={session.fetch}
          />
        ) : (
          <LmsOverviewDesk
            logout={session.logout}
            page={deskPage(url)}
            portal={session.portal}
            request={session.fetch}
          />
        )
      }
    </SessionBoundary>
  );
}

function requiresAuthentication(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/sa/") ||
    pathname === "/overview" ||
    pathname.startsWith("/overview/")
  );
}

function publicPage(url: URL): "home" | "programs" | "about" {
  const page = new URLSearchParams(url.search).get("page");
  if (url.pathname === "/programs" || page === "programs") return "programs";
  if (url.pathname === "/about" || page === "about") return "about";
  return "home";
}

function deskPage(
  url: URL,
): "overview" | "learning" | "catalog" | "learners" | "programs" | "reports" | "workspaces" | "audit" {
  const view = url.pathname.split("/").filter(Boolean).at(-1);
  if (
    view === "learning" ||
    view === "catalog" ||
    view === "learners" ||
    view === "programs" ||
    view === "reports" ||
    view === "workspaces" ||
    view === "audit"
  )
    return view;
  return "overview";
}

function canonicalDeskRoute(url: URL): string {
  const view = new URLSearchParams(url.search).get("view");
  if (!view) return `${url.pathname}${url.search}`;
  const routeMap: Record<string, string> = {
    learning: "/overview/learning",
    catalog: "/overview/catalog",
    learners: "/admin/desk/learners",
    programs: "/admin/desk/programs",
    reports: "/admin/desk/reports",
    workspaces: "/sa/desk/workspaces",
    audit: "/sa/desk/audit",
  };
  const isLearnerDesk = url.pathname === "/overview" && (view === "learning" || view === "catalog");
  const isAdminDesk =
    url.pathname === "/admin/desk" && (view === "learners" || view === "programs" || view === "reports");
  const isSuperAdminDesk = url.pathname === "/sa/desk" && (view === "workspaces" || view === "audit");
  return isLearnerDesk || isAdminDesk || isSuperAdminDesk ? routeMap[view] : `${url.pathname}${url.search}`;
}

function useBrowserUrl(): URL {
  const snapshot = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("popstate", onStoreChange);
      window.addEventListener("hashchange", onStoreChange);
      return () => {
        window.removeEventListener("popstate", onStoreChange);
        window.removeEventListener("hashchange", onStoreChange);
      };
    },
    () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
    () => "/",
  );
  return new URL(snapshot, window.location.origin);
}
