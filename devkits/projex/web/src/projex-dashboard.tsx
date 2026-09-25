import { useQuery } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { Badge } from "@codexsun/ui/components/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { StatusBadge, getStatusBadgeValue } from "@codexsun/ui/components/status-badge";
import { useMemo, useState, type ReactNode } from "react";
import { Addons } from "./projex-addons";
import { ProjectRegistryRow, RegistryPage } from "./projex-list";
import { ProjectShow, type ProjectTab } from "./projex-project";
import type { AddonCatalogSnapshot, WorkspaceHost, WorkspaceProject, WorkspaceSnapshot, WorkspaceStage } from "./projex-types";

type View = "overview" | "projects" | "runtime" | "documentation" | "addons";
type Density = "relaxed" | "compact";
type Surface = "card" | "flush";

export function ProjexDashboard({ logout, request }: { logout(): void; request: typeof fetch }) {
  const [view, setView] = useState<View>("overview");
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [projectTab, setProjectTab] = useState<ProjectTab>("overview");
  const [density, setDensity] = useState<Density>("relaxed");
  const [surface, setSurface] = useState<Surface>("card");
  const workspace = useQuery({ queryKey: ["projex", "workspace"], queryFn: () => readWorkspace(request), refetchInterval: 5_000 });
  const addons = useQuery({ queryKey: ["projex", "addons"], queryFn: () => readAddons(request), refetchInterval: 10_000 });
  const navigation = useMemo(() => [{ label: "Workspace", items: [
    { active: view === "overview", label: "Overview", onSelect: () => setView("overview") },
    { active: view === "projects", label: "Projects", onSelect: () => { setSelectedProjectId(undefined); setView("projects"); } },
    { active: view === "runtime", label: "Runtime", onSelect: () => setView("runtime") },
    { active: view === "documentation", label: "Documentation", onSelect: () => setView("documentation") },
    { active: view === "addons", label: "Add-ons", onSelect: () => setView("addons") },
  ] }], [view]);
  const pageTitle = { overview: "Overview", projects: "Projects", runtime: "Runtime", documentation: "Documentation", addons: "Add-ons" }[view];

  return <MainWorkspace applicationId="projex" applicationName="Projex" navigation={navigation} primaryAction={{ label: "Overview", onSelect: () => setView("overview") }} statusLabel={statusLabel(workspace)} workspaceTitle={pageTitle} user={{ initials: "P", name: "Projex user", onSignOut: logout }}>
    <main className={`h-full overflow-auto ${density === "compact" ? "p-4" : "p-6"}`}>
      {workspace.isPending ? <LoadingState /> : workspace.isError ? <ErrorState /> : view === "overview" ? <Overview snapshot={workspace.data} surface={surface} /> : view === "projects" ? <Projects onBack={() => setSelectedProjectId(undefined)} onSelect={(project) => { setSelectedProjectId(project.id); setProjectTab("overview"); }} projectId={selectedProjectId} projects={workspace.data.projects} setTab={setProjectTab} surface={surface} tab={projectTab} /> : view === "runtime" ? <Runtime projects={workspace.data.projects} surface={surface} /> : view === "documentation" ? <Documentation documentation={workspace.data.documentation} surface={surface} /> : addons.isPending ? <LoadingState /> : addons.isError ? <ErrorState /> : <Addons catalog={addons.data} surface={surface} />}
    </main>
    <TweakPanel density={density} setDensity={setDensity} setSurface={setSurface} surface={surface} />
  </MainWorkspace>;
}

