import { ApplicationError } from "../../../framework/src/runtime/errors/application-error.js";
import { defineInternalRoute } from "../../../framework/src/runtime/http/index.js";
import type { HttpRouteDefinition } from "../../../framework/src/runtime/http/index.js";
import {
  appendZetroRunEvent,
  createZetroFinding,
  createZetroRun,
  createZetroRunOutputSection,
  createZetroCommandProposal,
  createZetroAllowlistEntry,
  createZetroBlockedCommand,
  executeAndApprove,
  executeApprovedCommand,
  getZetroDashboardSummary,
  getZetroPlaybook,
  getZetroRunWithDetails,
  getZetroRunnerPolicy,
  listZetroFindings,
  listZetroGuardrails,
  listZetroAllowlistEntries,
  listZetroBlockedCommands,
  listZetroExecutedCommands,
  listZetroPlaybooks,
  listZetroRuns,
  readZetroSettings,
  replaceZetroRunOutputSections,
  updateZetroFindingStatus,
  updateZetroCommandProposalStatus,
  buildZetroModelSettings,
  checkProviderHealth,
  listSupportedProviders,
  ZETRO_REVIEW_LANES,
  extractReviewFindingsFromContent,
  buildReviewSummary,
  getZetroLoopState,
  createZetroLoopState,
  startZetroLoop,
  cancelZetroLoop,
  completeZetroLoop,
  failZetroLoop,
  timeoutZetroLoop,
  incrementZetroLoopIteration,
  logZetroIterationEvent,
  listZetroIterationEvents,
  checkStopConditions,
  normalizeLoopConfiguration,
  DEFAULT_LOOP_CONFIGURATION,
  storeMemoryVector,
  searchMemory,
  findSimilarFindings,
  listMemoryVectors,
  getMemoryStats,
  deleteMemoryVector,
  clearMemoryVectors,
  DEFAULT_MEMORY_CONFIG,
  createTaskRouter,
  classifyTask,
  routeToModel,
  getFallbackModel,
  DEFAULT_TASK_ROUTING_CONFIG,
  ZETRO_TASK_TYPE_SUMMARY,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhook,
  listWebhooks,
  triggerWebhook,
  listWebhookDeliveries,
  retryWebhookDelivery,
  exportRun,
  dispatchEventToWebhooks,
  createGitHubIssue,
  linkRunToPR,
  postRunSummaryToPR,
  sendSlackAlert,
  type ZetroCreateRunEventInput,
  type ZetroCreateFindingInput,
  type ZetroCreateRunInput,
  type ZetroCreateOutputSectionInput,
  type ZetroCreateCommandProposalInput,
  type ZetroUpdateCommandProposalStatusInput,
  type ZetroFindingStatus,
  type ZetroCreateAllowlistEntryInput,
  type ZetroCreateBlockedCommandInput,
  type ZetroExecuteCommandInput,
  type ZetroModelProviderId,
  type ZetroProviderConfig,
  type ZetroReviewFindingInput,
  type ZetroCreateLoopConfigurationInput,
  type ZetroCreateMemoryVectorInput,
  type ZetroMemoryVector,
  type ZetroMemorySearchResult,
  type ZetroTaskType,
  type ZetroTaskRoutingConfig,
  type ZetroCreateWebhookInput,
  type ZetroUpdateWebhookInput,
  type ZetroWebhookEvent,
  type ZetroWebhookProvider,
  type ZetroWebhookPayload,
  type ZetroGitHubConfig,
  type ZetroGitHubIssue,
  type ZetroSlackConfig,
} from "../../../zetro/src/services/index.js";

import { jsonResponse } from "../shared/http-responses.js";
import { requireAuthenticatedUser } from "../shared/session.js";

function requireQueryId(
  context: Parameters<HttpRouteDefinition["handler"]>[0],
  label: string,
) {
  const id = context.request.url.searchParams.get("id")?.trim();

  if (!id) {
    throw new ApplicationError(`${label} id is required.`, {}, 400);
  }

  return id;
}

function requireJsonObject(
  context: Parameters<HttpRouteDefinition["handler"]>[0],
) {
  const body = context.request.jsonBody;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApplicationError(
      "JSON object request body is required.",
      {},
      400,
    );
  }

  return body as Record<string, unknown>;
}

