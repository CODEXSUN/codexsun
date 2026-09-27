import { useState, useEffect, useRef } from "react";
import type { AuthenticatedRequest } from "@codexsun/ui/blocks/auth";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Badge } from "@codexsun/ui/components/badge";
import {
  Activity,
  Check,
  Clock,
  Copy,
  Loader2,
  Play,
  RotateCcw,
  Square,
  Terminal,
  TerminalSquare,
  AlertTriangle,
} from "lucide-react";

export interface TerminalExecResponse {
  command: string;
  cwd: string;
  durationMs: number;
  exitCode: number;
  stderr: string;
  stdout: string;
  success: boolean;
}

export interface TerminalProcessItem {
  id: string;
  command: string;
  cwd: string;
  pid?: number;
  status: "running" | "completed" | "failed" | "killed";
  startedAt: string;
  completedAt?: string;
  exitCode: number | null;
}

export interface TerminalOutputResponse extends TerminalProcessItem {
  stdout: string;
  stderr: string;
  output: string;
}

const PRESET_COMMANDS = [
  { label: "Git Status", cmd: "git status" },
  { label: "Check API Types", cmd: "npm.cmd run check --workspace @codexsun/codeloop-api" },
  { label: "Check Web Types", cmd: "npm.cmd run check --workspace @codexsun/codeloop-web" },
  { label: "Check Architecture", cmd: "node tools/check-app-architecture.mjs" },
  { label: "Check Module Boundaries", cmd: "node tools/check-module-boundaries.mjs" },
  { label: "List Active Listeners", cmd: "netstat -ano | findstr 6370" },
];

