import { useState, type ReactNode } from "react";
import { BotIcon, BookOpenIcon, CircleHelpIcon, FolderIcon } from "lucide-react";
import { AgentChatWorkspace, type AgentChatMessage, type AgentChatRuntime } from "@codexsun/ui/blocks/agent-chat-workspace";
import { AgentProviderSettings } from "@codexsun/ui/blocks/agent-provider-settings";
import { AgentTaskWorkspace } from "@codexsun/ui/blocks/agent-task-workspace";
import { AnalysisContext } from "@codexsun/ui/blocks/analysis-context";
import { ArchivedChatWorkspace } from "@codexsun/ui/blocks/archived-chat-workspace";
import { LoginPage } from "@codexsun/ui/blocks/auth";
import { ChatComposer } from "@codexsun/ui/blocks/chat-composer";
import { ChatHistory } from "@codexsun/ui/blocks/chat-history";
import { ChatResponseProgress } from "@codexsun/ui/blocks/chat-response-progress";
import { ChatRuntimeControls } from "@codexsun/ui/blocks/chat-runtime-controls";
import { ChatRuntimeTrace } from "@codexsun/ui/blocks/chat-runtime-trace";
import { CodexConnectionSettings } from "@codexsun/ui/blocks/codex-connection-settings";
import { HandoverStack } from "@codexsun/ui/blocks/handover-stack";
import { IdeaHandoverWorkspace, type IdeaBriefDraft, type IdeaTaskDraft } from "@codexsun/ui/blocks/idea-handover";
import { GlobalLoader } from "@codexsun/ui/blocks/loader";
import { MasterList } from "@codexsun/ui/blocks/master-list";
import { MermaidPreview } from "@codexsun/ui/blocks/mermaid-preview";
import { NotificationCenterPage } from "@codexsun/ui/blocks/notifications";
import { WorkspaceMetricCard, WorkspacePageHeader } from "@codexsun/ui/blocks/workspace";
import { AgentWorkspace } from "@codexsun/ui/layouts/agent-workspace";
import { DocumentationWorkspace } from "@codexsun/ui/layouts/documentation-workspace";
import { Button } from "@codexsun/ui/components/button";
import { importedPages } from "./imported-pages";
import { UiTemplatePage } from "./ui-template-page";

const sampleRuntime: AgentChatRuntime = {
  connected: true, message: "Ready", model: "Example model", models: ["Example model", "Fast model"],
  provider: "Local", providers: ["Local", "Cloud"], reasoning: "Medium", reasoningLevels: ["Low", "Medium", "High"]
};

const sampleBrief: IdeaBriefDraft = {
  audience: "Project team", constraints: "Keep the existing workflow", exclusions: "Billing",
  outcome: "A clearer handover", projectReference: null, projectScope: "all-projects",
  risks: "Missing context", scope: "Summarize the request", sourceMessageIds: ["source-1"],
  status: "draft", successSignals: "The next person can act", title: "Improve handover"
};

const sampleTask: IdeaTaskDraft = {
  acceptanceCriteria: "The brief is complete", priority: "medium", summary: "Prepare a concise handover", title: "Prepare handover"
};

