import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { resolve, normalize, isAbsolute } from "node:path";

export type TerminalProcessStatus = "running" | "completed" | "failed" | "killed";

export interface TerminalExecInput {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface TerminalExecResult {
  command: string;
  cwd: string;
  durationMs: number;
  exitCode: number;
  stderr: string;
  stdout: string;
  success: boolean;
}

export interface TerminalBackgroundInput {
  command: string;
  cwd?: string;
  env?: Record<string, string>;
}

export interface TerminalProcessInfo {
  id: string;
  command: string;
  cwd: string;
  pid?: number;
  status: TerminalProcessStatus;
  startedAt: string;
  completedAt?: string;
  exitCode: number | null;
}

export interface TerminalProcessOutput extends TerminalProcessInfo {
  stdout: string;
  stderr: string;
  output: string;
}

interface InternalProcessRecord extends TerminalProcessInfo {
  childProcess?: ChildProcess;
  stdoutBuffer: string[];
  stderrBuffer: string[];
  totalStdoutLen: number;
  totalStderrLen: number;
}

const MAX_BUFFER_BYTES = 1024 * 1024; // 1 MB buffer limit per stream

export class TerminalManager {
  private readonly rootPath: string;
  private readonly processes = new Map<string, InternalProcessRecord>();

  constructor(rootPath: string = process.cwd()) {
    this.rootPath = normalize(resolve(rootPath));
  }

  /**
   * Safely resolves and validates a working directory within the repository boundary.
   */
  resolveSafeCwd(requestedCwd?: string): string {
    if (!requestedCwd) return this.rootPath;
    const target = isAbsolute(requestedCwd)
      ? normalize(resolve(requestedCwd))
      : normalize(resolve(this.rootPath, requestedCwd));

    // Must stay within the repository root
    if (!target.toLowerCase().startsWith(this.rootPath.toLowerCase())) {
      throw new Error(`Requested working directory '${requestedCwd}' is outside workspace boundary '${this.rootPath}'.`);
    }
    return target;
  }

  /**
   * terminal.exec: Executes a command synchronously with timeout and returns output.
   */
  async exec(input: TerminalExecInput): Promise<TerminalExecResult> {
    const cwd = this.resolveSafeCwd(input.cwd);
    const timeoutMs = Math.min(Math.max(input.timeoutMs ?? 30_000, 1_000), 120_000);
    const startTime = Date.now();

    return new Promise<TerminalExecResult>((res) => {
      let timedOut = false;
      const child = spawn(input.command, {
        cwd,
        shell: true,
        env: { ...process.env, ...input.env },
        windowsHide: true,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (chunk: Buffer) => {
        if (stdout.length < MAX_BUFFER_BYTES) {
          stdout += chunk.toString("utf8");
        }
      });

      child.stderr?.on("data", (chunk: Buffer) => {
        if (stderr.length < MAX_BUFFER_BYTES) {
          stderr += chunk.toString("utf8");
        }
      });

      const timer = setTimeout(() => {
        timedOut = true;
        if (process.platform === "win32" && child.pid) {
          try {
            spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
          } catch {
            child.kill("SIGKILL");
          }
        } else {
          child.kill("SIGKILL");
        }
      }, timeoutMs);

      child.on("error", (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        res({
          command: input.command,
          cwd,
          durationMs,
          exitCode: 1,
          stderr: stderr ? `${stderr}\n${err.message}` : err.message,
          stdout,
          success: false,
        });
      });

      child.on("close", (code) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        const exitCode = timedOut ? 124 : (code ?? 0);
        if (timedOut) {
          stderr += `\nCommand timed out after ${timeoutMs}ms.`;
        }
        res({
          command: input.command,
          cwd,
          durationMs,
          exitCode,
          stderr,
          stdout,
          success: exitCode === 0,
        });
      });
    });
  }

