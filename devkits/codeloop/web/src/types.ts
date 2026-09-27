import type { AgentChatMessage } from "@codexsun/ui/blocks/agent-chat-workspace";

export interface ProjectKnowledgeFile {
  id: string;
  name: string;
  path: string;
  size: string;
  description: string;
}

export interface ProjectDetails {
  id: string;
  name: string;
  description: string;
  instructions: string;
  knowledgeFiles: ProjectKnowledgeFile[];
}

export interface ProjectConversation {
  id: string;
  projectId?: string;
  title: string;
  updatedAt: string;
  messages: AgentChatMessage[];
  pinned?: boolean;
  unread?: boolean;
  status?: "running" | "completed" | "idle";
}
