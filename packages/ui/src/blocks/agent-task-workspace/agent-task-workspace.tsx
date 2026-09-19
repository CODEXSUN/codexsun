import { ChevronLeftIcon, ClipboardListIcon, FolderKanbanIcon } from "lucide-react";
import { Button } from "../../components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";

export type AgentTaskWorkspaceItem = {
  acceptanceCriteria: string;
  briefId: string;
  createdAt: string;
  id: string;
  projectReference: string | null;
  projectScope: "project" | "all-projects";
  priority: "low" | "medium" | "high";
  status: string;
  summary: string;
  title: string;
};

export type AgentTaskWorkspaceProps = {
  onBack: () => void;
  onSelectTask: (id: string) => void;
  selectedTaskId?: string;
  tasks: readonly AgentTaskWorkspaceItem[];
};

export function AgentTaskWorkspace({ onBack, onSelectTask, selectedTaskId, tasks }: AgentTaskWorkspaceProps) {
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? tasks[0];

  return <section className="flex size-full min-h-0 flex-col bg-background">
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
      <Button size="sm" variant="ghost" onClick={onBack}><ChevronLeftIcon /> Conversation</Button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">Agent tasks</h1><p className="text-xs text-muted-foreground">Prepared handovers retain their final brief and project reference.</p></div>
    </header>
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-2">{tasks.length ? tasks.map((task) => <Button key={task.id} className="h-auto justify-start whitespace-normal p-3 text-left" variant={task.id === selectedTask?.id ? "secondary" : "outline"} onClick={() => onSelectTask(task.id)}><ClipboardListIcon className="mt-0.5 shrink-0" /><span className="min-w-0"><span className="block truncate font-medium">{task.title}</span><span className="block text-xs font-normal text-muted-foreground">{task.status} · {projectLabel(task)}</span></span></Button>) : <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No prepared tasks yet. Finalize an idea brief and hand it over here.</p>}</div>
        {selectedTask ? <Card size="sm"><CardHeader><CardTitle>{selectedTask.title}</CardTitle><CardDescription>{selectedTask.status} · {selectedTask.priority} priority · prepared from final brief</CardDescription></CardHeader><CardContent className="grid gap-5 text-sm"><section><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Task summary</p><p className="whitespace-pre-wrap leading-6">{selectedTask.summary}</p></section>{selectedTask.acceptanceCriteria ? <section><p className="mb-1 text-xs font-medium uppercase text-muted-foreground">Acceptance criteria</p><p className="whitespace-pre-wrap leading-6">{selectedTask.acceptanceCriteria}</p></section> : null}<section className="grid gap-3 sm:grid-cols-2"><Meta label="Project" value={projectLabel(selectedTask)} /><Meta label="Created" value={new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedTask.createdAt))} /><Meta label="Task reference" value={selectedTask.id} /><Meta label="Final brief reference" value={selectedTask.briefId} /></section></CardContent></Card> : null}
      </div>
    </main>
  </section>;
}

function projectLabel(task: AgentTaskWorkspaceItem): string {
  return task.projectScope === "all-projects" ? "All projects" : task.projectReference ?? "Project not set";
}

function Meta({ label, value }: { label: string; value: string }) {
  return <div className="flex gap-2"><FolderKanbanIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" /><div className="min-w-0"><p className="text-xs text-muted-foreground">{label}</p><p className="break-all">{value}</p></div></div>;
}