function Overview({ snapshot, surface }: { snapshot: WorkspaceSnapshot; surface: Surface }) {
  const recentProjects = snapshot.projects.filter((project) => project.stage === "running").slice(0, 6);
  return <div className="mx-auto grid max-w-7xl gap-6">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-primary">Repository control plane</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Know what is active.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Projex keeps apps, devkits, ports, stages, and working documentation in one view.</p></div><p className="text-xs text-muted-foreground">Updated {formatDate(snapshot.generatedAt)}</p></header>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Projects" value={snapshot.summary.projectCount} detail="Apps and devkits" /><Metric label="Running hosts" value={snapshot.summary.runningHosts} detail="Ports responding now" /><Metric label="Configured hosts" value={snapshot.summary.configuredHosts} detail="Local env is present" /><Metric label="Documents" value={snapshot.summary.documentationCount} detail="Assist and owner docs" /></div>
    <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]"><SurfaceCard surface={surface}><CardHeader><CardTitle>Running now</CardTitle><CardDescription>Hosts that answer on their configured local ports.</CardDescription></CardHeader><CardContent>{recentProjects.length ? <div className="grid gap-3">{recentProjects.map((project) => <ProjectRow key={project.id} project={project} />)}</div> : <EmptyState label="No project hosts are running." />}</CardContent></SurfaceCard><SurfaceCard surface={surface}><CardHeader><CardTitle>Stage guide</CardTitle><CardDescription>Use these stages to keep work visible.</CardDescription></CardHeader><CardContent className="grid gap-3"><StageGuide stage="running" text="A host answers on its configured port." /><StageGuide stage="configured" text="The app has local environment files." /><StageGuide stage="registered" text="The app exists in the central registry." /></CardContent></SurfaceCard></section>
  </div>;
}

function Projects({ onBack, onSelect, projectId, projects, setTab, surface, tab }: { onBack(): void; onSelect(project: WorkspaceProject): void; projectId?: string; projects: WorkspaceProject[]; setTab(value: ProjectTab): void; surface: Surface; tab: ProjectTab }) {
  const selectedProject = projects.find((project) => project.id === projectId);
  if (selectedProject) return <ProjectShow onBack={onBack} project={selectedProject} setTab={setTab} tab={tab} />;
  return <RegistryPage count={projects.length} description="Connected repository workspaces available on mobile, desktop, and web." onAdd={() => undefined} surface={surface} title="Projects">{projects.map((project) => <ProjectRegistryRow key={project.id} onSelect={() => onSelect(project)} project={project} expanded />)}</RegistryPage>;
}

function Runtime({ projects, surface }: { projects: WorkspaceProject[]; surface: Surface }) {
  const hosts = projects.flatMap((project) => project.hosts.map((host) => ({ host, project })));
  return <PageFrame title="Runtime" description="Track API and web ports without opening every app separately."><SurfaceCard surface={surface}><CardContent className="p-0"><div className="divide-y">{hosts.map(({ host, project }) => <HostRow key={host.target} host={host} project={project} />)}</div></CardContent></SurfaceCard></PageFrame>;
}