function ExtraPreview({ id }: { id: string }) {
  const [draft, setDraft] = useState("");
  const [runtime, setRuntime] = useState(sampleRuntime);
  const [selected, setSelected] = useState("chat-1");
  const [open, setOpen] = useState(false);
  const [brief, setBrief] = useState(sampleBrief);
  const [taskDraft, setTaskDraft] = useState(sampleTask);
  const [stage, setStage] = useState<"explore" | "compare" | "revise" | "final">("explore");
  const [read, setRead] = useState(false);
  const [provider, setProvider] = useState("Local");
  const [model, setModel] = useState("Example model");
  const [reasoning, setReasoning] = useState("Medium");
  const [messages, setMessages] = useState<AgentChatMessage[]>([{ id: "welcome", role: "assistant", content: "How can I help with your project?" }]);
  const noop = () => {};
  const chats = [{ id: "chat-1", title: "Project handover", subtitle: "Today", pinned: true }, { id: "chat-2", title: "Design review", subtitle: "Yesterday" }];
  let preview: ReactNode;

  switch (id) {
    case "agent-chat-workspace":
      preview = <div className="h-[36rem] overflow-hidden rounded border"><AgentChatWorkspace draft={draft} messages={messages} onDraftChange={setDraft} onReconnect={noop} onRuntimeChange={setRuntime} onSubmit={() => { if (draft.trim()) { setMessages([...messages, { id: String(Date.now()), role: "user", content: draft }]); setDraft(""); } }} runtime={runtime} /></div>;
      break;
    case "agent-provider-settings":
      preview = <><Button onClick={() => setOpen(true)}>Open provider settings</Button><AgentProviderSettings onOpenChange={setOpen} onSave={noop} open={open} providers={[{ id: "demo", name: "Example provider", description: "Configuration preview", enabled: true, endpoint: "https://example.invalid", icon: BotIcon, model: "Example model", modelOptions: ["Example model"] }]} /></>;
      break;
    case "agent-task-workspace":
      preview = <div className="h-[28rem] overflow-hidden rounded border"><AgentTaskWorkspace onBack={noop} onSelectTask={setSelected} selectedTaskId={selected} tasks={[{ id: "task-1", title: "Prepare handover", status: "Ready", priority: "medium", projectScope: "all-projects", projectReference: null, briefId: "brief-1", createdAt: "2026-10-10T08:00:00Z", summary: "Collect the relevant project context.", acceptanceCriteria: "A teammate can continue the task." }]} /></div>;
      break;
    case "analysis-context": preview = <AnalysisContext root="D:/workspace/project" />; break;
    case "archived-chat-workspace":
      preview = <div className="h-[26rem] overflow-hidden rounded border"><ArchivedChatWorkspace chats={[{ id: "chat-1", title: "Previous planning chat", createdAt: "2026-10-09T08:00:00Z", messageCount: 12 }]} onDelete={noop} onDeleteAll={noop} onOpen={noop} onRestore={noop} /></div>;
      break;
    case "auth": preview = <div className="min-h-[32rem] overflow-hidden rounded border"><LoginPage brandName="Example workspace" embedded onSubmit={noop} /></div>; break;
    case "chat-composer": preview = <ChatComposer onSubmit={() => setDraft("")} onValueChange={setDraft} value={draft} />; break;
    case "chat-history": preview = <div className="h-80 max-w-72 rounded border"><ChatHistory activeId={selected} items={chats} onCreate={noop} onSelect={setSelected} /></div>; break;
    case "chat-response-progress": preview = <div className="max-w-md"><ChatResponseProgress elapsedSeconds={12} label="Reading project files" /></div>; break;
    case "chat-runtime-controls": preview = <ChatRuntimeControls connected message="Ready" model={model} models={runtime.models} onModelChange={setModel} onProviderChange={setProvider} onReasoningChange={setReasoning} onReconnect={noop} provider={provider} providers={runtime.providers} reasoning={reasoning} reasoningLevels={runtime.reasoningLevels} />; break;
    case "chat-runtime-trace": preview = <div className="max-w-xl"><ChatRuntimeTrace elapsedSeconds={12} events={[{ type: "request", message: "Read project context" }, { type: "command", message: "Checked files" }]} isWorking /></div>; break;
    case "codex-connection-settings": preview = <><Button onClick={() => setOpen(true)}>Open connection settings</Button><CodexConnectionSettings connected={false} deviceCode={{ message: "No code requested", status: "idle" }} message="Not connected" onConnectLocal={noop} onCopyCode={noop} onCopyUrl={noop} onGenerateDeviceCode={noop} onOpenBrowser={noop} onOpenChange={setOpen} open={open} /></>; break;
    case "handover-stack": preview = <><Button onClick={() => setOpen(true)}>Open handover stack</Button><HandoverStack items={[{ id: "response-1", content: "A concise example response ready for handover." }]} onConsolidate={noop} onOpenChange={setOpen} onRemove={noop} open={open} /></>; break;
    case "idea-handover": preview = <div className="h-[38rem] overflow-hidden rounded border"><IdeaHandoverWorkspace brief={brief} currentStage={stage} handoffPackagePreview="Example handover package" onAutoFillBrief={noop} onBack={noop} onBriefChange={setBrief} onCopyHandoffPackage={noop} onCreateTask={noop} onDeliverTask={noop} onSaveBrief={noop} onStageChange={setStage} onTaskDraftChange={setTaskDraft} sources={[{ id: "source-1", content: "The original idea" }]} taskDraft={taskDraft} /></div>; break;
    case "loader": preview = <div className="relative h-36 rounded border"><GlobalLoader active delayMs={0} label="Loading workspace" /></div>; break;
    case "master-list": preview = <MasterList fields={[{ id: "name", label: "Name" }, { id: "status", label: "Status" }]} records={[{ id: "1", name: "Project Alpha", status: "Active" }, { id: "2", name: "Project Beta", status: "Draft" }]} title="Projects" variant="cards" />; break;
    case "mermaid-preview": preview = <MermaidPreview interactive source={"flowchart LR\n  Idea --> Review --> Handover"} />; break;
    case "notifications": preview = <NotificationCenterPage embedded items={[{ id: "1", title: "Review complete", description: "The project is ready to inspect.", time: "Now", read }, { id: "2", title: "New handover", description: "A teammate shared an update.", time: "1 hour ago", read: true }]} onMarkAllRead={() => setRead(true)} />; break;
    case "workspace": preview = <div className="grid gap-6"><WorkspacePageHeader title="Workspace overview" description="A reusable heading and metric cards." /><div className="grid gap-4 sm:grid-cols-2"><WorkspaceMetricCard label="Active projects" value="12" trend={{ direction: "up", label: "+2 this week" }} /><WorkspaceMetricCard label="Pending reviews" value="3" icon={FolderIcon} tone="warning" /></div></div>; break;
    case "agent-workspace": preview = <div className="h-[30rem] overflow-hidden rounded border"><AgentWorkspace primaryRail={{ label: "Projects", items: [{ id: "projects", label: "Projects", icon: FolderIcon, active: true }] }} secondaryRail={{ label: "Help", items: [{ id: "help", label: "Help", icon: CircleHelpIcon }] }}><div className="p-6">Agent workspace canvas</div></AgentWorkspace></div>; break;
    case "documentation-workspace": preview = <div className="h-[32rem] overflow-hidden rounded border"><DocumentationWorkspace applicationIcon={BookOpenIcon} navigation={[{ label: "Guides", items: [{ label: "Introduction" }, { label: "Getting started" }] }]} workspaceTitle="Documentation"><div className="p-6">Documentation workspace canvas</div></DocumentationWorkspace></div>; break;
    default: return null;
  }

  const item = importedPages.find((entry) => entry.id === id);
  if (!item) return null;
  const importPath = `@codexsun/ui/${item.kind}/${id}`;
  return <UiTemplatePage code={`import * as SharedUi from "${importPath}";`} importPath={importPath} kind={item.kind === "layouts" ? "Layout" : "Block"} name={item.name} preview={preview} usageDescription="Interact with this shared UI example. Supply application data and actions when using the block in a real workspace." />;
}

export function ImportedExtraPage({ id }: { id: string }) {
  return <ExtraPreview key={id} id={id} />;
}
