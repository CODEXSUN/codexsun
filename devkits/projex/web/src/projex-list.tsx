import { GitBranchIcon, PlusIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { WorkspaceProject, WorkspaceStage } from "./projex-types";

export function RegistryPage({ children, count, description, onAdd, surface, title }: { children: ReactNode; count: number; description: string; onAdd?: () => void; surface: "card" | "flush"; title: string }) {
  return <div className="mx-auto grid max-w-7xl gap-5">
    <header className="flex items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-sm font-semibold text-muted-foreground">{count} connected</span>
        {onAdd ? <button aria-label={`Add ${title.toLowerCase()}`} className="grid size-9 place-items-center rounded-lg bg-foreground text-background transition-colors hover:bg-primary hover:text-primary-foreground" onClick={onAdd} type="button"><PlusIcon aria-hidden="true" className="size-5" /></button> : null}
      </div>
    </header>
    <div className={`grid gap-2 ${surface === "flush" ? "[&>article]:bg-background" : "[&>article]:bg-card"}`}>{children}</div>
  </div>;
}

export function RegistryRow({ children, id, onSelect, progress }: { children: ReactNode; id: string; onSelect?: () => void; progress: number }) {
  return <article className={`grid min-h-28 gap-4 rounded-xl border px-4 py-4 transition-colors hover:border-primary/40 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center ${onSelect ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : ""}`} onClick={onSelect} onKeyDown={(event) => { if (onSelect && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelect(); } }} role={onSelect ? "button" : undefined} tabIndex={onSelect ? 0 : undefined}>
    <div aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-lg text-xs font-semibold ${avatarClass(id)}`}>{initials(id)}</div>
    <div className="min-w-0">{children}</div>
    <ProgressRing value={progress} />
  </article>;
}

export function ProjectRegistryRow({ onSelect, project, expanded = false }: { onSelect?: () => void; project: WorkspaceProject; expanded?: boolean }) {
  return <RegistryRow id={project.id} onSelect={onSelect} progress={stageProgress(project.stage)}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="font-semibold">{project.label}</h2><span className="text-xs text-muted-foreground">{project.category}</span></div>
    <p className="mt-1 text-sm text-muted-foreground">{projectDescription(project.category)}</p>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><GitBranchIcon aria-hidden="true" className="size-3.5" />{project.id}</span><span>{project.stage}</span>{expanded ? <span>{project.hosts.length} hosts · {project.documentation.length} documents</span> : null}</div>
  </RegistryRow>;
}

export function ProgressRing({ value }: { value: number }) {
  const radius = 15;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * Math.max(0, Math.min(100, value))) / 100;
  return <div aria-label={`${value}% complete`} className="relative grid size-10 shrink-0 place-items-center">
    <svg aria-hidden="true" className="absolute inset-0 size-10 -rotate-90" viewBox="0 0 40 40"><circle className="text-border" cx="20" cy="20" fill="none" r={radius} stroke="currentColor" strokeWidth="4" /><circle className="text-primary transition-[stroke-dashoffset]" cx="20" cy="20" fill="none" r={radius} stroke="currentColor" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" strokeWidth="4" /></svg>
    <span className="text-[10px] font-semibold tabular-nums">{value}%</span>
  </div>;
}

function projectDescription(category: WorkspaceProject["category"]): string {
  if (category === "devkit") return "Developer workspace and internal tooling.";
  if (category === "platform") return "Shared platform capabilities and runtime services.";
  return "Business application workspace.";
}

function stageProgress(stage: WorkspaceStage): number { return stage === "running" ? 100 : stage === "configured" ? 50 : 0; }
function initials(value: string): string { return value.split(/[\s_-]+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "PX"; }
function avatarClass(value: string): string { const colors = ["bg-slate-900 text-white", "bg-indigo-500 text-white", "bg-amber-600 text-white", "bg-sky-600 text-white", "bg-rose-500 text-white", "bg-emerald-600 text-white"]; return colors[[...value].reduce((total, character) => total + character.charCodeAt(0), 0) % colors.length]; }
