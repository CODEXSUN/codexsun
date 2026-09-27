import { TerminalTools, type TerminalProcessInfo, type TerminalProcessOutput } from "../terminal/terminal-tools.js";

export type ManagedProcess = TerminalProcessInfo & { name: string };
export type ProcessStartInput = { name: string; command: string; cwd?: string; env?: Record<string, string> };

export class ProcessTools {
  private readonly services = new Map<string, ManagedProcess>();

  constructor(private readonly terminal: TerminalTools) {}

  capabilities() {
    return {
      root: this.terminal.root,
      tools: ["process.start", "process.stop", "process.restart", "process.status", "process.logs"] as const,
    };
  }

  start(input: ProcessStartInput): ManagedProcess {
    const name = validName(input.name);
    const existing = this.services.get(name);
    if (existing && existing.status === "running") return existing;
    const process = this.terminal.background(validCommand(input.command), input.cwd, input.env);
    const managed = { ...process, name };
    this.services.set(name, managed);
    return managed;
  }

  stop(name: string, signal: "SIGTERM" | "SIGKILL" = "SIGTERM") {
    const service = this.requireService(name);
    const result = this.terminal.kill(service.id, signal);
    this.services.set(service.name, { ...service, status: result.status === "not_found" ? "failed" : result.status, completedAt: new Date().toISOString() });
    return { ...result, name: service.name };
  }

  restart(input: ProcessStartInput): ManagedProcess {
    const name = validName(input.name);
    const existing = this.services.get(name);
    if (existing?.status === "running") this.stop(name, "SIGTERM");
    return this.start({ ...input, name });
  }

  status(name?: string): ManagedProcess | readonly ManagedProcess[] {
    if (name) return this.refresh(this.requireService(name));
    return [...this.services.values()].map((service) => this.refresh(service));
  }

  logs(name: string, offset?: number, limit?: number): TerminalProcessOutput & { name: string } {
    const service = this.refresh(this.requireService(name));
    return { ...this.terminal.output(service.id, offset, limit), name: service.name };
  }

  private refresh(service: ManagedProcess): ManagedProcess {
    const current = this.terminal.listProcesses().find((process) => process.id === service.id);
    const refreshed = current ? { ...service, ...current } : service;
    this.services.set(service.name, refreshed);
    return refreshed;
  }

  private requireService(name: string): ManagedProcess {
    const service = this.services.get(validName(name));
    if (!service) throw new Error(`Process service '${name}' is not registered.`);
    return service;
  }
}

function validName(value: string): string {
  const name = value.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u.test(name)) throw new Error("Process service names must be 1 to 64 letters, numbers, dots, underscores, or hyphens.");
  return name;
}

function validCommand(value: string): string {
  const command = value.trim();
  if (!command) throw new Error("A process command is required.");
  if (command.length > 2_000) throw new Error("Process commands must not exceed 2000 characters.");
  return command;
}
