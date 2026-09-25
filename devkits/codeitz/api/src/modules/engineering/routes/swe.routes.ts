import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  advancePhaseInputSchema,
  applyPatchInputSchema,
  applyPatchResultSchema,
  autoCommitInputSchema,
  autoCommitResultSchema,
  codebaseGraphResultSchema,
  configureRunnerInputSchema,
  conversationSchema,
  createConversationInputSchema,
  createProjectInputSchema,
  createSweTaskInputSchema,
  enqueueTaskInputSchema,
  gitDiffResultSchema,
  gitStatusResultSchema,
  mergeWorktreeInputSchema,
  mergeWorktreeResultSchema,
  parallelStepResultSchema,
  projectSchema,
  promptEnrichInputSchema,
  promptEnrichResultSchema,
  queueItemSchema,
  runnerLogEntrySchema,
  runnerStateSchema,
  runnerStepResultSchema,
  runVerificationInputSchema,
  stateGraphEdgeSchema,
  stateGraphNodeSchema,
  sweTaskPhaseSchema,
  sweTaskSchema,
  undoChangesInputSchema,
  undoChangesResultSchema,
  updateProjectInputSchema,
} from "../contracts/swe-contracts.js";
import { CodebaseGraphService } from "../service/codebase-graph.service.js";
import { CodePatcherService } from "../service/code-patcher.service.js";
import { GitOpsService } from "../service/git-ops.service.js";
import { ProjectsService } from "../service/projects.service.js";
import { SweOrchestratorService } from "../service/swe-orchestrator.service.js";
import { SweStateGraphService } from "../service/swe-state-graph.service.js";
import { SweTaskRunnerService } from "../service/swe-task-runner.service.js";

