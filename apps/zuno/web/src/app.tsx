import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { ExternalLinkIcon, GitMergeIcon, GitPullRequestIcon, InboxIcon, RefreshCwIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createCxforgeTask, getCxforgeHealth, getCxforgeOverview, getCxforgeRuntime, getCxforgeRuntimeLogs, manageCxforgeRuntime, mergeCxforgeTask, openCxforgeMergeRequest, prepareCxforgeMergeRequest, queueCxforgeTask, reviewCxforgeTask, updateCxforgeSkills, type CxforgeOverview, type CxforgeRuntimeAction, type CxforgeRuntimeStatus } from "./cxforge-api";
import { CxforgeRuntimePanel } from "./cxforge-runtime-panel";
import { assignmentPrompt, listZetroHandoffs, type AcceptedZetroHandoff } from "./handoff-api";

type Screen = "servers" | "server" | "task";
type TaskTab = "running" | "completed" | "all";
type ServerTab = "tasks" | "runtime" | "agents" | "skills";

export function App() {
  return <SessionBoundary applicationId="zuno" applicationName="Zuno" autoLoginPath="/api/v1/zuno/auth/development-login" loginPath="/api/v1/zuno/auth/login">
    {(session) => session.portal === "super-admin" ? <IdentityManagementDesk applicationId="zuno" applicationName="Zuno" logout={session.logout} request={session.fetch} /> : session.portal === "admin" ? <PrivilegedDesk applicationId="zuno" applicationName="Zuno" logout={session.logout} portal={session.portal} /> : <ZunoDesk logout={session.logout} request={session.fetch} />}
  </SessionBoundary>;
}

