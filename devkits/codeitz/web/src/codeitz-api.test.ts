import assert from "node:assert/strict";
import test from "node:test";
import {
  createSweTask,
  enqueueTask,
  fetchCodeitzHealth,
  fetchHeuristics,
  fetchQueueState,
  fetchSkills,
  fetchSweTasks,
  stepRunner,
} from "./codeitz-api.js";

test("fetchCodeitzHealth calls health endpoint", async () => {
  const mockFetch: typeof fetch = async (input) => {
    assert.equal(String(input), "/api/v1/codeitz/health");
    return new Response(JSON.stringify({ status: "ok", providers: ["codeitz.foundation"] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const result = await fetchCodeitzHealth(mockFetch);
  assert.equal(result.status, "ok");
  assert.deepEqual(result.providers, ["codeitz.foundation"]);
});

test("fetchSweTasks and createSweTask call SWE routes", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    if (init?.method === "POST") {
      assert.equal(String(input), "/api/v1/codeitz/swe/tasks");
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          id: "123",
          title: body.title,
          prompt: body.prompt,
          phase: "intake",
          status: "queued",
          targetPaths: body.targetPaths ?? [],
          createdAt: new Date().toISOString(),
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    assert.equal(String(input), "/api/v1/codeitz/swe/tasks");
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const list = await fetchSweTasks(mockFetch);
  assert.deepEqual(list, []);

  const created = await createSweTask(
    { title: "Fix auth", prompt: "Fix token verification" },
    mockFetch,
  );
  assert.equal(created.title, "Fix auth");
  assert.equal(created.phase, "intake");
});

test("fetchHeuristics and fetchSkills call learning and skills endpoints", async () => {
  const mockFetch: typeof fetch = async (input) => {
    if (String(input).includes("heuristics")) {
      return new Response(JSON.stringify([{ id: "h1", rule: "rule1" }]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify([{ id: "s1", name: "agentic-swe-pipeline" }]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  const heuristics = await fetchHeuristics(mockFetch);
  assert.equal(heuristics.length, 1);
  assert.equal(heuristics[0].rule, "rule1");

  const skills = await fetchSkills(mockFetch);
  assert.equal(skills.length, 1);
  assert.equal(skills[0].name, "agentic-swe-pipeline");
});

test("fetchQueueState, enqueueTask, and stepRunner call queue routes", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/swe/queue") && (!init || init.method === "GET")) {
      return new Response(
        JSON.stringify({
          queue: [{ id: "q1", taskId: "t1", title: "Task 1", priority: "high", status: "queued", currentPhase: "intake" }],
          runnerState: { status: "idle", activeTaskId: null, autoProgress: true, stepIntervalMs: 1500, processedCount: 0, lastRunAt: null },
          logs: [],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/swe/queue/enqueue")) {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          id: "q2",
          taskId: body.taskId,
          title: "New Task",
          priority: body.priority ?? "medium",
          status: "queued",
          currentPhase: "intake",
          enqueuedAt: new Date().toISOString(),
          autoProgress: true,
          phaseHistory: [],
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/swe/runner/step")) {
      return new Response(
        JSON.stringify({
          success: true,
          action: "advance_to_grounding",
          taskId: "t1",
          taskTitle: "Task 1",
          currentPhase: "grounding",
          message: "Grounded workspace context",
          completed: false,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const queueState = await fetchQueueState(mockFetch);
  assert.equal(queueState.queue.length, 1);
  assert.equal(queueState.queue[0].title, "Task 1");

  const enqueued = await enqueueTask({ taskId: "t2", priority: "critical" }, mockFetch);
  assert.equal(enqueued.id, "q2");
  assert.equal(enqueued.priority, "critical");

  const stepResult = await stepRunner(mockFetch);
  assert.equal(stepResult.success, true);
  assert.equal(stepResult.currentPhase, "grounding");
});

test("fetchCapabilities and checkPromptSpelling call capabilities endpoints", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/capabilities/spellcheck")) {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          original: body.prompt,
          corrected: "refactor authentication",
          hasCorrections: true,
          corrections: [{ originalWord: "authntication", correctedWord: "authentication", offset: 9 }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(
      JSON.stringify([
        {
          id: "web_search",
          name: "Web Search",
          description: "Grounded web search",
          category: "core",
          icon: "globe",
          enabled: true,
        },
      ]),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };

  const { fetchCapabilities, checkPromptSpelling } = await import("./codeitz-api.js");
  const caps = await fetchCapabilities(mockFetch);
  assert.equal(caps.length, 1);
  assert.equal(caps[0].id, "web_search");

  const spell = await checkPromptSpelling("refactor authntication", mockFetch);
  assert.equal(spell.hasCorrections, true);
  assert.equal(spell.corrected, "refactor authentication");
});

test("fetchCodebaseGraph and Git operations call corresponding routes", async () => {
  const mockFetch: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/codebase-graph")) {
      return new Response(
        JSON.stringify({
          nodes: [{ id: "devkits/codeitz", name: "codeitz", type: "devkit", path: "devkits/codeitz", dependencies: [], fileCount: 12, cluster: "Developer Kits" }],
          edges: [],
          summary: { totalNodes: 1, totalEdges: 0, clustersCount: 1, circularDependenciesDetected: false, densityScore: 0 },
          clusters: ["Developer Kits"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/git/status")) {
      return new Response(
        JSON.stringify({
          branch: "main",
          clean: false,
          files: [{ path: "devkits/codeitz/api/server.ts", status: "modified", staged: false }],
          summary: { modified: 1, added: 0, deleted: 0, untracked: 0, total: 1 },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/git/diff")) {
      return new Response(
        JSON.stringify({
          files: [{ filePath: "devkits/codeitz/api/server.ts", additions: 5, deletions: 1, patch: "+ added line" }],
          totalAdditions: 5,
          totalDeletions: 1,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/git/auto-commit")) {
      return new Response(
        JSON.stringify({
          success: true,
          commitHash: "abc1234",
          message: "feat(codeitz): automated test commit",
          filesCommitted: ["devkits/codeitz/api/server.ts"],
          timestamp: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/git/undo")) {
      return new Response(
        JSON.stringify({
          success: true,
          mode: "working_tree",
          undoneFiles: ["devkits/codeitz/api/server.ts"],
          message: "Working tree restored",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const {
    fetchCodebaseGraph,
    fetchGitStatus,
    fetchGitDiff,
    autoCommitGit,
    undoGitChanges,
  } = await import("./codeitz-api.js");

  const graph = await fetchCodebaseGraph(mockFetch);
  assert.equal(graph.nodes.length, 1);
  assert.equal(graph.summary.totalNodes, 1);

  const gitStatus = await fetchGitStatus(mockFetch);
  assert.equal(gitStatus.clean, false);
  assert.equal(gitStatus.files.length, 1);

  const gitDiff = await fetchGitDiff(undefined, mockFetch);
  assert.equal(gitDiff.totalAdditions, 5);

  const commitResult = await autoCommitGit({ message: "feat(codeitz): automated test commit" }, mockFetch);
  assert.equal(commitResult.success, true);
  assert.equal(commitResult.commitHash, "abc1234");

  const undoResult = await undoGitChanges({ mode: "working_tree" }, mockFetch);
  assert.equal(undoResult.success, true);
});

test("fetchProjects, createConversation, and stepParallelRunners call correct endpoints", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.endsWith("/swe/projects") && (!init || init.method === "GET")) {
      return new Response(
        JSON.stringify([
          {
            id: "codexsun",
            name: "codexsun",
            rootPath: "E:/codexsun/codexsun",
            worktreeBranch: "main",
            isWorktree: false,
            worktreeStatus: "active",
            conversations: [
              {
                id: "c1",
                projectId: "codexsun",
                title: "Build Agentic Software Eng...",
                relativeTime: "now",
                active: true,
                messagesCount: 14,
              },
            ],
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/conversations") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          id: "c2",
          projectId: "codexsun",
          title: body.title,
          relativeTime: "now",
          active: true,
          messagesCount: 1,
        }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/swe/runner/step-parallel") && init?.method === "POST") {
      return new Response(
        JSON.stringify({
          results: [
            {
              success: true,
              action: "advance_to_grounding",
              runnerId: "worker-1",
              taskId: "t1",
              taskTitle: "Task 1",
              currentPhase: "grounding",
              message: "Grounded",
              completed: false,
            },
          ],
          activeCount: 1,
          maxConcurrency: 2,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const {
    fetchProjects,
    createConversation,
    stepParallelRunners,
  } = await import("./codeitz-api.js");

  const projects = await fetchProjects(mockFetch);
  assert.equal(projects.length, 1);
  assert.equal(projects[0].name, "codexsun");
  assert.equal(projects[0].conversations[0].title, "Build Agentic Software Eng...");

  const conv = await createConversation("codexsun", { title: "New Feature Task" }, mockFetch);
  assert.equal(conv.title, "New Feature Task");
  assert.equal(conv.active, true);

  const parallel = await stepParallelRunners(mockFetch);
  assert.equal(parallel.activeCount, 1);
  assert.equal(parallel.maxConcurrency, 2);
  assert.equal(parallel.results[0].runnerId, "worker-1");
});

test("updateProject sets basic settings on live and new projects, and transcribeVoice transcribes speech", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/swe/projects/codexsun") && init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          id: "codexsun",
          name: "codexsun",
          rootPath: "E:/codexsun/codexsun",
          worktreeBranch: body.worktreeBranch ?? "main",
          isWorktree: false,
          worktreeStatus: "active",
          defaultModel: body.defaultModel ?? "Gemini 3.8 Flash (Medium)",
          verificationRigor: body.verificationRigor ?? "full",
          autoRollback: body.autoRollback ?? true,
          runnerConcurrency: body.runnerConcurrency ?? 2,
          conversations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (url.includes("/swe/projects/new-proj") && init?.method === "PATCH") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          id: "new-proj",
          name: body.name ?? "New Proj",
          rootPath: "E:/codexsun/codexsun/.worktrees/new-proj",
          worktreeBranch: body.worktreeBranch ?? "feat/new",
          isWorktree: true,
          worktreeStatus: "isolated",
          defaultModel: body.defaultModel ?? "Claude 3.5 Sonnet",
          verificationRigor: body.verificationRigor ?? "fast",
          autoRollback: body.autoRollback ?? false,
          runnerConcurrency: body.runnerConcurrency ?? 4,
          conversations: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    if (url.includes("/capabilities/voice-to-text") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({
          transcript: body.simulatedTranscript || "Refactor inventory test suite",
          confidence: 0.98,
          language: "en-US",
          durationSec: 3,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const { updateProject, transcribeVoice } = await import("./codeitz-api.js");

  // 1. Test live project basic settings
  const liveUpdated = await updateProject(
    "codexsun",
    {
      defaultModel: "Claude 3.5 Sonnet",
      verificationRigor: "fast",
      autoRollback: false,
      runnerConcurrency: 4,
    },
    mockFetch,
  );
  assert.equal(liveUpdated.id, "codexsun");
  assert.equal(liveUpdated.defaultModel, "Claude 3.5 Sonnet");
  assert.equal(liveUpdated.verificationRigor, "fast");
  assert.equal(liveUpdated.autoRollback, false);
  assert.equal(liveUpdated.runnerConcurrency, 4);

  // 2. Test new project basic settings
  const newUpdated = await updateProject(
    "new-proj",
    {
      name: "New Proj Renamed",
      worktreeBranch: "feat/new-v2",
      verificationRigor: "fast",
      runnerConcurrency: 4,
    },
    mockFetch,
  );
  assert.equal(newUpdated.id, "new-proj");
  assert.equal(newUpdated.name, "New Proj Renamed");
  assert.equal(newUpdated.worktreeBranch, "feat/new-v2");

  // 3. Test voice-to-text transcription
  const voiceRes = await transcribeVoice(
    { simulatedTranscript: "Refactor inventory test suite" },
    mockFetch,
  );
  assert.equal(voiceRes.transcript, "Refactor inventory test suite");
  assert.equal(voiceRes.confidence, 0.98);
});

test("live capability API clients call corresponding endpoints", async () => {
  const mockFetch: typeof fetch = async (input, _init) => {
    const url = String(input);
    if (url.endsWith("/capabilities/web-search")) {
      return new Response(
        JSON.stringify({
          query: "Fastify",
          totalResults: 1,
          results: [{ title: "Fastify Docs", url: "https://fastify.dev", snippet: "Fast framework", source: "Official" }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/capabilities/computer-use")) {
      return new Response(
        JSON.stringify({
          action: "terminal_exec",
          success: true,
          output: "Branch main. Process finished with exit code 0.",
          sandboxStatus: "Active",
          auditLog: "Authorized",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/capabilities/browser")) {
      return new Response(
        JSON.stringify({
          action: "navigate",
          status: "ok",
          pageTitle: "Codeitz Studio",
          domSnapshot: "<main id=\"app-root\">Ready</main>",
          logs: ["OK"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/capabilities/excel")) {
      return new Response(
        JSON.stringify({
          filename: "sheet.csv",
          rowCount: 10,
          columnCount: 3,
          headers: ["a", "b", "c"],
          summaryMetrics: { totalRows: 10, columns: 3, hasHeaderRow: true, completenessPercent: 100, numericColumnsIdentified: 1 },
          insights: ["Loaded"],
          formulaAudit: ["OK"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.endsWith("/capabilities/pdf")) {
      return new Response(
        JSON.stringify({
          filename: "spec.pdf",
          pageCount: 6,
          sections: [{ title: "Intro", content: "Spec" }],
          extractedRequirements: ["REQ-01"],
          summary: "Summary",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const {
    performWebSearchApi,
    performComputerUseApi,
    runBrowserAutomationApi,
    analyzeExcelApi,
    analyzePdfApi,
  } = await import("./codeitz-api.js");

  const webRes = await performWebSearchApi("Fastify", 1, mockFetch);
  assert.equal(webRes.query, "Fastify");
  assert.equal(webRes.results.length, 1);

  const compRes = await performComputerUseApi("terminal_exec", "git status", mockFetch);
  assert.equal(compRes.success, true);
  assert.ok(compRes.output.includes("Process finished"));

  const browserRes = await runBrowserAutomationApi("navigate", "http://localhost:6321", mockFetch);
  assert.equal(browserRes.status, "ok");

  const xlRes = await analyzeExcelApi("sheet.csv", "a,b,c\n1,2,3", mockFetch);
  assert.equal(xlRes.rowCount, 10);

  const pdfRes = await analyzePdfApi("spec.pdf", mockFetch);
  assert.equal(pdfRes.pageCount, 6);
});

test("redactSensitiveData masks secrets, bearer tokens, and credentials", async () => {
  const { redactSensitiveData } = await import("./codeitz-api.js");
  const rawText = "Connecting with Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 and ghp_abcdefghijklmnopqrstuvwxyz1234567890 with api_key: secret-1234567890";
  const redacted = redactSensitiveData(rawText);
  assert.ok(!redacted.includes("eyJhbGci"));
  assert.ok(!redacted.includes("ghp_"));
  assert.ok(!redacted.includes("secret-1234567890"));
  assert.ok(redacted.includes("[REDACTED]"));
  assert.ok(redacted.includes("[REDACTED_GITHUB_TOKEN]"));
});

test("mergeWorktreeApi and connectSweEventStream manage worktrees and live event updates", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/git/merge-worktree")) {
      const body = JSON.parse(String(init?.body));
      return new Response(
        JSON.stringify({
          success: true,
          mergedCommitHash: "abc1234",
          sourceBranch: body.sourceBranch,
          targetBranch: body.targetBranch || "main",
          message: `Successfully merged ${body.sourceBranch}`,
          filesChanged: ["package.json"],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const { mergeWorktreeApi, connectSweEventStream } = await import("./codeitz-api.js");
  const mergeRes = await mergeWorktreeApi(
    { sourceBranch: "feat/isolated-worktree", targetBranch: "main" },
    mockFetch,
  );
  assert.equal(mergeRes.success, true);
  assert.equal(mergeRes.mergedCommitHash, "abc1234");
  assert.equal(mergeRes.sourceBranch, "feat/isolated-worktree");

  // Test event source subscription
  class MockEventSource {
    private handlers: Record<string, ((e: any) => void)[]> = {};
    constructor(public url: string) {}
    addEventListener(type: string, handler: (e: any) => void) {
      if (!this.handlers[type]) this.handlers[type] = [];
      this.handlers[type].push(handler);
    }
    close() {}
    emit(type: string, data: any) {
      if (this.handlers[type]) {
        for (const h of this.handlers[type]) h({ data: JSON.stringify(data) });
      }
    }
  }

  let capturedEvent: { type: string; data: any } | null = null;
  const disconnect = connectSweEventStream((type, data) => {
    capturedEvent = { type, data };
  }, MockEventSource as any);

  assert.equal(typeof disconnect, "function");
  disconnect();
});

test("Memory Bank and Skill Organiser APIs interact with corresponding backend routes", async () => {
  const mockFetch: typeof fetch = async (input, init) => {
    const url = String(input);
    if (url.includes("/api/v1/codeitz/memory?projectId=global")) {
      return new Response(
        JSON.stringify({
          projectId: "global",
          productContext: "# Product Context",
          activeContext: "# Active Context",
          systemPatterns: "# System Patterns",
          techContext: "# Tech Context",
          progress: "# Progress",
          entries: [{ id: "m1", projectId: "global", category: "product", key: "mission", content: "Reliable SWE", tags: ["core"], importance: 9, source: "system", createdAt: "", updatedAt: "" }],
          stats: { totalEntries: 1, sectionsCount: 5, sqliteConnected: true },
          lastSyncAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/api/v1/codeitz/memory/sections") && init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      return new Response(
        JSON.stringify({ section: body.section, title: "Active Context", markdown: body.content }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/api/v1/codeitz/skills/library")) {
      return new Response(
        JSON.stringify({
          totalCount: 1,
          categories: [{ name: "swe", count: 1 }],
          skills: [{
            id: "s1",
            name: "agentic-swe-pipeline",
            description: "Autonomous SWE loop",
            category: "swe",
            domain: "software-engineering",
            tags: ["swe"],
            sourcePath: ".agents/skills/agentic-swe-pipeline/SKILL.md",
            workflow: ["Intake"],
            verificationCriteria: ["Check"],
            guardrails: [],
            exclusions: [],
            markdown: "# Agentic SWE",
            scripts: [],
            references: [],
            valid: true,
            validationErrors: [],
            rating: 10,
            usageCount: 0,
            updatedAt: "",
          }],
          lastScannedAt: new Date().toISOString(),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    if (url.includes("/api/v1/codeitz/skills/recommend") && init?.method === "POST") {
      return new Response(
        JSON.stringify([{
          skill: { name: "agentic-swe-pipeline", category: "swe" },
          score: 0.95,
          reason: "Matches prompt intent",
          matchedKeywords: ["swe"],
        }]),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }
    return new Response(JSON.stringify({}), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  const {
    fetchMemoryBank,
    updateMemorySectionApi,
    fetchSkillsLibraryApi,
    recommendSkillsApi,
  } = await import("./codeitz-api.js");

  const memoryBank = await fetchMemoryBank("global", mockFetch);
  assert.equal(memoryBank.projectId, "global");
  assert.equal(memoryBank.entries.length, 1);
  assert.ok(memoryBank.productContext.includes("# Product Context"));

  const updatedSec = await updateMemorySectionApi("activeContext", "# New Active Context", "global", mockFetch);
  assert.equal(updatedSec.section, "activeContext");
  assert.equal(updatedSec.markdown, "# New Active Context");

  const library = await fetchSkillsLibraryApi(undefined, mockFetch);
  assert.equal(library.totalCount, 1);
  assert.equal(library.categories[0].name, "swe");

  const recs = await recommendSkillsApi("agentic swe pipeline", 2, mockFetch);
  assert.equal(recs.length, 1);
  assert.equal(recs[0].skill.name, "agentic-swe-pipeline");
  assert.equal(recs[0].score, 0.95);
});