export function registerSweRoutes(
  app: FastifyInstance,
  service: SweOrchestratorService,
  runner?: SweTaskRunnerService,
  codebaseGraph?: CodebaseGraphService,
  gitOps?: GitOpsService,
  projects?: ProjectsService,
  patcher?: CodePatcherService,
  stateGraph?: SweStateGraphService,
  prefix: string = "/api/v1/codeitz/swe",
): void {
  const taskRunner = runner ?? new SweTaskRunnerService(service);
  const graphService = codebaseGraph ?? new CodebaseGraphService();
  const gitService = gitOps ?? new GitOpsService();
  const projectsService = projects ?? new ProjectsService();
  const patchService = patcher ?? new CodePatcherService();
  const stateGraphService = stateGraph ?? new SweStateGraphService();
  const server = app.withTypeProvider<ZodTypeProvider>();

  // Task Endpoints
  server.post(
    `${prefix}/tasks`,
    {
      schema: {
        body: createSweTaskInputSchema,
        response: {
          201: sweTaskSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const task = service.createTask(request.body);
      return reply.code(201).send(task);
    },
  );

  server.get(
    `${prefix}/tasks`,
    {
      schema: {
        response: {
          200: z.array(sweTaskSchema),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send(service.listTasks());
    },
  );

  server.get(
    `${prefix}/tasks/:id`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: {
          200: sweTaskSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const task = service.getTask(request.params.id);
        return reply.send(task);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/tasks/:id/advance`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: advancePhaseInputSchema,
        response: {
          200: sweTaskSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const task = service.advancePhase(request.params.id, request.body);
        return reply.send(task);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/tasks/:id/verify`,
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        body: runVerificationInputSchema,
        response: {
          200: z.object({
            task: sweTaskSchema,
            passed: z.boolean(),
          }),
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const result = service.runVerificationGate(request.params.id, request.body);
        return reply.send(result);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  // Queue & Continuous Task Runner Endpoints
  server.get(
    `${prefix}/queue`,
    {
      schema: {
        response: {
          200: z.object({
            queue: z.array(queueItemSchema),
            runnerState: runnerStateSchema,
            logs: z.array(runnerLogEntrySchema),
          }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send({
        queue: taskRunner.getQueue(),
        runnerState: taskRunner.getRunnerState(),
        logs: taskRunner.getLogs(),
      });
    },
  );

  server.post(
    `${prefix}/queue/enqueue`,
    {
      schema: {
        body: enqueueTaskInputSchema,
        response: {
          201: queueItemSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const item = taskRunner.enqueue(request.body);
        return reply.code(201).send(item);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.delete(
    `${prefix}/queue/:taskId`,
    {
      schema: {
        params: z.object({ taskId: z.string().uuid() }),
        response: {
          200: z.object({ success: z.boolean() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const removed = taskRunner.dequeue(request.params.taskId);
      return reply.send({ success: removed });
    },
  );

  server.post(
    `${prefix}/runner/start`,
    {
      schema: {
        body: configureRunnerInputSchema.optional(),
        response: {
          200: runnerStateSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const state = taskRunner.start(request.body);
      return reply.send(state);
    },
  );

  server.post(
    `${prefix}/runner/pause`,
    {
      schema: {
        response: {
          200: runnerStateSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      const state = taskRunner.pause();
      return reply.send(state);
    },
  );

  server.post(
    `${prefix}/runner/step`,
    {
      schema: {
        response: {
          200: runnerStepResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      const result = taskRunner.step();
      return reply.send(result);
    },
  );

  server.post(
    `${prefix}/runner/step-parallel`,
    {
      schema: {
        response: {
          200: parallelStepResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      const results = taskRunner.stepParallel();
      const state = taskRunner.getRunnerState();
      return reply.send({
        results,
        activeCount: state.activeRunners.length,
        maxConcurrency: state.maxConcurrency,
      });
    },
  );

  server.post(
    `${prefix}/runner/continue/:taskId`,
    {
      schema: {
        params: z.object({ taskId: z.string().uuid() }),
        response: {
          200: runnerStepResultSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const result = taskRunner.continueTask(request.params.taskId);
        return reply.send(result);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.get(
    `${prefix}/runner/logs`,
    {
      schema: {
        querystring: z.object({
          limit: z.coerce.number().positive().default(100).optional(),
        }),
        response: {
          200: z.array(runnerLogEntrySchema),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const limit = request.query.limit ?? 100;
      return reply.send(taskRunner.getLogs(limit));
    },
  );

  // Codebase Knowledge Graph
  server.get(
    `${prefix}/codebase-graph`,
    {
      schema: {
        response: {
          200: codebaseGraphResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send(graphService.buildGraph());
    },
  );

  // Git Status & Diff
  server.get(
    `${prefix}/git/status`,
    {
      schema: {
        response: {
          200: gitStatusResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send(gitService.getStatus());
    },
  );

  server.get(
    `${prefix}/git/diff`,
    {
      schema: {
        querystring: z.object({
          file: z.string().optional(),
        }),
        response: {
          200: gitDiffResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      return reply.send(gitService.getDiff(request.query.file));
    },
  );

  // Sensible Auto-Commit
  server.post(
    `${prefix}/git/auto-commit`,
    {
      schema: {
        body: autoCommitInputSchema,
        response: {
          200: autoCommitResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      return reply.send(gitService.autoCommit(request.body));
    },
  );

  // Undo AI Changes
  server.post(
    `${prefix}/git/undo`,
    {
      schema: {
        body: undoChangesInputSchema,
        response: {
          200: undoChangesResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      return reply.send(gitService.undoChanges(request.body));
    },
  );

  // Projects & Isolated Worktrees
  server.get(
    `${prefix}/projects`,
    {
      schema: {
        response: {
          200: z.array(projectSchema),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send(projectsService.listProjects());
    },
  );

  server.post(
    `${prefix}/projects`,
    {
      schema: {
        body: createProjectInputSchema,
        response: {
          201: projectSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const project = projectsService.createProject(request.body);
        return reply.code(201).send(project);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.get(
    `${prefix}/projects/:projectId`,
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        response: {
          200: projectSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const project = projectsService.getProject(request.params.projectId);
        return reply.send(project);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  server.patch(
    `${prefix}/projects/:projectId`,
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        body: updateProjectInputSchema,
        response: {
          200: projectSchema,
          400: z.object({ error: z.string() }),
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const project = projectsService.updateProject(request.params.projectId, request.body);
        return reply.send(project);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.get(
    `${prefix}/projects/:projectId/conversations`,
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        response: {
          200: z.array(conversationSchema),
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const convs = projectsService.listConversations(request.params.projectId);
        return reply.send(convs);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/projects/:projectId/conversations`,
    {
      schema: {
        params: z.object({ projectId: z.string() }),
        body: createConversationInputSchema,
        response: {
          201: conversationSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const conv = projectsService.createConversation(request.params.projectId, request.body);
        return reply.code(201).send(conv);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/projects/:projectId/conversations/:conversationId/activate`,
    {
      schema: {
        params: z.object({ projectId: z.string(), conversationId: z.string() }),
        response: {
          200: conversationSchema,
          404: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const conv = projectsService.setActiveConversation(
          request.params.projectId,
          request.params.conversationId,
        );
        return reply.send(conv);
      } catch (err) {
        return reply.code(404).send({ error: (err as Error).message });
      }
    },
  );

  // Real-time Server-Sent Events (SSE) Stream
  server.get(`${prefix}/stream`, async (request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    reply.raw.write(
      `event: connected\ndata: ${JSON.stringify({ status: "connected", timestamp: new Date().toISOString() })}\n\n`,
    );

    const unsubscribe = taskRunner.subscribe((evt) => {
      reply.raw.write(`event: ${evt.type}\ndata: ${JSON.stringify(evt.payload)}\n\n`);
    });

    request.raw.on("close", () => {
      unsubscribe();
    });

    await new Promise((resolve) => request.raw.on("close", resolve));
  });

  // Git Merge Worktree Route
  server.post(
    `${prefix}/git/merge-worktree`,
    {
      schema: {
        body: mergeWorktreeInputSchema,
        response: {
          200: mergeWorktreeResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const result = gitService.mergeWorktree(request.body);
      return reply.send(result);
    },
  );

  // Autonomous AST / Targeted Code Patcher
  server.post(
    `${prefix}/patch`,
    {
      schema: {
        body: applyPatchInputSchema,
        response: {
          200: applyPatchResultSchema,
          400: z.object({ error: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      try {
        const result = patchService.applyPatch(request.body);
        return reply.send(result);
      } catch (err) {
        return reply.code(400).send({ error: (err as Error).message });
      }
    },
  );

  server.post(
    `${prefix}/patch/rollback`,
    {
      schema: {
        body: z.object({ filePath: z.string().min(1) }),
        response: {
          200: z.object({ success: z.boolean(), filePath: z.string() }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const success = patchService.rollback(request.body.filePath);
      return reply.send({ success, filePath: request.body.filePath });
    },
  );

  // LangGraph-like State Graph & Phased Transitions
  server.get(
    `${prefix}/state-graph`,
    {
      schema: {
        response: {
          200: z.object({
            nodes: z.array(stateGraphNodeSchema),
            edges: z.array(stateGraphEdgeSchema),
          }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (_request, reply) => {
      return reply.send({
        nodes: stateGraphService.getNodes(),
        edges: stateGraphService.getEdges(),
      });
    },
  );

  server.post(
    `${prefix}/state-graph/transition`,
    {
      schema: {
        body: z.object({
          currentPhase: sweTaskPhaseSchema,
          event: z.enum(["success", "failure", "approved"]),
          taskId: z.string(),
        }),
        response: {
          200: z.object({
            nextPhase: sweTaskPhaseSchema,
            cycled: z.boolean(),
            retriesRemaining: z.number(),
          }),
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const { currentPhase, event, taskId } = request.body;
      return reply.send(stateGraphService.determineNextPhase(currentPhase, event, taskId));
    },
  );

  // Smart Prompt Auto-Enricher
  server.post(
    `${prefix}/enrich-prompt`,
    {
      schema: {
        body: promptEnrichInputSchema,
        response: {
          200: promptEnrichResultSchema,
        },
        tags: ["SWE Engineering"],
      },
    },
    async (request, reply) => {
      const raw = request.body.rawPrompt.trim();
      const discoveredFiles: string[] = [];
      const relevantSymbols: string[] = [];

      const lower = raw.toLowerCase();
      if (lower.includes("auth") || lower.includes("login") || lower.includes("session")) {
        relevantSymbols.push("AuthGuard", "SessionToken", "verifySession");
        discoveredFiles.push("packages/platform-core", "packages/ui/src/blocks/auth");
      }
      if (lower.includes("git") || lower.includes("worktree") || lower.includes("branch")) {
        relevantSymbols.push("GitOpsService", "mergeWorktree", "withGitLock");
        discoveredFiles.push("devkits/codeitz/api/src/modules/engineering/service/git-ops.service.ts");
      }
      if (lower.includes("queue") || lower.includes("runner") || lower.includes("parallel")) {
        relevantSymbols.push("SweTaskRunnerService", "stepParallel", "activeRunners");
        discoveredFiles.push("devkits/codeitz/api/src/modules/engineering/service/swe-task-runner.service.ts");
      }
      if (lower.includes("ui") || lower.includes("composer") || lower.includes("prompt") || lower.includes("button")) {
        relevantSymbols.push("MainWorkspace", "SafeWidgetBoundary", "PromptComposer");
        discoveredFiles.push("devkits/codeitz/web/src/app.tsx");
      }

      if (discoveredFiles.length === 0) {
        discoveredFiles.push("devkits/codeitz");
        relevantSymbols.push("CodeitzEngineeringProvider");
      }

      const contextTag = `\n\n[Grounded Context: Target files: ${discoveredFiles.join(", ")}; Relevant symbols: ${relevantSymbols.join(", ")}]`;
      const enrichedPrompt = raw + contextTag;

      return reply.send({
        rawPrompt: raw,
        enrichedPrompt,
        discoveredFiles,
        relevantSymbols,
        confidence: 0.95,
      });
    },
  );
}

