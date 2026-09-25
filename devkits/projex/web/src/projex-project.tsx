import { ArrowLeftIcon, BoxesIcon, CheckSquareIcon, FileTextIcon, GitBranchIcon, LayoutDashboardIcon, MessageSquareIcon, NetworkIcon, PencilRulerIcon, ScrollTextIcon, type LucideIcon } from "lucide-react";
import { StatusBadge, getStatusBadgeValue } from "@codexsun/ui/components/status-badge";
import type { WorkspaceProject } from "./projex-types";

export type ProjectTab = "overview" | "notes" | "modules" | "tasks" | "reviews" | "architect" | "white-board" | "schema" | "changelog";

const tabs: Array<{ icon: LucideIcon; id: ProjectTab; label: string }> = [
  { icon: LayoutDashboardIcon, id: "overview", label: "Overview" },
  { icon: MessageSquareIcon, id: "notes", label: "Notes" },
  { icon: BoxesIcon, id: "modules", label: "Modules" },
  { icon: CheckSquareIcon, id: "tasks", label: "Tasks" },
  { icon: FileTextIcon, id: "reviews", label: "Reviews" },
  { icon: PencilRulerIcon, id: "architect", label: "Architect" },
  { icon: NetworkIcon, id: "white-board", label: "White Board" },
  { icon: ScrollTextIcon, id: "schema", label: "Schema" },
  { icon: GitBranchIcon, id: "changelog", label: "Changelog" },
];

export function ProjectShow({ onBack, project, tab, setTab }: { onBack(): void; project: WorkspaceProject; tab: ProjectTab; setTab(value: ProjectTab): void }) {
  return <div className="mx-auto grid max-w-7xl gap-5">
    <button className="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground" onClick={onBack} type="button"><ArrowLeftIcon className="size-4" />Back to projects</button>
    <nav aria-label="Project sections" className="-mx-2 flex gap-1 overflow-x-auto border-b px-2">{tabs.map(({ icon: Icon, id, label }) => <button aria-current={tab === id ? "page" : undefined} className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${tab === id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} key={id} onClick={() => setTab(id)} type="button"><Icon aria-hidden="true" className="size-4" />{label}</button>)}</nav>
    {tab === "overview" ? <ProjectOverview project={project} /> : <ProjectTabPanel project={project} tab={tab} />}
  </div>;
}

function ProjectOverview({ project }: { project: WorkspaceProject }) {
  return <>
    <header className="flex flex-wrap items-end justify-between gap-4 border-b pb-5"><div><p className="text-sm text-muted-foreground">Project progress</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.label}</h1></div><div className="flex items-center gap-3"><ProgressRing value={stageProgress(project.stage)} /><span className="text-sm text-muted-foreground">Progress</span></div></header>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <section className="grid gap-0 sm:grid-cols-2"><Fact label="Project" value={project.label} /><Fact label="Repository" value={project.id.toUpperCase()} /><Fact label="Status" value={project.stage} /><Fact label="Module" value={project.providers[0] ?? "Not registered"} /><Fact label="Workspace" value={project.stage === "registered" ? "Registered" : "Connected"} /></section>
      <aside className="border-l pl-6"><h2 className="font-semibold">Workspace</h2><p className="mt-1 text-xs text-muted-foreground">Project counts</p><div className="mt-4 grid grid-cols-2 gap-2"><CountCard label="Modules" value={project.providers.length} /><CountCard label="Hosts" value={project.hosts.length} /><CountCard label="Documents" value={project.documentation.length} /><CountCard label="Providers" value={project.providers.length} /></div></aside>
    </div>
  </>;
}

function ProjectTabPanel({ project, tab }: { project: WorkspaceProject; tab: Exclude<ProjectTab, "overview"> }) {
  const labels: Record<Exclude<ProjectTab, "overview">, { description: string; title: string }> = {
    architect: { description: "Architecture decisions and system boundaries for this project.", title: "Architect" },
    changelog: { description: "Repository and delivery history will appear here as it is registered.", title: "Changelog" },
    modules: { description: "Providers currently connected to this project.", title: "Modules" },
    notes: { description: "Working notes captured for this project.", title: "Notes" },
    reviews: { description: "Review records and decisions associated with this project.", title: "Reviews" },
    schema: { description: "Data and integration schemas owned by this project.", title: "Schema" },
    tasks: { description: "Runtime hosts are the first actionable work surfaces registered for this project.", title: "Tasks" },
    "white-board": { description: "Visual planning space for this project.", title: "White Board" },
  };
  const content = tab === "modules" ? <div className="grid gap-2">{project.providers.map((provider) => <ListItem key={provider} label={provider} detail="Registered provider" />)}</div> : tab === "tasks" ? <div className="grid gap-2">{project.hosts.map((host) => <ListItem detail={`${host.kind} · ${host.stage}`} key={host.target} label={host.target} />)}</div> : tab === "notes" || tab === "schema" || tab === "changelog" ? <div className="grid gap-2">{project.documentation.map((document) => <ListItem detail={document.path} key={document.path} label={document.title} />)}</div> : <EmptyTab label={`No ${labels[tab].title.toLowerCase()} records are registered yet.`} />;
  return <section className="grid gap-5"><header><p className="text-sm text-muted-foreground">Project workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{labels[tab].title}</h1><p className="mt-2 text-sm text-muted-foreground">{labels[tab].description}</p></header><div className="rounded-xl border bg-card p-5">{content}</div></section>;
}

function Fact({ label, value }: { label: string; value: string }) { return <div className="border-b py-5 first:pt-0 sm:odd:pr-4 sm:even:pl-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold">{value}</p></div>; }
function CountCard({ label, value }: { label: string; value: number }) { return <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold tabular-nums">{value}</p></div>; }
function ListItem({ detail, label }: { detail: string; label: string }) { return <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3"><span className="font-medium">{label}</span><span className="font-mono text-xs text-muted-foreground">{detail}</span></div>; }
function EmptyTab({ label }: { label: string }) { return <p className="py-8 text-sm text-muted-foreground">{label}</p>; }
function ProgressRing({ value }: { value: number }) { return <StatusBadge label={`${value}%`} status={getStatusBadgeValue(value === 100 ? "active" : value > 0 ? "pending" : "planned")} />; }
function stageProgress(stage: WorkspaceProject["stage"]): number { return stage === "running" ? 100 : stage === "configured" ? 50 : 0; }
