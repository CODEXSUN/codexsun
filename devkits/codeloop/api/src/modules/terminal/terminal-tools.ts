import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { isAbsolute, normalize, relative, resolve, sep } from "node:path";

export type TerminalProcessStatus = "running" | "completed" | "failed" | "killed";

export class TerminalToolError extends Error {
  constructor(readonly statusCode: 400 | 403 | 404 | 409 | 500, message: string) {
    super(message);
    this.name = "TerminalToolError";
  }
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

export class TerminalTools {
  readonly root: string;
  private readonly processes = new Map<string, InternalProcessRecord>();

  constructor(root: string = process.cwd()) {
    this.root = normalize(resolve(root));
  }

  capabilities() {
    return {
      root: this.root,
      tools: [
        "terminal.exec",
        "terminal.background",
        "terminal.kill",
        "terminal.output",
      ] as const,
    };
  }

  /**
   * Safely resolves working directory within root repository boundaries.
   */
  resolveSafeCwd(requestedCwd?: string): string {
    if (!requestedCwd || requestedCwd.trim() === "" || requestedCwd === ".") {
      return this.root;
    }
    const target = isAbsolute(requestedCwd)
      ? normalize(resolve(requestedCwd))
      : normalize(resolve(this.root, requestedCwd));

    const relativeTarget = relative(this.root, target);
    if (relativeTarget === ".." || relativeTarget.startsWith(`..${sep}`) || isAbsolute(relativeTarget)) {
      throw new TerminalToolError(
        403,
        `Working directory '${requestedCwd}' is outside workspace boundary '${this.root}'.`
      );
    }
    return target;
  }

  /**
   * terminal.exec: Execute a command synchronously with timeout and return output.
   */
  async exec(
    command: string,
    cwd?: string,
    timeoutMs: number = 30_000,
    env?: Record<string, string>
  ): Promise<TerminalExecResult> {
    const safeCwd = this.resolveSafeCwd(cwd);
    const clampedTimeout = Math.min(Math.max(timeoutMs, 1_000), 120_000);
    const startTime = Date.now();

    return new Promise<TerminalExecResult>((res) => {
      let timedOut = false;
      const child = spawn(command, {
        cwd: safeCwd,
        shell: true,
        env: { ...process.env, ...env },
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
      }, clampedTimeout);

      child.on("error", (err) => {
        clearTimeout(timer);
        const durationMs = Date.now() - startTime;
        res({
          command,
          cwd: safeCwd,
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
          stderr += `\nCommand timed out after ${clampedTimeout}ms.`;
        }
        res({
          command,
          cwd: safeCwd,
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
   * terminal.background: Launch a command in the background.
   */
  background(
    command: string,
    cwd?: string,
    env?: Record<string, string>
  ): TerminalProcessInfo {
    const safeCwd = this.resolveSafeCwd(cwd);
    const processId = `proc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const child = spawn(command, {
      cwd: safeCwd,
      shell: true,
      env: { ...process.env, ...env },
      windowsHide: true,
    });

    const record: InternalProcessRecord = {
      id: processId,
      command,
      cwd: safeCwd,
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
   * terminal.kill: Terminate a running background process.
   */
  kill(
    processId: string,
    signal: "SIGTERM" | "SIGKILL" = "SIGTERM"
  ): { processId: string; killed: boolean; status: TerminalProcessStatus | "not_found" } {
    const record = this.processes.get(processId);
    if (!record) {
      throw new TerminalToolError(404, `Process '${processId}' not found.`);
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
   * terminal.output: Fetch output and status of a process.
   */
  output(
    processId: string,
    offset?: number,
    limit?: number
  ): TerminalProcessOutput {
    const record = this.processes.get(processId);
    if (!record) {
      throw new TerminalToolError(404, `Process '${processId}' not found.`);
    }

    let stdout = record.stdoutBuffer.join("");
    const stderr = record.stderrBuffer.join("");

    if (offset !== undefined || limit !== undefined) {
      const start = offset ?? 0;
      const end = limit !== undefined ? start + limit : stdout.length;
      stdout = stdout.slice(start, end);
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
   * List all background processes.
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
   * Cleanup any remaining running processes.
   */
  cleanup(): void {
    for (const [id, record] of this.processes.entries()) {
      if (record.status === "running" && record.childProcess) {
        try {
          this.kill(id, "SIGKILL");
        } catch {
          // ignore cleanup errors on shutdown
        }
      }
    }
  }
}
