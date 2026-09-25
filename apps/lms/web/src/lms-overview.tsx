import { useQuery } from "@tanstack/react-query";
import {
  BarChart3Icon,
  BookOpenIcon,
  LayoutDashboardIcon,
  LibraryBigIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { MainWorkspace, type MdiNavigationSection } from "@codexsun/ui";
import {
  WorkspaceMetricGrid,
  WorkspaceMetricCard,
  WorkspacePageHeader,
  WorkspaceSectionCard,
} from "@codexsun/ui/blocks/workspace";
import type { AuthenticatedRequest, AuthenticatedSession } from "@codexsun/ui/blocks/auth";

type Health = { status: "ok"; providers: string[] };
type Portal = AuthenticatedSession["portal"];
type DeskPage = "overview" | "learning" | "catalog" | "learners" | "programs" | "reports" | "workspaces" | "audit";

export function LmsOverviewDesk({
  logout,
  page = "overview",
  portal,
  request,
}: {
  logout(): void;
  page?: DeskPage;
  portal: Portal;
  request: AuthenticatedRequest;
}) {
  const health = useQuery({ queryKey: ["lms", "health"], queryFn: () => readHealth(request) });
  const title = pageTitle(page);
  return (
    <MainWorkspace
      applicationId="lms"
      applicationName="LMS"
      navigation={navigationFor(portal, page)}
      primaryAction={{ icon: LayoutDashboardIcon, label: "Overview" }}
      sidebarStateKey={`lms-${portal}`}
      user={{
        initials: portal === "super-admin" ? "SA" : portal === "admin" ? "A" : "L",
        name: title,
        onSignOut: logout,
      }}
      workspaceTitle="Overview"
    >
      <main className="grid gap-8 p-6 lg:p-8">
        <WorkspacePageHeader
          eyebrow="Learning management system"
          title={title}
          description={descriptionFor(portal, page)}
          badge={
            <span className="rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
              {health.isError ? "API unavailable" : health.isPending ? "Connecting" : "Workspace ready"}
            </span>
          }
        />
        {page === "overview" ? (
          <WorkspaceMetricGrid>
            <WorkspaceMetricCard
              icon={BookOpenIcon}
              label="Active programs"
              tone="accent"
              value="12"
              trend={{ direction: "up", label: "+2 this quarter" }}
            />
            <WorkspaceMetricCard
              icon={UsersIcon}
              label="Learners"
              tone="success"
              value="248"
              description="Across all teams"
            />
            <WorkspaceMetricCard
              icon={BarChart3Icon}
              label="Completion rate"
              tone="warning"
              value="76%"
              trend={{ direction: "up", label: "+8% this month" }}
            />
            <WorkspaceMetricCard
              icon={LibraryBigIcon}
              label="Learning hours"
              tone="neutral"
              value="1,842"
              description="This quarter"
            />
          </WorkspaceMetricGrid>
        ) : (
          <PageSurface page={page} />
        )}
        {page === "overview" ? (
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
            <WorkspaceSectionCard
              title="Learning activity"
              description="A sample overview surface ready for live LMS data."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Activity label="Started this week" value="34" detail="learners" />
                <Activity label="Near completion" value="18" detail="learners" />
                <Activity label="Needs attention" value="7" detail="assignments" />
              </div>
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title="Workspace status" description="Runtime and access signals.">
              <div className="grid gap-3 text-sm">
                <StatusRow icon={ShieldCheckIcon} label="Identity" value="Protected" />
                <StatusRow
                  icon={LayoutDashboardIcon}
                  label="API"
                  value={health.isError ? "Unavailable" : health.isPending ? "Checking" : "Healthy"}
                />
              </div>
            </WorkspaceSectionCard>
          </div>
        ) : null}
      </main>
    </MainWorkspace>
  );
}

function navigationFor(portal: Portal, page: DeskPage): MdiNavigationSection[] {
  const roleItems =
    portal === "super-admin"
      ? [
          {
            icon: ShieldCheckIcon,
            label: "Client workspaces",
            href: "/sa/desk/workspaces",
            active: page === "workspaces",
          },
          { icon: ShieldCheckIcon, label: "Access control", href: "/sa/identity/users", active: false },
          { icon: BarChart3Icon, label: "Audit reports", href: "/sa/desk/audit", active: page === "audit" },
        ]
      : portal === "admin"
        ? [
            { icon: UsersIcon, label: "Learners", href: "/admin/desk/learners", active: page === "learners" },
            { icon: BookOpenIcon, label: "Programs", href: "/admin/desk/programs", active: page === "programs" },
            { icon: BarChart3Icon, label: "Reports", href: "/admin/desk/reports", active: page === "reports" },
          ]
        : [
            { icon: BookOpenIcon, label: "My learning", href: "/overview/learning", active: page === "learning" },
            {
              icon: LibraryBigIcon,
              label: "Program catalog",
              href: "/overview/catalog",
              active: page === "catalog",
            },
          ];
  return [
    {
      label: portal === "user" ? "Learning" : "Operations",
      items: [
        {
          active: page === "overview",
          icon: LayoutDashboardIcon,
          label: "Overview",
          href: portal === "user" ? "/overview" : `/${portal === "super-admin" ? "sa" : "admin"}/desk`,
        },
      ],
    },
    { label: portal === "user" ? "Explore" : "Management", items: roleItems },
  ];
}

function pageTitle(page: DeskPage): string {
  return {
    overview: "Overview",
    learning: "My learning",
    catalog: "Program catalog",
    learners: "Learners",
    programs: "Programs",
    reports: "Reports",
    workspaces: "Client workspaces",
    audit: "Audit reports",
  }[page];
}

function descriptionFor(portal: Portal, page: DeskPage): string {
  if (page !== "overview") return `The ${pageTitle(page).toLowerCase()} workspace is connected to this client portal.`;
  if (portal === "super-admin")
    return "Monitor client workspaces, access controls, and platform health from one protected desk.";
  if (portal === "admin") return "Keep company learning organized with a clear view of programs, people, and progress.";
  return "Pick up where you left off and keep your learning progress moving forward.";
}

function PageSurface({ page }: { page: DeskPage }) {
  return (
    <WorkspaceSectionCard
      title={`${pageTitle(page)} workspace`}
      description="This route is ready for its LMS-owned module and live data contract."
    >
      <div className="rounded-xl bg-muted/50 p-5 text-sm leading-6 text-muted-foreground">
        The browser URL and the opened page are now synchronized. This sample surface will become the working{" "}
        {pageTitle(page).toLowerCase()} module in the next LMS delivery phase.
      </div>
    </WorkspaceSectionCard>
  );
}

function Activity({ detail, label, value }: { detail: string; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
function StatusRow({ icon: Icon, label, value }: { icon: typeof ShieldCheckIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border/70 p-3">
      <span className="flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        {label}
      </span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

async function readHealth(request: AuthenticatedRequest): Promise<Health> {
  const response = await request("/api/v1/lms/health", { signal: AbortSignal.timeout(5_000) });
  if (!response.ok) throw new Error(`Health request failed: ${response.status}`);
  return response.json() as Promise<Health>;
}