function ZunoDesk({ logout, request }: { readonly logout: () => void; readonly request: typeof fetch }) {
  const [overview, setOverview] = useState<CxforgeOverview | null>(null);
  const [runtimeStatus, setRuntimeStatus] = useState<CxforgeRuntimeStatus | null>(null);
  const [runtimeLogs, setRuntimeLogs] = useState<string[]>([]);
  const [runtimeAction, setRuntimeAction] = useState<CxforgeRuntimeAction | null>(null);
  const [runtimeMessage, setRuntimeMessage] = useState<string | null>(null);
  const [handoffs, setHandoffs] = useState<AcceptedZetroHandoff[]>([]);
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [appName, setAppName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [repository, setRepository] = useState("");
  const [ownedPaths, setOwnedPaths] = useState("apps/");
  const [message, setMessage] = useState<string | null>(null);
  const [handoffMessage, setHandoffMessage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>("servers");
  const [taskTab, setTaskTab] = useState<TaskTab>("running");
  const [serverTab, setServerTab] = useState<ServerTab>("tasks");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const apiUrl = useMemo(() => import.meta.env.VITE_ZUNO_API_URL ?? "", []);

  async function refresh(): Promise<void> {
    setMessage(null);
    const [health, nextOverview, nextHandoffs, nextRuntime, nextLogs] = await Promise.allSettled([getCxforgeHealth(apiUrl, request), getCxforgeOverview(apiUrl, request), listZetroHandoffs(apiUrl, request), getCxforgeRuntime(apiUrl, request), getCxforgeRuntimeLogs(apiUrl, request)]);
    setApiOnline(health.status === "fulfilled" && health.value.status === "ok");
    if (nextRuntime.status === "fulfilled") setRuntimeStatus(nextRuntime.value);
    if (nextLogs.status === "fulfilled") setRuntimeLogs(nextLogs.value);
    if (nextHandoffs.status === "fulfilled") {
      setHandoffs(nextHandoffs.value);
      setHandoffMessage(null);
    } else {
      setHandoffMessage("Zetro handoffs could not be loaded.");
    }
    if (nextOverview.status === "fulfilled") {
      setOverview(nextOverview.value);
    } else {
      setOverview(null);
      setMessage("CXForge is unavailable. Confirm that the selected worker server is running and reachable from Zuno.");
    }
  }

  useEffect(() => { void refresh(); }, [apiUrl, request]);

  async function runRuntimeAction(action: CxforgeRuntimeAction): Promise<void> {
    if (action === "stop" && !window.confirm("Stop the local CXForge development container?")) return;
    setRuntimeAction(action);
    setRuntimeMessage(`${action[0].toUpperCase() + action.slice(1)} in progress…`);
    try {
      setRuntimeStatus(await manageCxforgeRuntime(apiUrl, action, request));
      setRuntimeLogs(await getCxforgeRuntimeLogs(apiUrl, request));
      setRuntimeMessage(`CXForge runtime ${action} completed.`);
      await refresh();
    } catch {
      setRuntimeMessage(`CXForge runtime ${action} failed. Check Docker Desktop and the runtime logs.`);
    } finally {
      setRuntimeAction(null);
    }
  }

  async function submitTask(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setMessage(null);
    setIsCreating(true);
    try {
      const task = await createCxforgeTask(apiUrl, { title, appName, prompt, repository, ownedPaths: parseOwnedPaths(ownedPaths) }, request);
      await queueCxforgeTask(apiUrl, task.id, request);
      setTitle("");
      setPrompt("");
      setMessage("Task sent to CXForge and accepted by the local worker queue.");
      await refresh();
    } catch {
      setMessage("CXForge rejected this task. Add an app, title, repository, and at least one owned path.");
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleSkill(id: string, enabled: boolean): Promise<void> {
    if (!overview) return;
    try {
      const skills = await updateCxforgeSkills(apiUrl, [{ id, enabled }], request);
      setOverview({ ...overview, skills });
      setMessage("Worker skill configuration updated on CXForge.");
    } catch {
      setMessage("CXForge could not update the worker skill configuration.");
    }
  }

  async function reviewTask(decision: "approve" | "reject"): Promise<void> {
    if (!selectedTask) return;
    setReviewMessage(null);
    setIsReviewing(true);
    try {
      const reviewed = await reviewCxforgeTask(apiUrl, selectedTask.id, decision, request);
      setOverview((current) => current ? { ...current, tasks: current.tasks.map((task) => task.id === reviewed.id ? reviewed : task) } : current);
      setReviewMessage(decision === "approve" ? "Task accepted on Zuno and CXForge." : "Task rejected on Zuno and CXForge.");
    } catch {
      setReviewMessage("CXForge only accepts review decisions after a task reaches review.");
    } finally {
      setIsReviewing(false);
    }
  }

  async function prepareMergeRequest(): Promise<void> {
    if (!selectedTask) return;
    setReviewMessage(null);
    setIsReviewing(true);
    try {
      const prepared = await prepareCxforgeMergeRequest(apiUrl, selectedTask.id, request);
      setOverview((current) => current ? { ...current, tasks: current.tasks.map((task) => task.id === prepared.id ? prepared : task) } : current);
      setReviewMessage("Merge request draft prepared from the approved review evidence.");
    } catch {
      setReviewMessage("CXForge only prepares merge requests for approved tasks.");
    } finally {
      setIsReviewing(false);
    }
  }

  async function openMergeRequest(): Promise<void> {
    if (!selectedTask) return;
    setReviewMessage(null);
    setIsReviewing(true);
    try {
      const opened = await openCxforgeMergeRequest(apiUrl, selectedTask.id, request);
      updateTask(opened);
      setReviewMessage("GitHub pull request created. Review it before confirming merge.");
    } catch {
      setReviewMessage("Pull request creation failed. Confirm the GitHub token, repository, and published source branch.");
    } finally {
      setIsReviewing(false);
    }
  }

  async function mergeTask(): Promise<void> {
    if (!selectedTask || !window.confirm("Merge this pull request into the base branch?")) return;
    setReviewMessage(null);
    setIsReviewing(true);
    try {
      const merged = await mergeCxforgeTask(apiUrl, selectedTask.id, request);
      updateTask(merged);
      setReviewMessage("Pull request merged after confirmation.");
    } catch {
      setReviewMessage("GitHub did not merge this pull request. Check branch protection and required reviews.");
    } finally {
      setIsReviewing(false);
    }
  }

  function updateTask(updated: CxforgeOverview["tasks"][number]): void {
    setOverview((current) => current ? { ...current, tasks: current.tasks.map((task) => task.id === updated.id ? updated : task) } : current);
  }

  function prepareHandoff(handoff: AcceptedZetroHandoff): void {
    setTitle(handoff.handoff.task.title);
    setPrompt(assignmentPrompt(handoff));
    if (handoff.handoff.brief.projectScope === "project" && handoff.handoff.brief.projectReference) {
      setRepository(handoff.handoff.brief.projectReference);
    }
    setMessage("Zetro handoff loaded. Confirm the repository and owned paths before creating the CXForge task.");
    globalThis.setTimeout(() => document.getElementById("cxforge-assignment-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  const spacing = "gap-6 p-5 lg:p-8";
  const selectedTask = overview?.tasks.find((task) => task.id === selectedTaskId) ?? null;
  const visibleTasks = overview?.tasks.filter((task) => taskTab === "all" || (taskTab === "running" ? ["draft", "queued", "running"].includes(task.status) : ["review", "approved", "rejected", "blocked", "failed", "merged"].includes(task.status))) ?? [];
  const repositoryOptions = Array.from(new Set(overview?.tasks.map((task) => task.repository) ?? []));
  const appNameOptions = Array.from(new Set(overview?.tasks.map((task) => task.appName).filter(Boolean) ?? []));
  const headerBack = screen === "server" ? <button className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground" onClick={() => setScreen("servers")} type="button">← All servers</button> : screen === "task" ? <button className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted/80 hover:text-foreground" onClick={() => setScreen("server")} type="button">← CXForge tasks</button> : null;
  const headerTitle = screen === "server" ? overview?.containerName ?? "container name unavailable" : screen === "task" ? selectedTask?.title : undefined;
  const headerMeta = screen === "server" ? <><span className="font-mono">{overview?.containerId ?? "container id unavailable"}</span><span>{overview ? `${overview.latencyMs} ms` : "—"}</span></> : screen === "task" && selectedTask ? <span className="font-mono">{selectedTask.id}</span> : null;
  const headerEnd = screen === "server" ? <>{overview?.frontEndPortUrl ? <a className="hidden max-w-56 truncate text-xs underline underline-offset-2 hover:text-foreground md:inline" href={overview.frontEndPortUrl} rel="noreferrer" target="_blank">{overview.frontEndPortUrl}</a> : <span className="text-xs">—</span>}<Button aria-label="Refresh server" onClick={() => void refresh()} size="icon-sm" title="Refresh server" variant="ghost"><RefreshCwIcon /></Button></> : null;
  const headerStatus = screen === "server" ? <span aria-label={apiOnline ? "Connected" : "Disconnected"} className={`size-2.5 shrink-0 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-muted-foreground"}`} role="status" /> : null;
  const headerTabs = screen === "server" ? <nav className="flex min-w-0 gap-1 overflow-x-auto border-b border-border px-5" aria-label="Server sections">{(["tasks", "runtime", "agents", "skills"] as const).map((tab) => <button className={`shrink-0 border-b-2 px-4 py-2 text-sm ${serverTab === tab ? "border-foreground font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`} key={tab} onClick={() => setServerTab(tab)} type="button">{tab[0].toUpperCase() + tab.slice(1)}</button>)}</nav> : null;
  return <MainWorkspace applicationId="zuno" applicationName="Zuno" applicationHeaderBelow={headerTabs} applicationHeaderEnd={headerEnd} applicationHeaderMeta={headerMeta} applicationHeaderStart={headerBack} applicationHeaderStatus={headerStatus} applicationHeaderTitle={headerTitle} showApplicationIdentity={false} showApplicationHeader showWorkspaceTitleInHeader={false} primaryAction={{ label: "New assignment" }} user={{ initials: "ZU", name: "Zuno client", onSignOut: logout }} workspaceTitle="Worker control" statusLabel={apiOnline ? "CXForge connected" : apiOnline === false ? "CXForge offline" : "connecting"}>
    <main className={`mx-auto flex size-full max-w-7xl flex-col overflow-y-auto ${spacing}`}>
      {screen === "servers" ? <section className="divide-y divide-border border-y border-border" aria-label="Connected CXForge edge servers">
        <button className="flex w-full items-center justify-between gap-5 py-5 text-left transition-colors hover:bg-muted/40" onClick={() => setScreen("server")} type="button">
          <div className="flex min-w-0 items-center gap-4"><span aria-hidden="true" className={`size-2.5 shrink-0 rounded-full ${apiOnline ? "bg-emerald-500" : "bg-muted-foreground"}`} /><div className="min-w-0"><p className="font-semibold">{overview?.containerName ?? "container name unavailable"}</p><p className="mt-1 truncate text-sm text-muted-foreground">{overview?.frontEndPortUrl ?? "Preview URL unavailable"} · {overview?.agents.length ?? 0} agent</p></div></div><div className="flex shrink-0 items-center gap-4 text-right"><div><p className="font-medium">{overview ? `${overview.latencyMs} ms` : "—"}</p><p className="text-xs text-muted-foreground">latency</p></div><span aria-hidden="true" className="text-lg text-muted-foreground">›</span></div>
        </button>
      </section> : screen === "task" && selectedTask ? <TaskReport isReviewing={isReviewing} message={reviewMessage} onMerge={() => void mergeTask()} onOpenMerge={() => void openMergeRequest()} onPrepareMerge={() => void prepareMergeRequest()} onReview={(decision) => void reviewTask(decision)} task={selectedTask} /> : <ServerPage appName={appName} appNameOptions={appNameOptions} visibleTasks={visibleTasks} taskTab={taskTab} serverTab={serverTab} message={message} handoffMessage={handoffMessage} handoffs={handoffs} isCreating={isCreating} apiOnline={apiOnline} prompt={prompt} title={title} repository={repository} repositoryOptions={repositoryOptions} ownedPaths={ownedPaths} onAppNameChange={setAppName} onPrepareHandoff={prepareHandoff} onTaskTab={setTaskTab} onTaskClick={(id) => { setReviewMessage(null); setSelectedTaskId(id); setScreen("task"); }} onSubmit={(event) => void submitTask(event)} onPromptChange={setPrompt} onTitleChange={setTitle} onRepositoryChange={setRepository} onOwnedPathsChange={setOwnedPaths} skills={overview?.skills ?? []} agents={overview?.agents ?? []} onToggleSkill={(id, enabled) => void toggleSkill(id, enabled)} runtimeAction={runtimeAction} runtimeLogs={runtimeLogs} runtimeMessage={runtimeMessage} runtimeStatus={runtimeStatus} onRuntimeAction={(action) => void runRuntimeAction(action)} onRuntimeRefresh={() => void refresh()} />}
    </main>
  </MainWorkspace>;
}

interface ServerPageProps {
  readonly appName: string;
  readonly appNameOptions: string[];
  readonly agents: CxforgeOverview["agents"];
  readonly apiOnline: boolean | null;
  readonly handoffMessage: string | null;
  readonly handoffs: readonly AcceptedZetroHandoff[];
  readonly isCreating: boolean;
  readonly message: string | null;
  readonly onOwnedPathsChange: (value: string) => void;
  readonly onAppNameChange: (value: string) => void;
  readonly onPromptChange: (value: string) => void;
  readonly onPrepareHandoff: (handoff: AcceptedZetroHandoff) => void;
  readonly onRepositoryChange: (value: string) => void;
  readonly onRuntimeAction: (action: CxforgeRuntimeAction) => void;
  readonly onRuntimeRefresh: () => void;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly onTaskClick: (id: string) => void;
  readonly onTaskTab: (tab: TaskTab) => void;
  readonly onTitleChange: (value: string) => void;
  readonly onToggleSkill: (id: string, enabled: boolean) => void;
  readonly ownedPaths: string;
  readonly prompt: string;
  readonly repository: string;
  readonly repositoryOptions: string[];
  readonly serverTab: ServerTab;
  readonly skills: CxforgeOverview["skills"];
  readonly taskTab: TaskTab;
  readonly title: string;
  readonly runtimeAction: CxforgeRuntimeAction | null;
  readonly runtimeLogs: readonly string[];
  readonly runtimeMessage: string | null;
  readonly runtimeStatus: CxforgeRuntimeStatus | null;
  readonly visibleTasks: CxforgeOverview["tasks"];
}

function ServerPage({ agents, apiOnline, appName, appNameOptions, handoffMessage, handoffs, isCreating, message, onAppNameChange, onOwnedPathsChange, onPrepareHandoff, onPromptChange, onRepositoryChange, onRuntimeAction, onRuntimeRefresh, onSubmit, onTaskClick, onTaskTab, onTitleChange, onToggleSkill, ownedPaths, prompt, repository, repositoryOptions, runtimeAction, runtimeLogs, runtimeMessage, runtimeStatus, serverTab, skills, taskTab, title, visibleTasks }: ServerPageProps) {
  return <section className="flex min-w-0 flex-col gap-5" aria-label="CXForge server show page">
    {serverTab === "tasks" ? <div className="flex min-w-0 flex-col gap-8"><HandoffInbox handoffs={handoffs} message={handoffMessage} onPrepare={onPrepareHandoff} /><div className="min-w-0"><div className="flex gap-1 border-b border-border py-2">{(["running", "completed", "all"] as const).map((tab) => <button className={`px-3 py-1.5 text-sm ${taskTab === tab ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`} key={tab} onClick={() => onTaskTab(tab)} type="button">{tab[0].toUpperCase() + tab.slice(1)}</button>)}</div><div className="divide-y divide-border">{visibleTasks.length ? visibleTasks.map((task) => <button className="flex w-full flex-col gap-2 py-4 text-left transition-colors hover:bg-muted/40" key={task.id} onClick={() => onTaskClick(task.id)} type="button"><div className="flex items-center justify-between gap-3"><h2 className="min-w-0 truncate font-medium">{task.title}</h2><TaskStatus status={task.status} /></div><p className="truncate text-sm text-muted-foreground">{task.appName} · {task.repository}</p><p className="truncate font-mono text-xs text-muted-foreground">{task.ownedPaths.join(" · ")}</p></button>) : <p className="py-8 text-sm text-muted-foreground">No tasks in this tab.</p>}</div></div><form className="ml-auto flex w-full max-w-3xl scroll-mt-5 flex-col gap-4 border border-border bg-muted/20 p-5" id="cxforge-assignment-form" onSubmit={onSubmit}><div><p className="text-sm font-semibold">Assign to CXForge</p><p className="mt-1 text-sm leading-5 text-muted-foreground">Use a short reference title and a prompt as the executable command.</p></div><div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Reference title<Input onChange={(event) => onTitleChange(event.target.value)} placeholder="Short task reference" value={title} /></label><label className="grid gap-2 text-sm font-medium">App name<Input list="zuno-app-options" onChange={(event) => onAppNameChange(event.target.value)} placeholder="App or module" value={appName} /></label></div><datalist id="zuno-app-options">{appNameOptions.map((option) => <option key={option} value={option} />)}</datalist><label className="grid gap-2 text-sm font-medium">Repository<Input list="zuno-repository-options" onChange={(event) => onRepositoryChange(event.target.value)} placeholder="Owner/repository or local path" value={repository} /></label><datalist id="zuno-repository-options">{repositoryOptions.map((option) => <option key={option} value={option} />)}</datalist><label className="grid gap-2 text-sm font-medium">Prompt / command<Textarea onChange={(event) => onPromptChange(event.target.value)} placeholder="Describe the work for the worker to execute" rows={8} value={prompt} /></label><label className="grid gap-2 text-sm font-medium">Owned paths<Input onChange={(event) => onOwnedPathsChange(event.target.value)} placeholder="apps/web, packages/ui" value={ownedPaths} /></label>{message ? <p className="text-sm leading-5 text-muted-foreground" role="status">{message}</p> : null}<Button disabled={isCreating || !apiOnline} type="submit">{isCreating ? "Sending command…" : "Create task contract"}</Button></form></div> : null}
    {serverTab === "runtime" ? <CxforgeRuntimePanel busyAction={runtimeAction} logs={runtimeLogs} message={runtimeMessage} onAction={onRuntimeAction} onRefresh={onRuntimeRefresh} status={runtimeStatus} /> : null}
    {serverTab === "agents" ? <div><h2 className="text-lg font-semibold">Worker agents</h2><div className="mt-4 divide-y divide-border border-y border-border">{agents.map((agent) => <div className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between" key={agent.id}><div><p className="font-medium">{agent.name}</p><p className="text-sm text-muted-foreground">{agent.capabilities.join(" · ")}</p></div><TaskStatus status={agent.status === "ready" ? "approved" : agent.status === "busy" ? "running" : "blocked"} /></div>)}</div></div> : null}
    {serverTab === "skills" ? <div className="max-w-2xl"><h2 className="text-lg font-semibold">Tune worker skills</h2><p className="mt-1 text-sm text-muted-foreground">Changes are sent to CXForge and returned through the authenticated channel.</p><div className="mt-4 divide-y divide-border border-y border-border">{skills.map((skill) => <label className="flex items-center justify-between gap-3 py-4 text-sm" key={skill.id}><span>{skill.name}</span><input checked={skill.enabled} onChange={(event) => onToggleSkill(skill.id, event.target.checked)} type="checkbox" /></label>)}</div></div> : null}
  </section>;
}

function HandoffInbox({ handoffs, message, onPrepare }: { readonly handoffs: readonly AcceptedZetroHandoff[]; readonly message: string | null; readonly onPrepare: (handoff: AcceptedZetroHandoff) => void }) {
  return <section aria-label="Zetro handoff inbox"><div className="flex items-center gap-2 border-b border-border pb-3"><InboxIcon className="size-4 text-muted-foreground" /><h2 className="text-sm font-semibold">Zetro handoff inbox</h2><span className="text-xs text-muted-foreground">{handoffs.length} accepted</span></div>{message ? <p className="py-4 text-sm text-destructive" role="alert">{message}</p> : handoffs.length ? <div className="divide-y divide-border">{handoffs.map((item) => <article className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between" key={item.zunoHandoffId}><div className="min-w-0"><p className="truncate font-medium">{item.handoff.task.title}</p><p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.handoff.task.summary}</p><p className="mt-1 font-mono text-xs text-muted-foreground">{item.handoff.brief.projectReference ?? "All projects"} · {item.handoff.task.priority}</p></div><Button className="shrink-0" onClick={() => onPrepare(item)} size="sm" variant="outline">Prepare assignment</Button></article>)}</div> : <p className="py-4 text-sm text-muted-foreground">No accepted Zetro handoffs.</p>}</section>;
}

function Metric({ detail, label, value }: { readonly detail: string; readonly label: string; readonly value: string }) {
  return <article className="border-l-2 border-foreground/80 pl-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p><p className="mt-1 truncate text-sm text-muted-foreground" title={detail}>{detail}</p></article>;
}

function TaskReport({ isReviewing, message, onMerge, onOpenMerge, onPrepareMerge, onReview, task }: { readonly isReviewing: boolean; readonly message: string | null; readonly onMerge: () => void; readonly onOpenMerge: () => void; readonly onPrepareMerge: () => void; readonly onReview: (decision: "approve" | "reject") => void; readonly task: CxforgeOverview["tasks"][number] }) {
  const canReview = task.status === "review";
  const canPrepareMerge = task.status === "approved" && !task.mergeRequest;
  const canOpenMerge = task.mergeRequest?.status === "draft";
  const canMerge = task.mergeRequest?.status === "open";
  return <section className="flex flex-col gap-6" aria-label="Task report"><div className="grid gap-5 md:grid-cols-4"><Metric detail={task.status} label="Status" value={task.status} /><Metric detail={task.repository} label="Repository" value="Source" /><Metric detail={task.ownedPaths.join(" · ")} label="Owned paths" value={String(task.ownedPaths.length)} /><Metric detail={task.previewUrl ?? "Preview will appear when the workspace starts"} label="Preview" value={task.previewUrl ? "Open preview" : "Pending"} /></div><article className="border-t border-border pt-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><p className="text-sm font-semibold">Worker report</p><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{task.report}</p>{task.previewUrl ? <a className="mt-5 inline-flex text-sm font-medium underline underline-offset-4" href={task.previewUrl} rel="noreferrer" target="_blank">Open live preview</a> : null}</div><div className="flex shrink-0 gap-2">{canReview ? <><Button disabled={isReviewing} onClick={() => onReview("approve")} variant="default">Approve</Button><Button disabled={isReviewing} onClick={() => onReview("reject")} variant="outline">Reject</Button></> : null}{canPrepareMerge ? <Button disabled={isReviewing} onClick={onPrepareMerge}><GitPullRequestIcon />Prepare pull request</Button> : null}{canOpenMerge ? <Button disabled={isReviewing || !task.mergeRequest?.branchPublished} onClick={onOpenMerge}><GitPullRequestIcon />Create pull request</Button> : null}{canMerge ? <Button disabled={isReviewing} onClick={onMerge}><GitMergeIcon />Merge pull request</Button> : null}</div></div>{message ? <p className="mt-4 text-sm text-muted-foreground" role="status">{message}</p> : null}<ReviewEvidence task={task} />{task.mergeRequest ? <MergeRequestDraft task={task} /> : null}<section className="mt-6 border-t border-border pt-5"><p className="text-sm font-semibold">Prompt / command</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.prompt}</p></section></article></section>;
}

function MergeRequestDraft({ task }: { readonly task: CxforgeOverview["tasks"][number] }) {
  if (!task.mergeRequest) return null;
  return <section className="mt-6 border-t border-border pt-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm font-semibold">Pull request · {task.mergeRequest.status}</p><p className="font-mono text-xs text-muted-foreground">{task.mergeRequest.sourceBranch} → {task.mergeRequest.baseBranch}</p></div><p className="mt-3 text-sm font-medium">{task.mergeRequest.title}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{task.mergeRequest.description}</p>{!task.mergeRequest.branchPublished ? <p className="mt-3 text-sm text-destructive">The source branch is local. Configure a writable network remote before creating the pull request.</p> : null}{task.mergeRequest.url ? <a className="mt-4 inline-flex items-center gap-2 text-sm font-medium underline underline-offset-4" href={task.mergeRequest.url} rel="noreferrer" target="_blank">Open on GitHub<ExternalLinkIcon className="size-4" /></a> : null}</section>;
}

function ReviewEvidence({ task }: { readonly task: CxforgeOverview["tasks"][number] }) {
  return <section className="mt-6 grid gap-5 border-t border-border pt-5 lg:grid-cols-2">
    <EvidenceSection empty="No changed files reported." title="Changed files">{task.changedFiles?.length ? <ul className="space-y-2">{task.changedFiles.map((file) => <li className="break-all font-mono text-xs text-muted-foreground" key={file}>{file}</li>)}</ul> : null}</EvidenceSection>
    <EvidenceSection empty="No test output reported." title="Test output">{task.testOutput ? <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{task.testOutput}</pre> : null}</EvidenceSection>
    <EvidenceSection className="lg:col-span-2" empty="No diff reported." title="Diff">{task.diff ? <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">{task.diff}</pre> : null}</EvidenceSection>
  </section>;
}

function EvidenceSection({ children, className = "", empty, title }: { readonly children: React.ReactNode; readonly className?: string; readonly empty: string; readonly title: string }) {
  return <section className={`min-w-0 border border-border bg-muted/20 p-4 ${className}`}><p className="text-sm font-semibold">{title}</p><div className="mt-3">{children || <p className="text-sm text-muted-foreground">{empty}</p>}</div></section>;
}

function TaskStatus({ status }: { readonly status: CxforgeOverview["tasks"][number]["status"] }) {
  const tone = status === "approved" || status === "merged" ? "bg-emerald-500" : status === "rejected" || status === "blocked" || status === "failed" ? "bg-destructive" : status === "queued" || status === "running" ? "bg-amber-500" : "bg-muted-foreground";
  return <span className="inline-flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground"><span aria-hidden="true" className={`size-1.5 rounded-full ${tone}`} />{status}</span>;
}

function parseOwnedPaths(value: string): string[] {
  return value.split(",").map((path) => path.trim()).filter(Boolean);
}
