import type { ProjectConversation, ProjectDetails } from "./types";

export interface ProjectWorkspaceItem {
  id: string;
  name: string;
  path: string;
  repository?: string;
  taskCount?: number;
  unreadCount?: number;
  description?: string;
  instructions?: string;
  knowledgeFiles?: ProjectDetails["knowledgeFiles"];
}

export const initialProjectsList: ProjectWorkspaceItem[] = [
  {
    id: "codexsun",
    name: "codexsun",
    path: "E:\\codexsun\\codexsun",
    repository: "CODEXSUN/codexsun",
    taskCount: 0,
    unreadCount: 0,
    description: "Autonomous code workflow orchestrator and developer tooling for CODEXSUN.",
  },
];

export const initialProject: ProjectDetails = {
  id: "codexsun",
  name: "codexsun",
  description: "Autonomous code workflow orchestrator and developer tooling for CODEXSUN.",
  instructions:
    "You are an AI coding assistant operating within the codexsun project context. Adhere strictly to the CODEXSUN repository rules: run all operations within devkits/codeloop, use typed Fastify routes with Zod validation, and build modern React 19 UI with @codexsun/ui components. Provide concise, production-ready code with step-by-step thinking.",
  knowledgeFiles: [
    {
      id: "kf-1",
      name: "README.md",
      path: "devkits/codeloop/README.md",
      size: "2.4 KB",
      description: "Architecture, ownership boundaries, and verification commands",
    },
    {
      id: "kf-2",
      name: "server.ts",
      path: "api/src/server.ts",
      size: "8.1 KB",
      description: "Fastify HTTP API, identity routes, and provider verification",
    },
    {
      id: "kf-3",
      name: "provider.ts",
      path: "api/src/modules/foundation/provider.ts",
      size: "0.4 KB",
      description: "CodeloopFoundationProvider registration and health contract",
    },
    {
      id: "kf-4",
      name: "App.tsx",
      path: "web/src/App.tsx",
      size: "8.9 KB",
      description: "Agent Workspace layout, desks, and MDI navigation",
    },
  ],
};

export const initialConversations: ProjectConversation[] = [];