export function TerminalWorkspace({
  request,
  projectName = "codexsun",
}: {
  request: AuthenticatedRequest;
  projectName?: string;
}) {
  const [activeTab, setActiveTab] = useState<"exec" | "processes">("exec");
  const [command, setCommand] = useState("git status");
  const [cwd, setCwd] = useState("");
  const [timeoutSec, setTimeoutSec] = useState("30");
  const [executing, setExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<TerminalExecResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Background processes state
  const [processes, setProcesses] = useState<readonly TerminalProcessItem[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string | null>(null);
  const [selectedProcessOutput, setSelectedProcessOutput] = useState<TerminalOutputResponse | null>(null);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const autoRefresh = true;

  const outputRef = useRef<HTMLPreElement>(null);

  // Load background processes
  const loadProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const res = await request("/api/v1/codeloop/terminal/processes");
      if (res.ok) {
        const body = (await res.json()) as { processes: TerminalProcessItem[] };
        setProcesses(body.processes);
      }
    } catch (err) {
      console.error("Failed to load processes:", err);
    } finally {
      setLoadingProcesses(false);
    }
  };

  // Poll processes and selected process output
  useEffect(() => {
    void loadProcesses();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      void loadProcesses();
      if (selectedProcessId) {
        void fetchProcessOutput(selectedProcessId);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedProcessId]);

  // Execute synchronous command (terminal.exec)
  const handleExecute = async () => {
    if (!command.trim() || executing) return;
    setExecuting(true);
    setErrorMsg(null);
    try {
      const res = await request("/api/v1/codeloop/terminal/exec", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command: command.trim(),
          cwd: cwd.trim() || undefined,
          timeoutMs: (parseInt(timeoutSec, 10) || 30) * 1000,
        }),
      });

      const body = (await res.json()) as {
        result?: TerminalExecResponse;
        error?: string;
      };

      if (!res.ok || !body.result) {
        setErrorMsg(body.error || "Command execution failed.");
        setLastResult(null);
      } else {
        setLastResult(body.result);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Execution failed.");
      setLastResult(null);
    } finally {
      setExecuting(false);
    }
  };

  // Spawn background command (terminal.background)
  const handleSpawnBackground = async () => {
    if (!command.trim() || executing) return;
    setExecuting(true);
    setErrorMsg(null);
    try {
      const res = await request("/api/v1/codeloop/terminal/background", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          command: command.trim(),
          cwd: cwd.trim() || undefined,
        }),
      });

      const body = (await res.json()) as {
        id?: string;
        command?: string;
        status?: string;
        error?: string;
      };

      if (!res.ok) {
        setErrorMsg(body.error || "Failed to start background process.");
      } else {
        setActiveTab("processes");
        await loadProcesses();
        if (body.id) {
          setSelectedProcessId(body.id);
          await fetchProcessOutput(body.id);
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to spawn process.");
    } finally {
      setExecuting(false);
    }
  };

  // Fetch process output (terminal.output)
  const fetchProcessOutput = async (procId: string) => {
    try {
      const res = await request(`/api/v1/codeloop/terminal/output/${encodeURIComponent(procId)}`);
      if (res.ok) {
        const body = (await res.json()) as TerminalOutputResponse;
        setSelectedProcessOutput(body);
      }
    } catch (err) {
      console.error("Failed to fetch process output:", err);
    }
  };

  // Kill background process (terminal.kill)
  const handleKill = async (procId: string) => {
    try {
      const res = await request("/api/v1/codeloop/terminal/kill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ processId: procId, signal: "SIGTERM" }),
      });
      if (res.ok) {
        await loadProcesses();
        if (selectedProcessId === procId) {
          await fetchProcessOutput(procId);
        }
      }
    } catch (err) {
      console.error("Failed to kill process:", err);
    }
  };

  const handleCopyOutput = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/95 px-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg bg-neutral-900 text-neutral-100 dark:bg-neutral-800">
            <TerminalSquare className="size-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
              <span>Terminal & Execution Tools</span>
              <Badge variant="outline" className="text-[10px] h-4 font-mono px-1.5 py-0 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
                Live
              </Badge>
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Repository boundary: <code className="font-mono text-[10px]">E:\codexsun\codexsun</code> ({projectName})
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("exec")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "exec"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Play className="size-3 text-emerald-500" />
            <span>terminal.exec</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("processes");
              void loadProcesses();
            }}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
              activeTab === "processes"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="size-3 text-blue-500" />
            <span>terminal.background</span>
            {processes.filter((p) => p.status === "running").length > 0 && (
              <span className="flex size-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {activeTab === "exec" ? (
          /* EXEC TAB */
          <div className="flex flex-1 flex-col p-6 overflow-y-auto space-y-4 max-w-5xl mx-auto w-full">
            {/* Quick Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COMMANDS.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setCommand(item.cmd)}
                    className="inline-flex items-center gap-1 rounded-md border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Card */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Terminal className="size-3.5 text-amber-500" />
                  <span>Execute Command</span>
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Press <kbd className="rounded border px-1 py-0.5 text-[10px] font-mono bg-muted">Ctrl + Enter</kbd> to run
                </span>
              </div>

              <div className="space-y-2">
                <Input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      void handleExecute();
                    }
                  }}
                  placeholder="Enter command (e.g. git status, npm test)..."
                  className="font-mono text-xs bg-muted/30 h-10"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Working directory (cwd, default repo root)
                    </label>
                    <Input
                      value={cwd}
                      onChange={(e) => setCwd(e.target.value)}
                      placeholder="e.g. devkits/codeloop"
                      className="font-mono text-xs bg-muted/20 h-8"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground mb-1 block">
                      Timeout seconds (1 - 120s)
                    </label>
                    <Input
                      type="number"
                      value={timeoutSec}
                      onChange={(e) => setTimeoutSec(e.target.value)}
                      min="1"
                      max="120"
                      className="font-mono text-xs bg-muted/20 h-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={handleExecute}
                    disabled={executing || !command.trim()}
                    className="h-8 gap-1.5 text-xs bg-black text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
                  >
                    {executing ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5 text-emerald-400" />
                    )}
                    <span>Execute Synchronously</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSpawnBackground}
                    disabled={executing || !command.trim()}
                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Activity className="size-3.5 text-blue-500" />
                    <span>Launch in Background</span>
                  </Button>
                </div>

                {lastResult && (
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Badge
                      variant={lastResult.success ? "outline" : "destructive"}
                      className={`h-5 px-1.5 text-[10px] ${
                        lastResult.success
                          ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : ""
                      }`}
                    >
                      Exit Code: {lastResult.exitCode}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" />
                      {lastResult.durationMs}ms
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-600 dark:text-red-400">
                <AlertTriangle className="size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Output Display */}
            <div className="flex-1 rounded-xl border border-border bg-neutral-950 p-4 font-mono text-xs text-neutral-100 shadow-md flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="size-2.5 rounded-full bg-red-500/80" />
                  <div className="size-2.5 rounded-full bg-yellow-500/80" />
                  <div className="size-2.5 rounded-full bg-green-500/80" />
                  <span className="text-[11px] text-neutral-400 font-sans ml-2">Console Output</span>
                </div>
                {lastResult && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyOutput(lastResult.stdout || lastResult.stderr)}
                    className="h-6 px-2 text-[10px] text-neutral-400 hover:text-white hover:bg-neutral-800"
                  >
                    {copied ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
                    <span>{copied ? "Copied" : "Copy output"}</span>
                  </Button>
                )}
              </div>

              <pre
                ref={outputRef}
                className="flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-300"
              >
                {executing ? (
                  <span className="text-neutral-500 flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin text-emerald-400" />
                    Executing: {command}...
                  </span>
                ) : lastResult ? (
                  <>
                    {lastResult.stdout && <span>{lastResult.stdout}</span>}
                    {lastResult.stderr && (
                      <span className="text-red-400">{lastResult.stderr}</span>
                    )}
                    {!lastResult.stdout && !lastResult.stderr && (
                      <span className="text-neutral-500 italic">(Command finished with no output)</span>
                    )}
                  </>
                ) : (
                  <span className="text-neutral-600 italic">Run a command above to see output.</span>
                )}
              </pre>
            </div>
          </div>
        ) : (
          /* BACKGROUND PROCESSES TAB */
          <div className="flex flex-1 overflow-hidden divide-x divide-border">
            {/* Process list sidebar */}
            <div className="w-80 shrink-0 flex flex-col bg-muted/10 overflow-y-auto">
              <div className="flex items-center justify-between p-3 border-b border-border/60">
                <span className="text-xs font-semibold text-foreground">
                  Tracked Processes ({processes.length})
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={loadProcesses}
                  disabled={loadingProcesses}
                  className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className={`size-3 ${loadingProcesses ? "animate-spin" : ""}`} />
                </Button>
              </div>

              <div className="divide-y divide-border/40 overflow-y-auto flex-1">
                {processes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    No background processes recorded yet.
                  </div>
                ) : (
                  processes.map((proc) => {
                    const isSelected = selectedProcessId === proc.id;
                    const isRunning = proc.status === "running";

                    return (
                      <div
                        key={proc.id}
                        onClick={() => {
                          setSelectedProcessId(proc.id);
                          void fetchProcessOutput(proc.id);
                        }}
                        className={`p-3 text-xs transition-colors cursor-pointer space-y-1.5 ${
                          isSelected
                            ? "bg-neutral-100 font-medium dark:bg-neutral-800/80"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-semibold truncate max-w-[170px] text-foreground">
                            {proc.command}
                          </span>
                          <Badge
                            variant={
                              isRunning
                                ? "outline"
                                : proc.status === "completed"
                                ? "outline"
                                : "destructive"
                            }
                            className={`text-[9px] h-4 px-1.5 font-normal ${
                              isRunning
                                ? "border-blue-500/40 text-blue-600 dark:text-blue-400 bg-blue-500/10 animate-pulse"
                                : proc.status === "completed"
                                ? "border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                                : ""
                            }`}
                          >
                            {proc.status}
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                          <span>PID: {proc.pid ?? "—"}</span>
                          <span>{proc.id.slice(0, 16)}…</span>
                        </div>

                        {isRunning && (
                          <div className="flex justify-end pt-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                void handleKill(proc.id);
                              }}
                              className="h-5 px-2 text-[10px]"
                            >
                              <Square className="size-2.5 mr-1" />
                              Kill Process
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Process Output Stream */}
            <div className="flex-1 flex flex-col bg-neutral-950 p-4 font-mono text-xs text-neutral-100 overflow-hidden">
              {selectedProcessId ? (
                <>
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-3">
                    <div>
                      <div className="text-sm font-semibold text-white font-mono flex items-center gap-2">
                        <span>{selectedProcessOutput?.command || "Process output"}</span>
                        {selectedProcessOutput?.status === "running" && (
                          <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-sans mt-0.5">
                        ID: {selectedProcessId} · Status: {selectedProcessOutput?.status || "loading"}
                        {selectedProcessOutput?.exitCode !== null && selectedProcessOutput?.exitCode !== undefined && (
                          <span> · Exit code: {selectedProcessOutput.exitCode}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {selectedProcessOutput?.status === "running" && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleKill(selectedProcessId)}
                          className="h-7 text-xs"
                        >
                          <Square className="size-3 mr-1" />
                          Kill
                        </Button>
                      )}

                      {selectedProcessOutput && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyOutput(selectedProcessOutput.output)}
                          className="h-7 px-2 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800"
                        >
                          {copied ? <Check className="size-3 text-emerald-400 mr-1" /> : <Copy className="size-3 mr-1" />}
                          <span>{copied ? "Copied" : "Copy"}</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  <pre className="flex-1 overflow-auto whitespace-pre-wrap font-mono text-xs leading-relaxed text-neutral-300">
                    {selectedProcessOutput?.output ? (
                      selectedProcessOutput.output
                    ) : (
                      <span className="text-neutral-500 italic">No output received yet...</span>
                    )}
                  </pre>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center text-xs text-neutral-500 italic">
                  Select a process from the list on the left to inspect its live output stream.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
