import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { Badge } from "@codexsun/ui/components/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@codexsun/ui/components/card";
import {
  SendIcon,
  MicIcon,
  MicOffIcon,
  PlusIcon,
  SettingsIcon,
  SidebarIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  MoreVerticalIcon,
  PinIcon,
  ArchiveIcon,
  Trash2Icon,
  CopyIcon,
  SplitIcon,
  FolderIcon,
  FolderPlusIcon,
  GitBranchIcon,
  BrainCircuitIcon,
  Wand2Icon,
  LayersIcon,
  NetworkIcon,
  FileTextIcon,
  CompassIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import { useCodeitzState, type ChatMessage, type ChatSession, type TodoItem } from "../hooks/useCodeitzState";
import { MemoryBankPanel } from "./panels/MemoryBankPanel";
import { SkillsOrganiserPanel } from "./panels/SkillsOrganiserPanel";
import { TaskRunnerPanel } from "./panels/TaskRunnerPanel";
import { CapabilitiesPanel } from "./panels/CapabilitiesPanel";
import {
  fetchMemoryBank,
  updateMemorySectionApi,
  createMemoryEntryApi,
  syncMemoryBankApi,
  fetchSkillsLibraryApi,
  scanSkillsApi,
  organizeSkillApi,
  recommendSkillsApi,
  fetchQueueState,
  startRunner,
  pauseRunner,
  stepRunner,
  stepParallelRunners,
  dequeueTask,
  fetchProjects,
  fetchConversations,
  createProject,
  createConversation,
  updateConversation,
  deleteConversation,
  enqueueTask,
  activateConversation,
} from "../codeitz-api";

interface ChatDeskProps {
  logout: () => void;
  request: typeof fetch;
}

export function ChatDesk({ logout, request }: ChatDeskProps) {
  const codeitzState = useCodeitzState();
  const queryClient = useQueryClient();

  // API Queries
  const { data: memoryBankData } = useQuery({
    queryKey: ["memoryBank"],
    queryFn: () => fetchMemoryBank("global", request),
  });

  const { data: skillsCatalog } = useQuery({
    queryKey: ["skillsCatalog"],
    queryFn: () => fetchSkillsLibraryApi(undefined, request),
  });

  const { data: runnerState } = useQuery({
    queryKey: ["runnerState"],
    queryFn: () => fetchQueueState(request),
    refetchInterval: 2000,
  });

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => fetchProjects(request),
  });

  const { data: conversations } = useQuery({
    queryKey: ["conversations", codeitzState.activeProjectId],
    queryFn: () => fetchConversations(codeitzState.activeProjectId, request),
  });

  // Local state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Sync conversations from API
  useEffect(() => {
    if (conversations) {
      setSessions(conversations.map((conv: any) => ({
        id: conv.id,
        projectId: conv.projectId,
        title: conv.title,
        fullTitle: conv.fullTitle,
        timeAgo: conv.relativeTime,
        updatedTime: conv.updatedAt,
        status: conv.active ? "active" : "idle",
        phase: conv.activeTaskId ? "in_progress" : undefined,
        priority: undefined,
        messages: [],
        taskId: conv.activeTaskId,
        pinned: conv.pinned,
        archived: conv.archived,
        unread: conv.unread,
        summary: conv.summary,
      })));
    }
  }, [conversations]);

  // API Handlers
  const handleUpdateMemorySection = async (section: string, content: string) => {
    await updateMemorySectionApi(section as any, content, "global", request);
    queryClient.invalidateQueries({ queryKey: ["memoryBank"] });
  };

  const handleCreateMemoryEntry = async (entry: any) => {
    await createMemoryEntryApi(entry, request);
    queryClient.invalidateQueries({ queryKey: ["memoryBank"] });
  };

  const handleSyncMemory = async () => {
    await syncMemoryBankApi("global", request);
    queryClient.invalidateQueries({ queryKey: ["memoryBank"] });
  };

  const handleScanSkills = async () => {
    await scanSkillsApi(undefined, false, request);
    queryClient.invalidateQueries({ queryKey: ["skillsCatalog"] });
  };

  const handleOrganizeSkill = async (name: string, updates: any) => {
    await organizeSkillApi({ name, ...updates }, request);
    queryClient.invalidateQueries({ queryKey: ["skillsCatalog"] });
  };

  const handleRecommendSkills = async (prompt: string, limit: number) => {
    return await recommendSkillsApi(prompt, limit, request);
  };

  const handleStartRunner = async () => {
    await startRunner(undefined, request);
    queryClient.invalidateQueries({ queryKey: ["runnerState"] });
  };

  const handlePauseRunner = async () => {
    await pauseRunner(request);
    queryClient.invalidateQueries({ queryKey: ["runnerState"] });
  };

  const handleStepRunner = async () => {
    await stepRunner(request);
    queryClient.invalidateQueries({ queryKey: ["runnerState"] });
  };

  const handleStepParallel = async () => {
    await stepParallelRunners(request);
    queryClient.invalidateQueries({ queryKey: ["runnerState"] });
  };

  const handleDequeueTask = async (taskId: string) => {
    await dequeueTask(taskId, request);
    queryClient.invalidateQueries({ queryKey: ["runnerState"] });
  };

  const handleSendMessage = async () => {
    if (!codeitzState.inputPrompt.trim()) return;

    const userMessage: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      role: "user",
      content: codeitzState.inputPrompt,
      timestamp: new Date().toISOString(),
    };

    setSessions(prev => prev.map(s => 
      s.id === activeSessionId 
        ? { ...s, messages: [...s.messages, userMessage] }
        : s
    ));

    codeitzState.setInputPrompt("");
    codeitzState.setIsExecuting(true);

    // Simulate task creation and execution
    try {
      await enqueueTask({
        taskId: Math.random().toString(36).substr(2, 9),
        priority: codeitzState.enqueuePriority,
        projectId: codeitzState.activeProjectId,
      }, request);

      // Simulate AI response
      setTimeout(() => {
        const assistantMessage: ChatMessage = {
          id: Math.random().toString(36).substr(2, 9),
          role: "assistant",
          content: "I'll help you with that task. Let me analyze the requirements and create a plan.",
          timestamp: new Date().toISOString(),
          thinking: "Analyzing the request...",
          todos: [
            { id: "1", label: "Understand requirements", completed: true },
            { id: "2", label: "Create implementation plan", completed: false },
            { id: "3", label: "Execute changes", completed: false },
          ],
        };

        setSessions(prev => prev.map(s => 
          s.id === activeSessionId 
            ? { ...s, messages: [...s.messages, assistantMessage] }
            : s
        ));

        codeitzState.setIsExecuting(false);
      }, 1000);
    } catch (error) {
      codeitzState.setIsExecuting(false);
    }
  };

  const handleCreateConversation = async () => {
    if (!codeitzState.newConvTitle.trim()) return;

    try {
      const newConv = await createConversation(codeitzState.newConvProjectId, {
        title: codeitzState.newConvTitle,
      }, request);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setActiveSessionId(newConv.id);
      codeitzState.setNewConvTitle("");
      codeitzState.setIsNewConvOpen(false);
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <MainWorkspace
      applicationId="codeitz"
      applicationName="Codeitz"
      showApplicationHeader={false}
      contentClassName="p-0 overflow-hidden"
    >
      <div className="flex h-screen w-full bg-[#0d0e10] text-[#e2e3e5] overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-[#121315] border-r border-[#2a2b2e] flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-[#2a2b2e]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Codeitz</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => codeitzState.setSidebarOpen(!codeitzState.sidebarOpen)}
                className="text-[#8c8d8e] hover:text-white"
              >
                {codeitzState.sidebarOpen ? <PanelLeftCloseIcon className="w-4 h-4" /> : <PanelLeftOpenIcon className="w-4 h-4" />}
              </Button>
            </div>
            <Button
              onClick={() => codeitzState.setIsNewConvOpen(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>

          {/* Projects List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {projects?.map((project: any) => (
              <div key={project.id}>
                <button
                  onClick={() => codeitzState.setExpandedProjects((prev: Record<string, boolean>) => ({
                    ...prev,
                    [project.id]: !prev[project.id]
                  }))}
                  className="flex items-center gap-2 w-full text-left"
                >
                  <FolderIcon className="w-4 h-4 text-[#8c8d8e]" />
                  <span className="text-sm font-medium text-white">{project.name}</span>
                </button>
                {codeitzState.expandedProjects[project.id] && (
                  <div className="ml-4 mt-2 space-y-1">
                    {sessions
                      .filter(s => s.projectId === project.id && !s.archived)
                      .map(session => (
                        <button
                          key={session.id}
                          onClick={() => {
                            setActiveSessionId(session.id);
                            activateConversation(project.id, session.id, request);
                          }}
                          className={`flex items-center gap-2 w-full text-left px-2 py-1 rounded transition-colors ${
                            activeSessionId === session.id
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-[#8c8d8e] hover:text-white hover:bg-[#202226]"
                          }`}
                        >
                          {session.pinned && <PinIcon className="w-3 h-3" />}
                          <span className="text-sm truncate">{session.title}</span>
                          {session.unread && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-[#2a2b2e]">
            <Button
              variant="ghost"
              onClick={logout}
              className="w-full text-[#8c8d8e] hover:text-white"
            >
              <XIcon className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-[#121315]">
          {/* Top Bar with drawer toggles */}
          <div className="h-14 border-b border-[#2a2b2e] px-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white">
                {activeSession ? activeSession.title : "Codeitz Studio"}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={codeitzState.activeDrawer === "memory" ? "default" : "ghost"}
                onClick={() => codeitzState.setActiveDrawer(codeitzState.activeDrawer === "memory" ? "none" : "memory")}
                className={codeitzState.activeDrawer === "memory" ? "bg-blue-500 text-white" : "text-[#8c8d8e] hover:text-white"}
              >
                <BrainCircuitIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={codeitzState.activeDrawer === "skills" ? "default" : "ghost"}
                onClick={() => codeitzState.setActiveDrawer(codeitzState.activeDrawer === "skills" ? "none" : "skills")}
                className={codeitzState.activeDrawer === "skills" ? "bg-blue-500 text-white" : "text-[#8c8d8e] hover:text-white"}
              >
                <Wand2Icon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={codeitzState.activeDrawer === "queue" ? "default" : "ghost"}
                onClick={() => codeitzState.setActiveDrawer(codeitzState.activeDrawer === "queue" ? "none" : "queue")}
                className={codeitzState.activeDrawer === "queue" ? "bg-blue-500 text-white" : "text-[#8c8d8e] hover:text-white"}
              >
                <LayersIcon className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={codeitzState.activeDrawer === "capabilities" ? "default" : "ghost"}
                onClick={() => codeitzState.setActiveDrawer(codeitzState.activeDrawer === "capabilities" ? "none" : "capabilities")}
                className={codeitzState.activeDrawer === "capabilities" ? "bg-blue-500 text-white" : "text-[#8c8d8e] hover:text-white"}
              >
                <NetworkIcon className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {activeSession ? (
            <>
              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {activeSession.messages.map((message: ChatMessage) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-2xl rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                        : "bg-[#191a1c] text-[#f3f4f6] border border-[#2a2b2e]"
                    }`}>
                      {message.thinking && (
                        <div className="mb-2 text-sm text-[#8c8d8e] italic">
                          {message.thinking}
                        </div>
                      )}
                      <p className="text-sm">{message.content}</p>
                      {message.todos && message.todos.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {message.todos.map((todo: TodoItem) => (
                            <div key={todo.id} className="flex items-center gap-2 text-sm">
                              {todo.completed ? (
                                <CheckIcon className="w-4 h-4 text-green-400" />
                              ) : (
                                <div className="w-4 h-4 rounded border border-[#8c8d8e]" />
                              )}
                              <span className={todo.completed ? "text-[#8c8d8e] line-through" : "text-white"}>
                                {todo.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-[#2a2b2e]">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={codeitzState.inputPrompt}
                    onChange={(e) => codeitzState.setInputPrompt(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Describe your task..."
                    disabled={codeitzState.isExecuting}
                    className="flex-1 px-4 py-2 rounded-lg bg-[#191a1c] border border-[#2a2b2e] text-[#f3f4f6] placeholder-[#8c8d8e] focus:outline-none focus:border-blue-500/50 disabled:opacity-50"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={codeitzState.isExecuting || !codeitzState.inputPrompt.trim()}
                    className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
                  >
                    <SendIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <CompassIcon className="w-16 h-16 mx-auto mb-4 text-[#8c8d8e]" />
                <h3 className="text-lg font-medium text-white mb-2">Select a conversation</h3>
                <p className="text-[#8c8d8e]">Choose a conversation from the sidebar or create a new one</p>
              </div>
            </div>
          )}
        </div>

        {/* Drawer */}
        {codeitzState.activeDrawer !== "none" && (
          <div className="w-96 bg-[#121315] border-l border-[#2a2b2e] overflow-y-auto">
            <div className="p-4 border-b border-[#2a2b2e] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {codeitzState.activeDrawer === "memory" && "Memory Bank"}
                {codeitzState.activeDrawer === "skills" && "Skills Organiser"}
                {codeitzState.activeDrawer === "queue" && "Task Runner"}
                {codeitzState.activeDrawer === "capabilities" && "Capabilities"}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => codeitzState.setActiveDrawer("none")}
                className="text-[#8c8d8e] hover:text-white"
              >
                <XIcon className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              {codeitzState.activeDrawer === "memory" && (
                <MemoryBankPanel
                  memorySection={codeitzState.memorySection}
                  setMemorySection={codeitzState.setMemorySection}
                  memorySectionDraft={codeitzState.memorySectionDraft}
                  setMemorySectionDraft={codeitzState.setMemorySectionDraft}
                  memorySearch={codeitzState.memorySearch}
                  setMemorySearch={codeitzState.setMemorySearch}
                  newMemoryKey={codeitzState.newMemoryKey}
                  setNewMemoryKey={codeitzState.setNewMemoryKey}
                  newMemoryContent={codeitzState.newMemoryContent}
                  setNewMemoryContent={codeitzState.setNewMemoryContent}
                  newMemoryCategory={codeitzState.newMemoryCategory}
                  setNewMemoryCategory={codeitzState.setNewMemoryCategory}
                  newMemoryTags={codeitzState.newMemoryTags}
                  setNewMemoryTags={codeitzState.setNewMemoryTags}
                  newMemoryImportance={codeitzState.newMemoryImportance}
                  setNewMemoryImportance={codeitzState.setNewMemoryImportance}
                  memoryToast={codeitzState.memoryToast}
                  setMemoryToast={codeitzState.setMemoryToast}
                  memoryBankData={memoryBankData}
                  onUpdateSection={handleUpdateMemorySection}
                  onCreateEntry={handleCreateMemoryEntry}
                  onSyncMemory={handleSyncMemory}
                />
              )}
              {codeitzState.activeDrawer === "skills" && (
                <SkillsOrganiserPanel
                  skillCategoryFilter={codeitzState.skillCategoryFilter}
                  setSkillCategoryFilter={codeitzState.setSkillCategoryFilter}
                  skillSearch={codeitzState.skillSearch}
                  setSkillSearch={codeitzState.setSkillSearch}
                  selectedSkillForDetails={codeitzState.selectedSkillForDetails}
                  setSelectedSkillForDetails={codeitzState.setSelectedSkillForDetails}
                  skillToast={codeitzState.skillToast}
                  setSkillToast={codeitzState.setSkillToast}
                  skillsCatalog={skillsCatalog}
                  onScanSkills={handleScanSkills}
                  onOrganizeSkill={handleOrganizeSkill}
                  onRecommendSkills={handleRecommendSkills}
                />
              )}
              {codeitzState.activeDrawer === "queue" && (
                <TaskRunnerPanel
                  queueTab={codeitzState.queueTab}
                  setQueueTab={codeitzState.setQueueTab}
                  runnerState={runnerState}
                  queueItems={runnerState?.queue || []}
                  runnerLogs={runnerState?.logs || []}
                  runnerConcurrency={codeitzState.runnerConcurrency}
                  setRunnerConcurrency={codeitzState.setRunnerConcurrency}
                  onStartRunner={handleStartRunner}
                  onPauseRunner={handlePauseRunner}
                  onStepRunner={handleStepRunner}
                  onStepParallel={handleStepParallel}
                  onDequeueTask={handleDequeueTask}
                />
              )}
              {codeitzState.activeDrawer === "capabilities" && (
                <CapabilitiesPanel
                  capabilities={[]}
                  webSearchActive={codeitzState.webSearchActive}
                  setWebSearchActive={codeitzState.setWebSearchActive}
                  browserActive={codeitzState.browserActive}
                  setBrowserActive={codeitzState.setBrowserActive}
                  computerUseActive={codeitzState.computerUseActive}
                  setComputerUseActive={codeitzState.setComputerUseActive}
                  imageGenActive={codeitzState.imageGenActive}
                  setImageGenActive={codeitzState.setImageGenActive}
                  ttsEnabled={codeitzState.ttsEnabled}
                  setTtsEnabled={codeitzState.setTtsEnabled}
                  autoCorrectSpelling={codeitzState.autoCorrectSpelling}
                  setAutoCorrectSpelling={codeitzState.setAutoCorrectSpelling}
                  attachedFiles={codeitzState.attachedFiles}
                  setAttachedFiles={codeitzState.setAttachedFiles}
                  onWebSearch={async () => {}}
                  onBrowserAutomation={async () => {}}
                  onComputerUse={async () => {}}
                  onImageGeneration={async () => {}}
                  onVisionAnalysis={async () => {}}
                  onExcelAnalysis={async () => {}}
                  onPdfAnalysis={async () => {}}
                  onTranscribeVoice={async () => {}}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </MainWorkspace>
  );
}