  /**
   * terminal.background: Spawns a background process and tracks its output and lifecycle.
   */
  background(input: TerminalBackgroundInput): TerminalProcessInfo {
    const cwd = this.resolveSafeCwd(input.cwd);
    const processId = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const child = spawn(input.command, {
      cwd,
      shell: true,
      env: { ...process.env, ...input.env },
      windowsHide: true,
    });

    const record: InternalProcessRecord = {
      id: processId,
      command: input.command,
      cwd,
      pid: child.pid,
      status: "running",
      startedAt: now,
      exitCode: null,
      childProcess: child,
      stdoutBuffer: [],
      stderrBuffer: [],
      totalStdoutLen: 0,
      totalStderrLen: 0,
    };

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      if (record.totalStdoutLen < MAX_BUFFER_BYTES) {
        record.stdoutBuffer.push(text);
        record.totalStdoutLen += text.length;
      }
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf8");
      if (record.totalStderrLen < MAX_BUFFER_BYTES) {
        record.stderrBuffer.push(text);
        record.totalStderrLen += text.length;
      }
    });

    child.on("error", (err) => {
      record.status = "failed";
      record.completedAt = new Date().toISOString();
      record.stderrBuffer.push(`\nProcess error: ${err.message}`);
    });

    child.on("close", (code) => {
      if (record.status === "running") {
        record.status = code === 0 ? "completed" : "failed";
      }
      record.exitCode = code;
      record.completedAt = new Date().toISOString();
    });

    this.processes.set(processId, record);

    return {
      id: record.id,
      command: record.command,
      cwd: record.cwd,
      pid: record.pid,
      status: record.status,
      startedAt: record.startedAt,
      exitCode: record.exitCode,
    };
  }

  /**
   * terminal.kill: Terminates a running process.
   */
  kill(processId: string, signal: "SIGTERM" | "SIGKILL" = "SIGTERM"): {
    processId: string;
    killed: boolean;
    status: TerminalProcessStatus | "not_found";
  } {
    const record = this.processes.get(processId);
    if (!record) {
      return { processId, killed: false, status: "not_found" };
    }

    if (record.status !== "running" || !record.childProcess) {
      return { processId, killed: false, status: record.status };
    }

    try {
      if (process.platform === "win32" && record.pid) {
        try {
          spawnSync("taskkill", ["/pid", String(record.pid), "/T", "/F"]);
        } catch {
          record.childProcess.kill(signal);
        }
      } else {
        record.childProcess.kill(signal);
      }
      record.status = "killed";
      record.completedAt = new Date().toISOString();
      record.stderrBuffer.push(`\nProcess terminated by signal ${signal}.`);
      return { processId, killed: true, status: "killed" };
    } catch (err) {
      record.status = "failed";
      record.stderrBuffer.push(`\nFailed to kill process: ${err instanceof Error ? err.message : String(err)}`);
      return { processId, killed: false, status: "failed" };
    }
  }

  /**
   * terminal.output: Returns output streams and status for a process.
   */
  output(processId: string, options?: { offset?: number; limit?: number }): TerminalProcessOutput | null {
    const record = this.processes.get(processId);
    if (!record) return null;

    let stdout = record.stdoutBuffer.join("");
    const stderr = record.stderrBuffer.join("");

    if (options?.offset !== undefined || options?.limit !== undefined) {
      const offset = options.offset ?? 0;
      const limit = options.limit ?? stdout.length;
      stdout = stdout.slice(offset, offset + limit);
    }

    const output = [stdout, stderr].filter(Boolean).join("\n");

    return {
      id: record.id,
      command: record.command,
      cwd: record.cwd,
      pid: record.pid,
      status: record.status,
      startedAt: record.startedAt,
      completedAt: record.completedAt,
      exitCode: record.exitCode,
      stdout,
      stderr,
      output,
    };
  }

  /**
   * Lists all tracked processes.
   */
  listProcesses(): readonly TerminalProcessInfo[] {
    return Array.from(this.processes.values())
      .map((r) => ({
        id: r.id,
        command: r.command,
        cwd: r.cwd,
        pid: r.pid,
        status: r.status,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        exitCode: r.exitCode,
      }))
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  /**
   * Cleanup all running processes when server shuts down.
   */
  cleanup(): void {
    for (const [id, record] of this.processes.entries()) {
      if (record.status === "running" && record.childProcess) {
        this.kill(id, "SIGKILL");
      }
    }
  }
}