function Documentation({ documentation, surface }: { documentation: WorkspaceSnapshot["documentation"]; surface: Surface }) {
  return <PageFrame title="Documentation" description="The working rules and owner documents that define current scope."><SurfaceCard surface={surface}><CardContent className="p-0"><div className="divide-y">{documentation.map((document) => <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3" key={document.path}><div><p className="font-medium">{document.title}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{document.path}</p></div><Badge variant={document.scope === "assist" ? "secondary" : "outline"}>{document.scope}</Badge></div>)}</div></CardContent></SurfaceCard></PageFrame>;
}

function ProjectRow({ project, expanded = false }: { project: WorkspaceProject; expanded?: boolean }) {
  return <div className="grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{project.label}</p><Badge variant="outline">{project.category}</Badge><StageBadge stage={project.stage} /></div><p className="mt-1 font-mono text-xs text-muted-foreground">{project.owner} · {project.providers.join(", ")}</p>{expanded ? <p className="mt-2 text-sm text-muted-foreground">{project.documentation.length} documents · {project.hosts.length} hosts</p> : null}</div><div className="flex flex-wrap gap-2">{project.hosts.map((host) => <span className="font-mono text-xs text-muted-foreground" key={host.target}>{host.kind}:{host.port}</span>)}</div></div>;
}

function HostRow({ host, project }: { host: WorkspaceHost; project: WorkspaceProject }) {
  return <div className="grid gap-2 px-4 py-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"><div><p className="font-medium">{project.label} <span className="text-muted-foreground">/ {host.kind}</span></p><p className="font-mono text-xs text-muted-foreground">{host.workspace} · {host.target}</p></div>{host.port ? <a className="font-mono text-sm text-primary underline-offset-4 hover:underline" href={host.url} target="_blank" rel="noreferrer">{host.port}</a> : <span className="text-sm text-muted-foreground">not set</span>}<StageBadge stage={host.stage} /></div>;
}

function Metric({ detail, label, value }: { detail: string; label: string; value: number }) { return <SurfaceCard><CardContent className="p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight">{value}</p><p className="mt-1 text-xs text-muted-foreground">{detail}</p></CardContent></SurfaceCard>; }
function StageGuide({ stage, text }: { stage: WorkspaceStage; text: string }) { return <div className="flex items-start gap-3"><StageBadge stage={stage} /><p className="text-sm text-muted-foreground">{text}</p></div>; }
function StageBadge({ stage }: { stage: WorkspaceStage }) { return <StatusBadge label={stage} status={getStatusBadgeValue(stage === "running" ? "active" : stage === "configured" ? "pending" : "planned")} />; }
function SurfaceCard({ children, surface = "card" }: { children: ReactNode; surface?: Surface }) { return <Card className={surface === "flush" ? "rounded-lg ring-0" : undefined}>{children}</Card>; }
function PageFrame({ children, description, title }: { children: ReactNode; description: string; title: string }) { return <div className="mx-auto grid max-w-7xl gap-6"><header><h1 className="text-2xl font-semibold tracking-tight">{title}</h1><p className="mt-2 text-sm text-muted-foreground">{description}</p></header>{children}</div>; }
function EmptyState({ label }: { label: string }) { return <p className="py-8 text-sm text-muted-foreground">{label}</p>; }
function LoadingState() { return <div className="grid gap-3"><div className="h-8 w-56 animate-pulse rounded bg-muted" /><div className="h-24 animate-pulse rounded bg-muted" /></div>; }
function ErrorState() { return <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6"><h1 className="font-semibold">Projex workspace is unavailable.</h1><p className="mt-2 text-sm text-muted-foreground">Start the Projex API and refresh this page.</p></div>; }
function TweakPanel({ density, setDensity, setSurface, surface }: { density: Density; setDensity(value: Density): void; setSurface(value: Surface): void; surface: Surface }) { return <aside className="fixed bottom-4 right-4 z-20 grid gap-2 rounded-xl border bg-background/95 p-3 text-xs shadow-lg backdrop-blur"><p className="font-semibold">Tweak view</p><div className="flex gap-1"><button className={`rounded px-2 py-1 ${density === "compact" ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setDensity("compact")}>Compact</button><button className={`rounded px-2 py-1 ${density === "relaxed" ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setDensity("relaxed")}>Relaxed</button></div><div className="flex gap-1"><button className={`rounded px-2 py-1 ${surface === "flush" ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setSurface("flush")}>Flush</button><button className={`rounded px-2 py-1 ${surface === "card" ? "bg-primary text-primary-foreground" : "bg-muted"}`} onClick={() => setSurface("card")}>Card</button></div></aside>; }

function statusLabel(workspace: ReturnType<typeof useQuery<WorkspaceSnapshot>>): string { if (workspace.isPending) return "Connecting"; if (workspace.isError) return "API offline"; return `${workspace.data.summary.runningHosts} hosts running`; }
async function readWorkspace(request: typeof fetch): Promise<WorkspaceSnapshot> { const response = await request("/api/v1/projex/workspace", { signal: AbortSignal.timeout(5_000) }); if (!response.ok) throw new Error(`Workspace request failed: ${response.status}`); return response.json() as Promise<WorkspaceSnapshot>; }
async function readAddons(request: typeof fetch): Promise<AddonCatalogSnapshot> { const response = await request("/api/v1/projex/addons", { signal: AbortSignal.timeout(5_000) }); if (!response.ok) throw new Error(`Add-ons request failed: ${response.status}`); return response.json() as Promise<AddonCatalogSnapshot>; }
function formatDate(value: string): string { return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
