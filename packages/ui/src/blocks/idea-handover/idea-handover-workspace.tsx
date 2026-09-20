import { useState, type ReactNode } from "react";
import { ArchiveIcon, CheckCircle2Icon, CheckIcon, ChevronLeftIcon, CircleIcon, ClipboardIcon, EyeIcon, FileCheck2Icon, ListTodoIcon, NetworkIcon, PlusIcon, RefreshCwIcon, SendIcon, Trash2Icon, WandSparklesIcon } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { Input } from "@codexsun/ui/components/input";
import { Label } from "@codexsun/ui/components/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@codexsun/ui/components/select";
import { Textarea } from "@codexsun/ui/components/textarea";
import { getBriefReadiness, isBriefReady, parseAcceptanceCriteria, serializeAcceptanceCriteria } from "./idea-handover-readiness";

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
  deliveredAt?: string | null;
  deliveryError?: string | null;
  id: string;
  projectReference: string | null;
  projectScope: "project" | "all-projects";
  summary?: string;
  status: string;
  title: string;
  zunoHandoffId?: string | null;
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
  handoffPackagePreview: string;
  onAutoFillBrief: () => void;
  onBack: () => void;
  onArchiveConversation?: () => void;
  onBriefChange: (brief: IdeaBriefDraft) => void;
  onCopyHandoffPackage: () => void;
  onCreateTask: () => void;
  onDeliverTask: () => void;
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

export function IdeaHandoverWorkspace({ brief, currentStage, handoffPackagePreview, onArchiveConversation, onAutoFillBrief, onBack, onBriefChange, onCopyHandoffPackage, onCreateTask, onDeliverTask, onSaveBrief, onStageChange, onTaskDraftChange, saving, sources, task, taskDraft }: IdeaHandoverWorkspaceProps) {
  const update = <K extends Exclude<keyof IdeaBriefDraft, "status">>(key: K, value: IdeaBriefDraft[K]) => onBriefChange({ ...brief, [key]: value, status: "draft" });
  const updateTask = <K extends keyof IdeaTaskDraft>(key: K, value: IdeaTaskDraft[K]) => onTaskDraftChange({ ...taskDraft, [key]: value });
  const isProjectScope = brief.projectScope === "project";
  const readiness = getBriefReadiness(brief);
  const canPrepareTask = brief.status === "final" && isBriefReady(brief) && taskDraft.title.trim() && taskDraft.summary.trim() && parseAcceptanceCriteria(taskDraft.acceptanceCriteria).length > 0;

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
          <BriefReadiness items={readiness} />
          <div className="flex flex-wrap items-center justify-between gap-2"><Button disabled={saving || !brief.sourceMessageIds.length} variant="ghost" onClick={onAutoFillBrief}><WandSparklesIcon /> Fill empty fields</Button><div className="flex flex-wrap gap-2"><Button disabled={saving} variant="outline" onClick={() => onSaveBrief("draft")}>Save draft</Button><Button disabled={saving || !isBriefReady(brief)} onClick={() => onSaveBrief("final")}><CheckCircle2Icon /> Finalize brief</Button></div></div>
        </CardContent></Card>
        <Card size="sm"><CardHeader><CardTitle>Prepared task</CardTitle><CardDescription>Prepare the handoff for Zuno. This keeps the scope and acceptance criteria but does not start a runner.</CardDescription></CardHeader><CardContent className="grid gap-4">
          {task ? <div className="grid gap-3 rounded-md border bg-muted/40 p-3"><div className="flex flex-wrap items-center gap-3"><ListTodoIcon className="size-4 text-muted-foreground" /><div className="min-w-0 flex-1"><p className="font-medium">{task.title}</p><p className="text-xs text-muted-foreground">{task.status} · {task.projectScope === "all-projects" ? "All projects" : task.projectReference}</p></div>{task.status === "delivered" ? onArchiveConversation ? <Button size="sm" variant="outline" onClick={onArchiveConversation}><ArchiveIcon /> Archive conversation</Button> : null : <Button disabled={saving || task.status === "delivering"} size="sm" onClick={onDeliverTask}>{task.status === "failed" ? <RefreshCwIcon /> : <SendIcon />}{task.status === "failed" ? "Retry delivery" : task.status === "delivering" ? "Delivering..." : "Deliver to Zuno"}</Button>}</div>{task.deliveryError ? <p className="text-sm text-destructive" role="alert">{task.deliveryError}</p> : null}{task.status === "delivered" ? <p className="text-sm text-muted-foreground">Accepted by Zuno{task.deliveredAt ? ` on ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(task.deliveredAt))}` : ""}. Receipt: <code>{task.zunoHandoffId}</code></p> : null}</div> : <>
            <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]"><Field label="Task title"><Input value={taskDraft.title} onChange={(event) => updateTask("title", event.target.value)} /></Field><Field label="Priority"><Select value={taskDraft.priority} onValueChange={(value) => updateTask("priority", value as IdeaTaskDraft["priority"])}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent></Select></Field></div>
            <Field label="Task summary"><Textarea value={taskDraft.summary} onChange={(event) => updateTask("summary", event.target.value)} /></Field>
            <AcceptanceCriteriaEditor value={taskDraft.acceptanceCriteria} onChange={(value) => updateTask("acceptanceCriteria", value)} />
            <details className="overflow-hidden rounded-md border"><summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-medium hover:bg-muted"><EyeIcon className="size-4 text-muted-foreground" /> Review Zuno package</summary><pre className="max-h-72 overflow-auto border-t bg-muted/30 p-3 text-xs leading-relaxed">{handoffPackagePreview}</pre></details>
            <div className="flex flex-wrap justify-end gap-2"><Button disabled={saving || brief.status !== "final" || !isBriefReady(brief)} variant="outline" onClick={onCopyHandoffPackage}><ClipboardIcon /> Copy Zuno package</Button><Button disabled={saving || !canPrepareTask} onClick={onCreateTask}><SendIcon /> Prepare task</Button></div>
          </>}
        </CardContent></Card>
      </div>
    </main>
  </section>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <div className="grid gap-2"><Label>{label}</Label>{children}</div>;
}

