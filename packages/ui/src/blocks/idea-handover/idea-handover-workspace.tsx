import type React from "react";
import { ArchiveIcon, CheckCircle2Icon, ChevronLeftIcon, ClipboardIcon, FileCheck2Icon, ListTodoIcon, NetworkIcon, SendIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codexsun/ui/components/select";
import { Textarea } from "@codexsun/ui/components/textarea";

export type IdeaStage = "explore" | "compare" | "revise" | "final";

export type IdeaBriefDraft = {
  audience: string;
  constraints: string;
  exclusions: string;
  outcome: string;
  projectReference: string | null;
  projectScope: "project" | "all-projects";
  risks: string;
  scope: string;
  sourceMessageIds: string[];
  status: "draft" | "final";
  successSignals: string;
  title: string;
};

export type IdeaHandoverTask = {
  acceptanceCriteria?: string;
  id: string;
  projectReference: string | null;
  projectScope: "project" | "all-projects";
  summary?: string;
  status: string;
  title: string;
};

export type IdeaTaskDraft = {
  acceptanceCriteria: string;
  priority: "low" | "medium" | "high";
  summary: string;
  title: string;
};

export type IdeaHandoverSource = {
  content: string;
  id: string;
};

export type IdeaHandoverWorkspaceProps = {
  brief: IdeaBriefDraft;
  currentStage: IdeaStage;
  onBack: () => void;
  onArchiveConversation?: () => void;
  onBriefChange: (brief: IdeaBriefDraft) => void;
  onCopyHandoffPackage: () => void;
  onCreateTask: () => void;
  onSaveBrief: (status: "draft" | "final") => void;
  onStageChange: (stage: IdeaStage) => void;
  saving?: boolean;
  sources: readonly IdeaHandoverSource[];
  task?: IdeaHandoverTask;
  taskDraft: IdeaTaskDraft;
  onTaskDraftChange: (taskDraft: IdeaTaskDraft) => void;
};

const stages: readonly { id: IdeaStage; label: string }[] = [
  { id: "explore", label: "Explore" },
  { id: "compare", label: "Compare" },
  { id: "revise", label: "Revise" },
  { id: "final", label: "Final brief" },
];

export function IdeaHandoverWorkspace({ brief, currentStage, onArchiveConversation, onBack, onBriefChange, onCopyHandoffPackage, onCreateTask, onSaveBrief, onStageChange, onTaskDraftChange, saving, sources, task, taskDraft }: IdeaHandoverWorkspaceProps) {
  const update = <K extends keyof IdeaBriefDraft>(key: K, value: IdeaBriefDraft[K]) => onBriefChange({ ...brief, [key]: value });
  const updateTask = <K extends keyof IdeaTaskDraft>(key: K, value: IdeaTaskDraft[K]) => onTaskDraftChange({ ...taskDraft, [key]: value });
  const isProjectScope = brief.projectScope === "project";
  const canPrepareTask = brief.status === "final" && taskDraft.title.trim() && taskDraft.summary.trim();

  return <section className="flex size-full min-h-0 flex-col bg-background">
    <header className="flex shrink-0 items-center gap-3 border-b px-4 py-3 sm:px-6">
      <Button size="sm" variant="ghost" onClick={onBack}><ChevronLeftIcon /> Conversation</Button>
      <div className="min-w-0 flex-1"><h1 className="truncate text-sm font-semibold">Final brief and task handover</h1><p className="text-xs text-muted-foreground">Keep sources and project scope with the idea.</p></div>
    </header>
    <main className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
        <nav aria-label="Idea stages" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stages.map((stage) => <Button key={stage.id} className="justify-start" size="sm" variant={stage.id === currentStage ? "secondary" : "ghost"} onClick={() => onStageChange(stage.id)}>
            {stage.id === "final" ? <FileCheck2Icon /> : <NetworkIcon />} {stage.label}
          </Button>)}
        </nav>
        <Card size="sm"><CardHeader><CardTitle>Final brief</CardTitle><CardDescription>Save the idea with its source responses. Finalize it before creating an agent task.</CardDescription></CardHeader><CardContent className="grid gap-4">
          <Field label="Brief title"><Input value={brief.title} onChange={(event) => update("title", event.target.value)} /></Field>
          <Field label="Outcome"><Textarea value={brief.outcome} onChange={(event) => update("outcome", event.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Audience"><Textarea value={brief.audience} onChange={(event) => update("audience", event.target.value)} /></Field><Field label="Scope"><Textarea value={brief.scope} onChange={(event) => update("scope", event.target.value)} /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Exclusions"><Textarea value={brief.exclusions} onChange={(event) => update("exclusions", event.target.value)} /></Field><Field label="Constraints"><Textarea value={brief.constraints} onChange={(event) => update("constraints", event.target.value)} /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Risks"><Textarea value={brief.risks} onChange={(event) => update("risks", event.target.value)} /></Field><Field label="Success signals"><Textarea value={brief.successSignals} onChange={(event) => update("successSignals", event.target.value)} /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Project scope"><Select value={brief.projectScope} onValueChange={(value) => update("projectScope", value as IdeaBriefDraft["projectScope"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="project">A referred project</SelectItem><SelectItem value="all-projects">Common to all projects</SelectItem></SelectContent></Select></Field>{isProjectScope ? <Field label="Referred project"><Input placeholder="Project name or reference" value={brief.projectReference ?? ""} onChange={(event) => update("projectReference", event.target.value || null)} /></Field> : <p className="self-end text-sm text-muted-foreground">This idea is common to all projects.</p>}</div>
          <SourcePicker selected={brief.sourceMessageIds} sources={sources} onChange={(sourceMessageIds) => update("sourceMessageIds", sourceMessageIds)} />
          <div className="flex flex-wrap justify-end gap-2"><Button disabled={saving} variant="outline" onClick={() => onSaveBrief("draft")}>Save draft</Button><Button disabled={saving || !brief.outcome.trim() || !brief.sourceMessageIds.length || (isProjectScope && !brief.projectReference)} onClick={() => onSaveBrief("final")}><CheckCircle2Icon /> Finalize brief</Button></div>
        </CardContent></Card>
        <Card size="sm"><CardHeader><CardTitle>Prepared task</CardTitle><CardDescription>Prepare the handoff for Zuno. This keeps the scope and acceptance criteria but does not start a runner.</CardDescription></CardHeader><CardContent className="grid gap-4">
          {task ? <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 p-3"><ListTodoIcon className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.status} · {task.projectScope === "all-projects" ? "All projects" : task.projectReference}</p></div>{onArchiveConversation ? <Button size="sm" variant="outline" onClick={onArchiveConversation}><ArchiveIcon /> Archive conversation</Button> : null}</div> : <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]"><Field label="Task title"><Input value={taskDraft.title} onChange={(event) => updateTask("title", event.target.value)} /></Field><Field label="Priority"><Select value={taskDraft.priority} onValueChange={(value) => updateTask("priority", value as IdeaTaskDraft["priority"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></Field></div>
            <Field label="Task summary"><Textarea value={taskDraft.summary} onChange={(event) => updateTask("summary", event.target.value)} /></Field>
            <Field label="Acceptance criteria"><Textarea value={taskDraft.acceptanceCriteria} onChange={(event) => updateTask("acceptanceCriteria", event.target.value)} /></Field>
            <div className="flex flex-wrap justify-end gap-2"><Button disabled={saving || brief.status !== "final"} variant="outline" onClick={onCopyHandoffPackage}><ClipboardIcon /> Copy Zuno package</Button><Button disabled={saving || !canPrepareTask} onClick={onCreateTask}><SendIcon /> Prepare task</Button></div>
          </>}
        </CardContent></Card>
      </div>
    </main>
  </section>;
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function SourcePicker({ onChange, selected, sources }: { onChange: (ids: string[]) => void; selected: string[]; sources: readonly IdeaHandoverSource[] }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return <div className="grid gap-2"><Label>Source responses</Label><div className="max-h-48 overflow-y-auto rounded-md border p-2">{sources.length ? sources.map((source) => <label key={source.id} className="flex cursor-pointer gap-2 rounded-sm p-2 text-sm hover:bg-muted"><input checked={selected.includes(source.id)} type="checkbox" onChange={() => toggle(source.id)} /><span className="min-w-0"><span className="line-clamp-2">{source.content}</span><code className="text-xs text-muted-foreground">{source.id}</code></span></label>) : <p className="p-2 text-sm text-muted-foreground">Collect or create assistant responses before finalizing the brief.</p>}</div></div>;
}
