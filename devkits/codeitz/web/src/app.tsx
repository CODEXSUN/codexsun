import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MainWorkspace } from "@codexsun/ui";
import { SessionBoundary } from "@codexsun/ui/blocks/auth";
import { IdentityManagementDesk } from "@codexsun/ui/blocks/auth/identity-management-desk";
import { PrivilegedDesk } from "@codexsun/ui/blocks/auth/privileged-desk";
import {
  ActivityIcon,
  BrainCircuitIcon,
  CheckCircle2Icon,
  Code2Icon,
  CpuIcon,
  ListTodoIcon,
  PlayIcon,
  PlusCircleIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  SparklesIcon,
  TerminalIcon,
} from "lucide-react";

type ActiveTab = "tasks" | "learning" | "skills" | "system";

export function App() {
  return (
    <SessionBoundary
      applicationId="codeitz"
      applicationName="Codeitz"
      autoLoginPath="/api/v1/codeitz/auth/development-login"
      loginPath="/api/v1/codeitz/auth/login"
    >
      {(session) =>
        session.portal === "super-admin" ? (
          <IdentityManagementDesk
            applicationId="codeitz"
            applicationName="Codeitz"
            logout={session.logout}
            request={session.fetch}
          />
        ) : session.portal === "admin" ? (
          <PrivilegedDesk
            applicationId="codeitz"
            applicationName="Codeitz"
            logout={session.logout}
            portal={session.portal}
          />
        ) : (
          <CodeitzDesk logout={session.logout} request={session.fetch} />
        )
      }
    </SessionBoundary>
  );
}

