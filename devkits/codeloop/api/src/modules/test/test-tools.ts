import { TerminalTools, type TerminalExecResult, type TerminalProcessInfo } from "../terminal/terminal-tools.js";

export type TestToolName = "test.run" | "test.unit" | "test.integration" | "test.e2e" | "test.watch" | "test.coverage";
export type TestRunResult = TerminalExecResult & { tool: TestToolName; scope: string };
export type TestWatchResult = TerminalProcessInfo & { tool: "test.watch"; scope: string };

const defaultCommands: Record<TestToolName, string> = {
  "test.run": "npm test",
  "test.unit": "npm run test:unit",
  "test.integration": "npm run test:integration",
  "test.e2e": "npm run test:e2e",
  "test.watch": "npm run test:watch",
  "test.coverage": "npm run test:coverage",
};

export class TestTools {
  constructor(private readonly terminal: TerminalTools) {}

  capabilities() {
    return {
      tools: Object.keys(defaultCommands) as TestToolName[],
      root: this.terminal.root,
      boundedTimeoutMs: 120_000,
    } as const;
  }

  async run(tool: Exclude<TestToolName, "test.watch">, command?: string, scope?: string, timeoutMs?: number): Promise<TestRunResult> {
    const normalizedCommand = this.commandFor(tool, command);
    const result = await this.terminal.exec(normalizedCommand, scope, timeoutMs);
    return { ...result, tool, scope: scope?.trim() || "." };
  }

  watch(command?: string, scope?: string): TestWatchResult {
    const normalizedCommand = this.commandFor("test.watch", command);
    return { ...this.terminal.background(normalizedCommand, scope), tool: "test.watch", scope: scope?.trim() || "." };
  }

  private commandFor(tool: TestToolName, command?: string): string {
    const value = command?.trim() || defaultCommands[tool];
    if (!value) throw new Error(`${tool} requires a command.`);
    if (value.length > 2_000) throw new Error("Test command must not exceed 2000 characters.");
    return value;
  }
}