export function createZetroInternalRoutes(): HttpRouteDefinition[] {
  return [
    defineInternalRoute("/zetro/summary", {
      summary: "Read the persisted Zetro dashboard summary.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(
          await getZetroDashboardSummary(context.databases.primary),
        );
      },
    }),
    defineInternalRoute("/zetro/playbooks", {
      summary: "List persisted Zetro playbooks with phases.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: await listZetroPlaybooks(context.databases.primary),
        });
      },
    }),
    defineInternalRoute("/zetro/playbook", {
      summary: "Read one persisted Zetro playbook by id.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const playbookId = requireQueryId(context, "Zetro playbook");
        const playbook = await getZetroPlaybook(
          context.databases.primary,
          playbookId,
        );

        if (!playbook) {
          throw new ApplicationError(
            "Zetro playbook could not be found.",
            { playbookId },
            404,
          );
        }

        return jsonResponse(playbook);
      },
    }),
    defineInternalRoute("/zetro/runs", {
      summary: "List persisted Zetro runs.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: await listZetroRuns(context.databases.primary),
        });
      },
    }),
    defineInternalRoute("/zetro/run", {
      summary: "Read one persisted Zetro run with events and findings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");
        const run = await getZetroRunWithDetails(
          context.databases.primary,
          runId,
        );

        if (!run) {
          throw new ApplicationError(
            "Zetro run could not be found.",
            { runId },
            404,
          );
        }

        return jsonResponse(run);
      },
    }),
    defineInternalRoute("/zetro/runs", {
      method: "POST",
      summary: "Create a manual Zetro run without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(
          await createZetroRun(
            context.databases.primary,
            requireJsonObject(context) as ZetroCreateRunInput,
          ),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/run/events", {
      method: "POST",
      summary:
        "Append a manual event to a Zetro run without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        return jsonResponse(
          await appendZetroRunEvent(
            context.databases.primary,
            runId,
            requireJsonObject(context) as ZetroCreateRunEventInput,
          ),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/findings", {
      summary: "List persisted Zetro findings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId =
          context.request.url.searchParams.get("runId") ?? undefined;
        const status =
          (context.request.url.searchParams.get(
            "status",
          ) as ZetroFindingStatus | null) ?? undefined;

        return jsonResponse({
          items: await listZetroFindings(context.databases.primary, {
            runId,
            status,
          }),
        });
      },
    }),
    defineInternalRoute("/zetro/findings", {
      method: "POST",
      summary: "Create a manual Zetro finding without executing commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(
          await createZetroFinding(
            context.databases.primary,
            requireJsonObject(context) as ZetroCreateFindingInput,
          ),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/finding", {
      method: "PATCH",
      summary: "Update one persisted Zetro finding status.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const findingId = requireQueryId(context, "Zetro finding");
        const status = requireJsonObject(context).status as
          | ZetroFindingStatus
          | undefined;

        if (!status) {
          throw new ApplicationError(
            "Zetro finding status is required.",
            {},
            400,
          );
        }

        return jsonResponse(
          await updateZetroFindingStatus(
            context.databases.primary,
            findingId,
            status,
          ),
        );
      },
    }),
    defineInternalRoute("/zetro/guardrails", {
      summary: "List persisted Zetro guardrails.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: await listZetroGuardrails(context.databases.primary),
        });
      },
    }),
    defineInternalRoute("/zetro/settings", {
      summary: "Read persisted Zetro runtime and output-mode settings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(await readZetroSettings(context.databases.primary));
      },
    }),
    defineInternalRoute("/zetro/run/output-sections", {
      summary: "Create a manual output section for a Zetro run.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(
          context,
        ) as ZetroCreateOutputSectionInput;

        return jsonResponse(
          await createZetroRunOutputSection(context.databases.primary, body),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/run/output-sections", {
      summary: "Replace all output sections for a Zetro run.",
      method: "PUT",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          runId: string;
          sections: Array<{ section: string; content: string }>;
        };

        return jsonResponse(
          await replaceZetroRunOutputSections(
            context.databases.primary,
            body.runId,
            body.sections,
          ),
        );
      },
    }),
    defineInternalRoute("/zetro/run/command-proposals", {
      summary: "Create a command proposal for a Zetro run.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(
          context,
        ) as ZetroCreateCommandProposalInput;

        return jsonResponse(
          await createZetroCommandProposal(context.databases.primary, body),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/command-proposal", {
      summary: "Update command proposal status (approve or reject).",
      method: "PATCH",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const proposalId = requireQueryId(context, "Zetro command proposal");
        const body = requireJsonObject(
          context,
        ) as ZetroUpdateCommandProposalStatusInput;

        return jsonResponse(
          await updateZetroCommandProposalStatus(
            context.databases.primary,
            proposalId,
            body,
          ),
        );
      },
    }),
    defineInternalRoute("/zetro/allowlist", {
      summary: "List allowed commands in the allowlist.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: await listZetroAllowlistEntries(context.databases.primary),
        });
      },
    }),
    defineInternalRoute("/zetro/allowlist/entry", {
      summary: "Add a command to the allowlist.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(
          context,
        ) as ZetroCreateAllowlistEntryInput;

        return jsonResponse(
          await createZetroAllowlistEntry(context.databases.primary, body),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/allowlist/blocked", {
      summary: "List blocked command patterns.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: await listZetroBlockedCommands(context.databases.primary),
        });
      },
    }),
    defineInternalRoute("/zetro/allowlist/blocked", {
      summary: "Add a blocked command pattern.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(
          context,
        ) as ZetroCreateBlockedCommandInput;

        return jsonResponse(
          await createZetroBlockedCommand(context.databases.primary, body),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/policy", {
      summary: "Read the current runner policy settings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(
          await getZetroRunnerPolicy(context.databases.primary),
        );
      },
    }),
    defineInternalRoute("/zetro/execute", {
      summary: "Execute an approved command or run a command directly.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as ZetroExecuteCommandInput;

        if (!body.command || !body.runId) {
          throw new ApplicationError(
            "Zetro execution command and runId are required.",
            {},
            400,
          );
        }

        return jsonResponse(
          await executeApprovedCommand(context.databases.primary, body),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/execute/proposal", {
      summary: "Approve a proposal and execute it immediately.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as { proposalId: string };
        const proposalId = body.proposalId?.trim();

        if (!proposalId) {
          throw new ApplicationError("Zetro proposalId is required.", {}, 400);
        }

        return jsonResponse(
          await executeAndApprove(context.databases.primary, proposalId),
          201,
        );
      },
    }),
    defineInternalRoute("/zetro/executed", {
      summary: "List executed commands.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId =
          context.request.url.searchParams.get("runId") ?? undefined;

        return jsonResponse({
          items: await listZetroExecutedCommands(context.databases.primary, {
            runId,
          }),
        });
      },
    }),
    defineInternalRoute("/zetro/providers", {
      summary: "List supported model providers.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: listSupportedProviders(),
        });
      },
    }),
    defineInternalRoute("/zetro/provider/settings", {
      summary: "Read current model provider settings.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse(buildZetroModelSettings());
      },
    }),
    defineInternalRoute("/zetro/provider/health", {
      summary: "Check model provider health.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const providerId = (context.request.url.searchParams
          .get("providerId")
          ?.trim() ?? "none") as ZetroModelProviderId;
        const settings = buildZetroModelSettings();
        const config = settings.providerConfigs[providerId] ?? {
          providerId,
          enabled: false,
        };

        return jsonResponse(await checkProviderHealth(providerId, config));
      },
    }),
    defineInternalRoute("/zetro/review/lanes", {
      summary: "List available review lanes with metadata.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        return jsonResponse({
          items: ZETRO_REVIEW_LANES,
        });
      },
    }),
    defineInternalRoute("/zetro/review/parse", {
      summary:
        "Parse model output content and extract structured review findings.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          content: string;
          runId?: string;
          sessionId?: string;
        };

        if (!body.content || typeof body.content !== "string") {
          throw new ApplicationError("Review content is required.", {}, 400);
        }

        const findings = extractReviewFindingsFromContent(body.content, {
          runId: body.runId,
          sessionId: body.sessionId,
        });

        return jsonResponse({ items: findings }, 201);
      },
    }),
    defineInternalRoute("/zetro/review/summarize", {
      summary: "Build a review summary from a list of findings.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          findings: Array<{
            laneId: string;
            severity: string;
            status: string;
          }>;
        };

        if (!body.findings || !Array.isArray(body.findings)) {
          throw new ApplicationError("Findings array is required.", {}, 400);
        }

        const summary = buildReviewSummary(
          body.findings as Parameters<typeof buildReviewSummary>[0],
        );

        return jsonResponse(summary);
      },
    }),
    defineInternalRoute("/zetro/loop/state", {
      summary: "Read the loop state for a run.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const state = await getZetroLoopState(context.databases.primary, runId);

        if (!state) {
          return jsonResponse({
            exists: false,
            defaultConfiguration: DEFAULT_LOOP_CONFIGURATION,
          });
        }

        return jsonResponse({
          exists: true,
          state,
        });
      },
    }),
    defineInternalRoute("/zetro/loop/configure", {
      summary: "Configure loop settings for a run.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");
        const body = requireJsonObject(
          context,
        ) as ZetroCreateLoopConfigurationInput;

        const state = await createZetroLoopState(
          context.databases.primary,
          runId,
          body,
        );

        return jsonResponse(state, 201);
      },
    }),
    defineInternalRoute("/zetro/loop/start", {
      summary: "Start a loop for a run.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const state = await startZetroLoop(context.databases.primary, runId);

        await logZetroIterationEvent(context.databases.primary, runId, {
          iteration: state.currentIteration,
          kind: "loop-started",
          summary: `Loop started at iteration ${state.currentIteration}`,
          detail: `Configuration: maxIterations=${state.configuration.maxIterations}, timeoutMs=${state.configuration.timeoutMs}`,
        });

        return jsonResponse(state);
      },
    }),
    defineInternalRoute("/zetro/loop/cancel", {
      summary: "Cancel a running loop.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const state = await cancelZetroLoop(context.databases.primary, runId);

        await logZetroIterationEvent(context.databases.primary, runId, {
          iteration: state.currentIteration,
          kind: "loop-cancelled",
          summary: "Loop cancelled by operator",
        });

        return jsonResponse(state);
      },
    }),
    defineInternalRoute("/zetro/loop/stop", {
      summary: "Stop (complete) a running loop.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const state = await completeZetroLoop(context.databases.primary, runId);

        await logZetroIterationEvent(context.databases.primary, runId, {
          iteration: state.currentIteration,
          kind: "loop-completed",
          summary: `Loop completed after ${state.currentIteration} iterations`,
        });

        return jsonResponse(state);
      },
    }),
    defineInternalRoute("/zetro/loop/iteration", {
      summary: "Advance to next iteration.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const state = await incrementZetroLoopIteration(
          context.databases.primary,
          runId,
        );

        await logZetroIterationEvent(context.databases.primary, runId, {
          iteration: state.currentIteration,
          kind: "iteration-start",
          summary: `Iteration ${state.currentIteration} started`,
        });

        return jsonResponse(state);
      },
    }),
    defineInternalRoute("/zetro/loop/events", {
      summary: "List iteration events for a run.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = requireQueryId(context, "Zetro run");

        const events = await listZetroIterationEvents(
          context.databases.primary,
          runId,
        );

        return jsonResponse({ items: events });
      },
    }),
    defineInternalRoute("/zetro/memory/search", {
      summary: "Search memory vectors for similar content.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const query = context.request.url.searchParams.get("q")?.trim();
        const limit = context.request.url.searchParams.get("limit");
        const threshold = context.request.url.searchParams.get("threshold");
        const contentType = context.request.url.searchParams.get("contentType");

        if (!query) {
          throw new ApplicationError("Search query is required.", {}, 400);
        }

        const results = await searchMemory(context.databases.primary, query, {
          limit: limit ? Number(limit) : undefined,
          threshold: threshold ? Number(threshold) : undefined,
          contentType: contentType as
            | ZetroMemoryVector["contentType"]
            | undefined,
        });

        return jsonResponse({ items: results });
      },
    }),
    defineInternalRoute("/zetro/memory/similar-findings", {
      summary: "Find similar findings to a given finding.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const findingId = requireQueryId(context, "Finding");
        const title = context.request.url.searchParams.get("title")?.trim();
        const summary = context.request.url.searchParams.get("summary")?.trim();

        if (!title || !summary) {
          throw new ApplicationError(
            "Finding title and summary are required.",
            {},
            400,
          );
        }

        const results = await findSimilarFindings(
          context.databases.primary,
          title,
          summary,
          { excludeFindingId: findingId },
        );

        return jsonResponse({
          items: results,
          query: { findingId, title, summary },
        });
      },
    }),
    defineInternalRoute("/zetro/memory/store", {
      summary: "Store a new memory vector.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as ZetroCreateMemoryVectorInput;

        if (!body.content) {
          throw new ApplicationError("Content is required.", {}, 400);
        }

        if (!body.contentType) {
          throw new ApplicationError("Content type is required.", {}, 400);
        }

        const vector = await storeMemoryVector(context.databases.primary, body);

        return jsonResponse(vector, 201);
      },
    }),
    defineInternalRoute("/zetro/memory/vectors", {
      summary: "List memory vectors.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const contentType = context.request.url.searchParams.get("contentType");
        const runId = context.request.url.searchParams.get("runId");
        const limit = context.request.url.searchParams.get("limit");

        const vectors = await listMemoryVectors(context.databases.primary, {
          contentType: contentType as
            | ZetroMemoryVector["contentType"]
            | undefined,
          runId: runId ?? undefined,
          limit: limit ? Number(limit) : undefined,
        });

        return jsonResponse({ items: vectors });
      },
    }),
    defineInternalRoute("/zetro/memory/stats", {
      summary: "Get memory statistics.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const stats = await getMemoryStats(context.databases.primary);

        return jsonResponse({
          ...stats,
          config: DEFAULT_MEMORY_CONFIG,
        });
      },
    }),
    defineInternalRoute("/zetro/memory/vector/:id", {
      summary: "Delete a memory vector.",
      method: "DELETE",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const id = context.request.url.pathname.split("/").pop();

        if (!id) {
          throw new ApplicationError("Memory vector id is required.", {}, 400);
        }

        await deleteMemoryVector(context.databases.primary, id);

        return jsonResponse({ deleted: true, id });
      },
    }),
    defineInternalRoute("/zetro/memory/clear", {
      summary: "Clear memory vectors by filters.",
      method: "DELETE",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = context.request.url.searchParams.get("runId");
        const contentType = context.request.url.searchParams.get("contentType");

        const count = await clearMemoryVectors(context.databases.primary, {
          runId: runId ?? undefined,
          contentType: contentType as
            | ZetroMemoryVector["contentType"]
            | undefined,
        });

        return jsonResponse({ cleared: count });
      },
    }),
    defineInternalRoute("/zetro/router/info", {
      summary: "Get task router configuration.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const router = createTaskRouter();

        return jsonResponse({
          config: router.getConfig(),
          taskTypeSummaries: ZETRO_TASK_TYPE_SUMMARY,
        });
      },
    }),
    defineInternalRoute("/zetro/router/classify", {
      summary: "Classify a task input to determine routing.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as { input: string };
        const input = body.input?.trim();

        if (!input) {
          throw new ApplicationError("Task input is required.", {}, 400);
        }

        const router = createTaskRouter();
        const classification = router.classify(input);
        const decision = router.route(input);

        return jsonResponse({
          classification,
          routingDecision: decision,
          fallback: router.getFallback(classification.taskType),
        });
      },
    }),
    defineInternalRoute("/zetro/router/route", {
      summary: "Get routing decision for a task type.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          taskType: ZetroTaskType;
          forceFallback?: boolean;
        };
        const taskType = body.taskType;
        const forceFallback = body.forceFallback ?? false;

        const router = createTaskRouter();
        const decision = router.routeByType(taskType, forceFallback);
        const fallback = forceFallback ? null : router.getFallback(taskType);

        return jsonResponse({
          decision,
          fallback,
        });
      },
    }),
    defineInternalRoute("/zetro/webhooks", {
      summary: "List configured webhooks.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const provider = context.request.url.searchParams.get(
          "provider",
        ) as ZetroWebhookProvider | null;
        const enabled = context.request.url.searchParams.get("enabled");
        const event = context.request.url.searchParams.get(
          "event",
        ) as ZetroWebhookEvent | null;

        const webhooks = await listWebhooks(context.databases.primary, {
          provider: provider ?? undefined,
          enabled:
            enabled === "true" ? true : enabled === "false" ? false : undefined,
          event: event ?? undefined,
        });

        return jsonResponse({ items: webhooks });
      },
    }),
    defineInternalRoute("/zetro/webhook", {
      summary: "Create a new webhook.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as ZetroCreateWebhookInput;

        const webhook = await createWebhook(context.databases.primary, body);

        return jsonResponse(webhook, 201);
      },
    }),
    defineInternalRoute("/zetro/webhook", {
      summary: "Update a webhook.",
      method: "PATCH",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const webhookId = requireQueryId(context, "Webhook");
        const body = requireJsonObject(context) as ZetroUpdateWebhookInput;

        const webhook = await updateWebhook(
          context.databases.primary,
          webhookId,
          body,
        );

        return jsonResponse(webhook);
      },
    }),
    defineInternalRoute("/zetro/webhook", {
      summary: "Delete a webhook.",
      method: "DELETE",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const webhookId = requireQueryId(context, "Webhook");

        await deleteWebhook(context.databases.primary, webhookId);

        return jsonResponse({ deleted: true, id: webhookId });
      },
    }),
    defineInternalRoute("/zetro/webhook/trigger", {
      summary: "Trigger a webhook delivery.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          webhookId: string;
          event: ZetroWebhookEvent;
          payload: ZetroWebhookPayload;
        };

        if (!body.webhookId || !body.event || !body.payload) {
          throw new ApplicationError(
            "webhookId, event, and payload are required.",
            {},
            400,
          );
        }

        const delivery = await triggerWebhook(context.databases.primary, body);

        return jsonResponse(delivery, 201);
      },
    }),
    defineInternalRoute("/zetro/webhook/deliveries", {
      summary: "List webhook delivery history.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const webhookId =
          context.request.url.searchParams.get("webhookId") ?? undefined;
        const status =
          context.request.url.searchParams.get("status") ?? undefined;
        const limit = context.request.url.searchParams.get("limit");

        const deliveries = await listWebhookDeliveries(
          context.databases.primary,
          {
            webhookId,
            status: status as "pending" | "delivered" | "failed" | undefined,
            limit: limit ? Number(limit) : undefined,
          },
        );

        return jsonResponse({ items: deliveries });
      },
    }),
    defineInternalRoute("/zetro/webhook/delivery/retry", {
      summary: "Retry a failed webhook delivery.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as { deliveryId: string };
        const deliveryId = body.deliveryId?.trim();

        if (!deliveryId) {
          throw new ApplicationError("deliveryId is required.", {}, 400);
        }

        const delivery = await retryWebhookDelivery(
          context.databases.primary,
          deliveryId,
        );

        return jsonResponse(delivery);
      },
    }),
    defineInternalRoute("/zetro/run/:id/export", {
      summary: "Export a run with all details as JSON.",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const runId = context.request.url.pathname.split("/").pop();

        if (!runId) {
          throw new ApplicationError("Run id is required.", {}, 400);
        }

        const exportData = await exportRun(context.databases.primary, runId);

        return jsonResponse(exportData);
      },
    }),
    defineInternalRoute("/zetro/github/issue", {
      summary: "Create a GitHub issue from a run.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          config: ZetroGitHubConfig;
          issue: ZetroGitHubIssue;
        };

        if (!body.config || !body.issue) {
          throw new ApplicationError(
            "GitHub config and issue are required.",
            {},
            400,
          );
        }

        const result = await createGitHubIssue(body.config, body.issue);

        return jsonResponse(result, 201);
      },
    }),
    defineInternalRoute("/zetro/github/link-pr", {
      summary: "Link a run to a GitHub PR with a comment.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          config: ZetroGitHubConfig;
          runId: string;
          prNumber: number;
          comment: string;
        };

        if (!body.config || !body.runId || !body.prNumber) {
          throw new ApplicationError(
            "GitHub config, runId, and prNumber are required.",
            {},
            400,
          );
        }

        const result = await linkRunToPR(
          body.config,
          body.runId,
          body.prNumber,
          body.comment ?? "",
        );

        return jsonResponse(result, 201);
      },
    }),
    defineInternalRoute("/zetro/github/post-summary", {
      summary: "Post a run summary as a comment on a GitHub PR.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          config: ZetroGitHubConfig;
          runId: string;
          prNumber: number;
        };

        if (!body.config || !body.runId || !body.prNumber) {
          throw new ApplicationError(
            "GitHub config, runId, and prNumber are required.",
            {},
            400,
          );
        }

        const result = await postRunSummaryToPR(
          body.config,
          context.databases.primary,
          body.runId,
          body.prNumber,
        );

        return jsonResponse(result, 201);
      },
    }),
    defineInternalRoute("/zetro/slack/alert", {
      summary: "Send a Slack alert notification.",
      method: "POST",
      handler: async (context) => {
        await requireAuthenticatedUser(context, {
          allowedActorTypes: ["admin", "staff"],
        });

        const body = requireJsonObject(context) as {
          config: ZetroSlackConfig;
          alert: {
            title: string;
            message: string;
            severity: "info" | "warning" | "error" | "critical";
            fields?: Array<{ title: string; value: string; short?: boolean }>;
          };
        };

        if (!body.config || !body.alert) {
          throw new ApplicationError(
            "Slack config and alert are required.",
            {},
            400,
          );
        }

        const result = await sendSlackAlert(body.config, body.alert);

        return jsonResponse(result, 201);
      },
    }),
  ];
}