function BriefReadiness({ items }: { items: ReturnType<typeof getBriefReadiness> }) {
  const completeCount = items.filter((item) => item.complete).length;
  return <section aria-label="Brief readiness" className="grid gap-2 border-y py-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium">Brief readiness</p><p className="text-sm text-muted-foreground">{completeCount} of {items.length} complete</p></div><div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">{items.map((item) => <div key={item.id} className="flex min-w-0 items-center gap-2 text-sm">{item.complete ? <CheckIcon className="size-4 shrink-0 text-emerald-600" /> : <CircleIcon className="size-4 shrink-0 text-muted-foreground" />}<span className={item.complete ? undefined : "text-muted-foreground"}>{item.label}</span></div>)}</div></section>;
}

function AcceptanceCriteriaEditor({ onChange, value }: { onChange: (value: string) => void; value: string }) {
  const items = parseAcceptanceCriteria(value);
  const [draft, setDraft] = useState("");
  const updateItem = (index: number, nextValue: string) => onChange(serializeAcceptanceCriteria(items.map((item, itemIndex) => itemIndex === index ? nextValue : item)));
  const removeItem = (index: number) => onChange(serializeAcceptanceCriteria(items.filter((_, itemIndex) => itemIndex !== index)));
  const addItem = () => {
    if (!draft.trim()) return;
    onChange(serializeAcceptanceCriteria([...items, draft]));
    setDraft("");
  };

  return <div className="grid gap-2"><Label>Acceptance criteria</Label>{items.length ? <div className="grid gap-2">{items.map((item, index) => <div key={`${index}-${items.length}`} className="flex items-center gap-2"><span className="w-6 shrink-0 text-center text-sm text-muted-foreground">{index + 1}.</span><Input aria-label={`Acceptance criterion ${index + 1}`} value={item} onChange={(event) => updateItem(index, event.target.value)} /><Button aria-label={`Remove acceptance criterion ${index + 1}`} size="icon-xs" title="Remove criterion" variant="ghost" onClick={() => removeItem(index)}><Trash2Icon /></Button></div>)}</div> : <p className="text-sm text-muted-foreground">Add observable conditions that Zuno can validate after execution.</p>}<div className="flex items-center gap-2"><span className="w-6 shrink-0 text-center text-sm text-muted-foreground">{items.length + 1}.</span><Input aria-label="New acceptance criterion" placeholder="Add a verifiable result" value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addItem(); } }} /><Button aria-label="Add acceptance criterion" disabled={!draft.trim()} size="icon-sm" title="Add criterion" variant="outline" onClick={addItem}><PlusIcon /></Button></div></div>;
}

function SourcePicker({ onChange, selected, sources }: { onChange: (ids: string[]) => void; selected: string[]; sources: readonly IdeaHandoverSource[] }) {
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((item) => item !== id) : [...selected, id]);
  return <div className="grid gap-2"><Label>Source responses</Label><div className="max-h-48 overflow-y-auto rounded-md border p-2">{sources.length ? sources.map((source) => <label key={source.id} className="flex cursor-pointer gap-2 rounded-sm p-2 text-sm hover:bg-muted"><input checked={selected.includes(source.id)} type="checkbox" onChange={() => toggle(source.id)} /><span className="min-w-0"><span className="line-clamp-2">{source.content}</span><code className="text-xs text-muted-foreground">{source.id}</code></span></label>) : <p className="p-2 text-sm text-muted-foreground">Collect or create assistant responses before finalizing the brief.</p>}</div></div>;
}
