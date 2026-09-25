import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { findWorkspaceRoot } from "./workspace-root.js";
import type {
  Conversation,
  CreateConversationInput,
  CreateProjectInput,
  Project,
  UpdateProjectInput,
} from "../contracts/swe-contracts.js";

export class ProjectsService {
  private projects: Map<string, Project> = new Map();

  constructor(private readonly defaultRoot: string = findWorkspaceRoot()) {
    this.seedDefaultProjects();
  }

  private seedDefaultProjects(): void {
    const now = new Date().toISOString();

    const codexsun: Project = {
      id: "codexsun",
      name: "codexsun",
      rootPath: this.defaultRoot,
      worktreeBranch: "main",
      isWorktree: false,
      worktreeStatus: "active",
      defaultModel: "Gemini 3.8 Flash (Medium)",
      verificationRigor: "full",
      autoRollback: true,
      runnerConcurrency: 2,
      createdAt: now,
      updatedAt: now,
      conversations: [
        {
          id: "conv-agentic-studio",
          projectId: "codexsun",
          title: "Build Agentic Software Eng...",
          relativeTime: "now",
          active: true,
          messagesCount: 14,
          summary: "Building autonomous SWE pipeline studio with parallel task runner.",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "conv-repo-apps",
          projectId: "codexsun",
          title: "Get Repository Apps Info",
          relativeTime: "2h",
          active: false,
          messagesCount: 6,
          summary: "Inspected monorepo workspace boundary and registered application targets.",
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: "conv-repo-arch",
          projectId: "codexsun",
          title: "Repository Architecture Ga...",
          relativeTime: "5d",
          active: false,
          messagesCount: 22,
          summary: "Architecture baseline gateway and platform contracts verification.",
          createdAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 86400 * 1000).toISOString(),
        },
      ],
    };

    const workspace: Project = {
      id: "workspace",
      name: "Workspace",
      rootPath: resolve(this.defaultRoot, ".worktrees/workspace"),
      worktreeBranch: "isolated/workspace",
      isWorktree: true,
      worktreeStatus: "isolated",
      defaultModel: "Claude 3.5 Sonnet (Agentic SWE)",
      verificationRigor: "fast",
      autoRollback: true,
      runnerConcurrency: 2,
      createdAt: now,
      updatedAt: now,
      conversations: [], // empty: "No conversations yet"
    };

    this.projects.set(codexsun.id, codexsun);
    this.projects.set(workspace.id, workspace);
  }

  private findProject(id: string): Project {
    const project = this.projects.get(id);
    if (!project) throw new Error(`Project '${id}' not found.`);
    return project;
  }

  listProjects(): Project[] {
    return Array.from(this.projects.values()).map((p) => ({
      ...p,
      conversations: [...p.conversations],
    }));
  }

  getProject(id: string): Project {
    const project = this.findProject(id);
    return { ...project, conversations: [...project.conversations] };
  }

  createProject(input: CreateProjectInput): Project {
    const id = input.name.toLowerCase().replace(/[^a-z0-9_-]/gu, "-") || randomUUID().slice(0, 8);
    if (this.projects.has(id)) {
      throw new Error(`Project with name '${input.name}' already exists.`);
    }

    const now = new Date().toISOString();
    const isWorktree = Boolean(input.isWorktree || input.isolatedWorktreePath);
    const branch = input.worktreeBranch || (isWorktree ? `isolated/${id}` : "main");
    const rootPath = input.isolatedWorktreePath
      ? resolve(this.defaultRoot, input.isolatedWorktreePath)
      : isWorktree
        ? resolve(this.defaultRoot, `.worktrees/${id}`)
        : this.defaultRoot;

    const project: Project = {
      id,
      name: input.name,
      rootPath,
      worktreeBranch: branch,
      isWorktree,
      worktreeStatus: isWorktree ? "isolated" : "active",
      defaultModel: input.defaultModel ?? "Gemini 3.8 Flash (Medium)",
      verificationRigor: input.verificationRigor ?? "full",
      autoRollback: input.autoRollback ?? true,
      runnerConcurrency: input.runnerConcurrency ?? 2,
      conversations: [],
      createdAt: now,
      updatedAt: now,
    };

    this.projects.set(id, project);
    return { ...project, conversations: [] };
  }

  updateProject(id: string, input: UpdateProjectInput): Project {
    const project = this.findProject(id);
    if (input.name) project.name = input.name;
    if (input.worktreeBranch) project.worktreeBranch = input.worktreeBranch;
    if (input.isWorktree !== undefined) project.isWorktree = input.isWorktree;
    if (input.defaultModel !== undefined) project.defaultModel = input.defaultModel;
    if (input.verificationRigor !== undefined) project.verificationRigor = input.verificationRigor;
    if (input.autoRollback !== undefined) project.autoRollback = input.autoRollback;
    if (input.runnerConcurrency !== undefined) project.runnerConcurrency = input.runnerConcurrency;
    project.updatedAt = new Date().toISOString();
    return { ...project, conversations: [...project.conversations] };
  }

  listConversations(projectId: string): Conversation[] {
    const project = this.findProject(projectId);
    return [...project.conversations];
  }

  createConversation(projectId: string, input: CreateConversationInput): Conversation {
    const project = this.findProject(projectId);
    const now = new Date().toISOString();

    // Deactivate previous active conversations in this project if any
    for (const c of project.conversations) {
      c.active = false;
    }

    const conversation: Conversation = {
      id: randomUUID(),
      projectId,
      title: input.title,
      relativeTime: "now",
      active: true,
      messagesCount: 1,
      summary: input.summary,
      activeTaskId: input.activeTaskId,
      createdAt: now,
      updatedAt: now,
    };

    project.conversations.unshift(conversation);
    project.updatedAt = now;
    return conversation;
  }

  setActiveConversation(projectId: string, conversationId: string): Conversation {
    const project = this.findProject(projectId);
    let target: Conversation | undefined;

    for (const c of project.conversations) {
      if (c.id === conversationId) {
        c.active = true;
        target = c;
      } else {
        c.active = false;
      }
    }

    if (!target) {
      throw new Error(`Conversation '${conversationId}' not found in project '${projectId}'.`);
    }

    project.updatedAt = new Date().toISOString();
    return target;
  }

  deleteConversation(projectId: string, conversationId: string): boolean {
    const project = this.findProject(projectId);
    const index = project.conversations.findIndex((c) => c.id === conversationId);
    if (index === -1) return false;

    project.conversations.splice(index, 1);
    if (project.conversations.length > 0 && !project.conversations.some((c) => c.active)) {
      project.conversations[0].active = true;
    }
    project.updatedAt = new Date().toISOString();
    return true;
  }

  getProjectWorktreePath(projectId: string): string {
    const project = this.findProject(projectId);
    return project.rootPath;
  }
}