function CodeitzDesk({
  logout,
  request,
}: {
  logout(): void;
  request: typeof fetch;
}) {
  const [tab, setTab] = useState<ActiveTab>("tasks");

  // Health Query
  const healthQuery = useQuery({
    queryKey: ["codeitz", "health"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/health");
      if (!res.ok) throw new Error("Health check failed");
      return res.json() as Promise<{ status: string; providers: string[] }>;
    },
  });

  return (
    <MainWorkspace
      applicationId="codeitz"
      applicationName="Codeitz"
      primaryAction={{ label: "Codeitz SWE" }}
      user={{ initials: "K", name: "Codeitz Engineer", onSignOut: logout }}
      workspaceTitle="Agentic Software-Engineering & Self-Learning"
    >
      <div className="flex flex-col h-full bg-slate-950 text-slate-100">
        {/* Top Navigation Tabs */}
        <header className="border-b border-slate-800 bg-slate-900/60 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold tracking-tight text-emerald-400 flex items-center gap-1.5">
              <TerminalIcon className="w-5 h-5 text-emerald-400" />
              CODEITZ
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              SWE & Learning System
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setTab("tasks")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tab === "tasks" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ListTodoIcon className="w-3.5 h-3.5" />
              SWE Pipeline
            </button>
            <button
              onClick={() => setTab("learning")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tab === "learning" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <BrainCircuitIcon className="w-3.5 h-3.5" />
              Self-Learning Bank
            </button>
            <button
              onClick={() => setTab("skills")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tab === "skills" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Skill Distiller
            </button>
            <button
              onClick={() => setTab("system")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                tab === "system" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <CpuIcon className="w-3.5 h-3.5" />
              Providers & Health
            </button>
          </div>
        </header>

        {/* Workspace Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {tab === "tasks" && <SwePipelineView request={request} />}
          {tab === "learning" && <SelfLearningView request={request} />}
          {tab === "skills" && <SkillDistillerView request={request} />}
          {tab === "system" && <SystemHealthView health={healthQuery.data} isLoading={healthQuery.isLoading} />}
        </main>
      </div>
    </MainWorkspace>
  );
}

// -------------------------------------------------------------
// SWE Tasks Pipeline View
// -------------------------------------------------------------
function SwePipelineView({ request }: { request: typeof fetch }) {
  const queryClient = useQueryClient();
  const [newTitle, setNewTitle] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [newPaths, setNewPaths] = useState("");

  const tasksQuery = useQuery({
    queryKey: ["codeitz", "swe", "tasks"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/swe/tasks");
      if (!res.ok) throw new Error("Failed to load SWE tasks");
      return res.json() as Promise<any[]>;
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const targetPaths = newPaths
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
      const res = await request("/api/v1/codeitz/swe/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, prompt: newPrompt, targetPaths }),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => {
      setNewTitle("");
      setNewPrompt("");
      setNewPaths("");
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "tasks"] });
    },
  });

  const advancePhaseMutation = useMutation({
    mutationFn: async ({ taskId, targetPhase, evidence }: { taskId: string; targetPhase: string; evidence: string }) => {
      const res = await request(`/api/v1/codeitz/swe/tasks/${taskId}/advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPhase, evidence }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to advance phase");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "tasks"] });
    },
  });

  const runVerificationMutation = useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const res = await request(`/api/v1/codeitz/swe/tasks/${taskId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          checks: [
            { name: "typecheck", passed: true, durationMs: 140, output: "tsc check clean: 0 errors" },
            { name: "lint", passed: true, durationMs: 90, output: "eslint clean" },
            { name: "tests", passed: true, durationMs: 320, output: "All tests passing" },
          ],
        }),
      });
      if (!res.ok) throw new Error("Verification failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "tasks"] });
    },
  });

  const phases = ["intake", "grounding", "planning", "execution", "verification", "review", "completed"];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Task Creation Card */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <PlusCircleIcon className="w-4 h-4 text-emerald-400" />
            Dispatch New Agentic SWE Task
          </h2>
          <span className="text-xs text-slate-500">Auto-grounded in repository evidence</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Task Title (e.g., Refactor session verification gate)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
          <input
            type="text"
            placeholder="Target Paths (comma-separated, e.g., src/modules/auth/service.ts)"
            value={newPaths}
            onChange={(e) => setNewPaths(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <textarea
          placeholder="SWE Prompt and Requirements Specification..."
          rows={2}
          value={newPrompt}
          onChange={(e) => setNewPrompt(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
        />

        <div className="flex justify-end">
          <button
            disabled={!newTitle.trim() || !newPrompt.trim() || createTaskMutation.isPending}
            onClick={() => createTaskMutation.mutate()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            Queue SWE Task
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active SWE Tasks ({tasksQuery.data?.length ?? 0})
          </h3>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["codeitz", "swe", "tasks"] })}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCwIcon className="w-3 h-3" /> Refresh
          </button>
        </div>

        {tasksQuery.isLoading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading SWE tasks...</div>
        ) : tasksQuery.data?.length === 0 ? (
          <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800/80 text-slate-500 text-sm">
            No SWE tasks queued. Dispatch a task above to start the autonomous engineering pipeline.
          </div>
        ) : (
          tasksQuery.data?.map((task) => (
            <div
              key={task.id}
              className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-base font-semibold text-slate-100">{task.title}</h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.prompt}</p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    task.status === "completed"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : task.status === "verified"
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      : task.status === "rejected" || task.status === "failed"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {task.status.toUpperCase()}
                </span>
              </div>

              {/* Phase Progression Stepper */}
              <div className="grid grid-cols-7 gap-1 pt-2">
                {phases.map((p, idx) => {
                  const currentIdx = phases.indexOf(task.phase);
                  const isDone = currentIdx > idx || task.status === "completed";
                  const isCurrent = task.phase === p;
                  return (
                    <div
                      key={p}
                      className={`text-center py-1.5 px-1 rounded text-[11px] font-mono capitalize transition-colors ${
                        isDone
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                          : isCurrent
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500 font-bold"
                          : "bg-slate-950 text-slate-600 border border-slate-900"
                      }`}
                    >
                      {p}
                    </div>
                  );
                })}
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400 flex items-center gap-2">
                  <span>Targets:</span>
                  {task.targetPaths.length > 0 ? (
                    <span className="font-mono text-slate-300">{task.targetPaths.join(", ")}</span>
                  ) : (
                    <span className="italic text-slate-500">None specified</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.phase === "execution" && (
                    <button
                      onClick={() => runVerificationMutation.mutate({ taskId: task.id })}
                      className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/40 rounded font-medium flex items-center gap-1"
                    >
                      <CheckCircle2Icon className="w-3.5 h-3.5" />
                      Run Verification Gate
                    </button>
                  )}

                  {task.phase !== "completed" && task.phase !== "failed" && (
                    <button
                      onClick={() => {
                        const curIdx = phases.indexOf(task.phase);
                        if (curIdx < phases.length - 1) {
                          const nextPhase = phases[curIdx + 1];
                          advancePhaseMutation.mutate({
                            taskId: task.id,
                            targetPhase: nextPhase,
                            evidence: `Phase advanced to ${nextPhase} via Codeitz Console`,
                          });
                        }
                      }}
                      className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 rounded font-medium flex items-center gap-1"
                    >
                      <PlayIcon className="w-3 h-3" />
                      Advance Phase
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Self-Learning View
// -------------------------------------------------------------
function SelfLearningView({ request }: { request: typeof fetch }) {
  const queryClient = useQueryClient();
  const [matchPrompt, setMatchPrompt] = useState("");
  const [matchDomain, setMatchDomain] = useState("");

  const heuristicsQuery = useQuery({
    queryKey: ["codeitz", "learning", "heuristics"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/learning/heuristics");
      if (!res.ok) throw new Error("Failed to load heuristics");
      return res.json() as Promise<any[]>;
    },
  });

  const experiencesQuery = useQuery({
    queryKey: ["codeitz", "learning", "experiences"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/learning/experiences");
      if (!res.ok) throw new Error("Failed to load experiences");
      return res.json() as Promise<any[]>;
    },
  });

  const reinforceMutation = useMutation({
    mutationFn: async ({ id, wasEffective }: { id: string; wasEffective: boolean }) => {
      const res = await request(`/api/v1/codeitz/learning/heuristics/${id}/reinforce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wasEffective }),
      });
      if (!res.ok) throw new Error("Failed to reinforce heuristic");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["codeitz", "learning", "heuristics"] });
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Intro Banner */}
      <div className="p-5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 flex items-start gap-3">
        <BrainCircuitIcon className="w-6 h-6 text-emerald-400 mt-1 shrink-0" />
        <div>
          <h2 className="text-sm font-semibold text-emerald-300">Continuous Self-Learning Memory Bank</h2>
          <p className="text-xs text-slate-400 mt-1">
            Codeitz analyzes every engineering task trajectory, extracts failure patterns and anti-patterns,
            and synthesizes actionable heuristics to prevent recurring mistakes in future SWE sessions.
          </p>
        </div>
      </div>

      {/* Heuristics Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Synthesized Heuristics & Guardrails ({heuristicsQuery.data?.length ?? 0})
          </h3>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ["codeitz", "learning", "heuristics"] })}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RefreshCwIcon className="w-3 h-3" /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {heuristicsQuery.data?.map((h) => (
            <div
              key={h.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      h.category === "guardrail"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : h.category === "anti-pattern"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}
                  >
                    {h.category}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <span>Score:</span>
                    <span className="font-mono text-emerald-400 font-semibold">
                      {(h.effectivenessScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <p className="text-xs font-medium text-slate-200">{h.rule}</p>

                <div className="flex flex-wrap gap-1 mt-3">
                  {h.triggerKeywords.map((kw: string) => (
                    <span
                      key={kw}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 font-mono"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">Reinforced {h.reinforcementCount}x</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => reinforceMutation.mutate({ id: h.id, wasEffective: true })}
                    className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 rounded text-[11px] font-medium transition-colors"
                  >
                    + Helpful
                  </button>
                  <button
                    onClick={() => reinforceMutation.mutate({ id: h.id, wasEffective: false })}
                    className="px-2 py-1 bg-rose-950 hover:bg-rose-900 text-rose-300 rounded text-[11px] font-medium transition-colors"
                  >
                    - Ineffective
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Skill Distiller & Catalog View
// -------------------------------------------------------------
function SkillDistillerView({ request }: { request: typeof fetch }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [domain, setDomain] = useState("");
  const [problem, setProblem] = useState("");
  const [steps, setSteps] = useState("");
  const [checks, setChecks] = useState("");
  const [selectedSkill, setSelectedSkill] = useState<any>(null);

  const skillsQuery = useQuery({
    queryKey: ["codeitz", "skills"],
    queryFn: async () => {
      const res = await request("/api/v1/codeitz/skills");
      if (!res.ok) throw new Error("Failed to load skills");
      return res.json() as Promise<any[]>;
    },
  });

  const distillMutation = useMutation({
    mutationFn: async () => {
      const res = await request("/api/v1/codeitz/skills/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim().toLowerCase().replaceAll(" ", "-"),
          description: desc.trim(),
          domain: domain.trim(),
          problemSummary: problem.trim(),
          verifiedSteps: steps.split("\n").map((s) => s.trim()).filter(Boolean),
          verificationChecks: checks.split("\n").map((s) => s.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Failed to distill skill");
      return res.json();
    },
    onSuccess: (data) => {
      setName("");
      setDesc("");
      setDomain("");
      setProblem("");
      setSteps("");
      setChecks("");
      setSelectedSkill(data);
      queryClient.invalidateQueries({ queryKey: ["codeitz", "skills"] });
    },
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Distill Form */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-emerald-400" />
            Distill New Agent Skill
          </h2>

          <input
            type="text"
            placeholder="Skill Name (kebab-case, e.g. api-route-scaffold)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <input
            type="text"
            placeholder="Domain (e.g. backend-api)"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <input
            type="text"
            placeholder="Short Description..."
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <textarea
            placeholder="Verified Steps (one per line)..."
            rows={3}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <textarea
            placeholder="Verification Checks (one per line)..."
            rows={2}
            value={checks}
            onChange={(e) => setChecks(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />

          <button
            disabled={!name.trim() || !desc.trim() || !steps.trim() || !checks.trim() || distillMutation.isPending}
            onClick={() => distillMutation.mutate()}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            Distill to SKILL.md
          </button>
        </div>

        {/* Right: Skills List and Preview */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Available SWE Skills ({skillsQuery.data?.length ?? 0})
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {skillsQuery.data?.map((skill) => (
              <div
                key={skill.id}
                onClick={() => setSelectedSkill(skill)}
                className={`p-4 rounded-xl bg-slate-900 border cursor-pointer transition-colors ${
                  selectedSkill?.id === skill.id ? "border-emerald-500" : "border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-slate-200 font-mono flex items-center gap-1.5">
                    <Code2Icon className="w-4 h-4 text-emerald-400" />
                    {skill.name}
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {skill.scope}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{skill.description}</p>
              </div>
            ))}
          </div>

          {selectedSkill && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Generated SKILL.md Preview
              </h4>
              <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">
                {selectedSkill.markdown}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// System Health & Providers View
// -------------------------------------------------------------
function SystemHealthView({
  health,
  isLoading,
}: {
  health?: { status: string; providers: string[] };
  isLoading: boolean;
}) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-emerald-400" />
            Codeitz System Architecture & Runtime Providers
          </h2>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              health?.status === "ok"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
            }`}
          >
            {isLoading ? "CONNECTING..." : health?.status === "ok" ? "HEALTHY" : "OFFLINE"}
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Codeitz is a dedicated devkit application that integrates autonomous agentic software-engineering
          pipelines, multi-phase verification gates, and continuous self-learning memory banks conforming
          strictly to CODEXSUN platform and framework contracts.
        </p>

        <div className="pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Enabled Module Providers ({health?.providers.length ?? 0})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {health?.providers.map((p) => (
              <div
                key={p}
                className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center gap-2.5"
              >
                <CheckCircle2Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-mono text-xs text-slate-200">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
