import { TerminalTools, type TerminalExecResult } from "../terminal/terminal-tools.js";

export type ValidationStatus = "passed" | "failed" | "not_run";
export type ValidationStage = "typecheck" | "lint" | "unit" | "integration" | "e2e" | "build";
export type ValidationCommands = Partial<Record<ValidationStage, string>>;
export type ValidationError = { stage: ValidationStage; command: string; exitCode: number; message: string };

export type ValidationResult = {
  success: boolean;
  typecheck: ValidationStatus;
  lint: ValidationStatus;
  tests: ValidationStatus;
  build: ValidationStatus;
  testStages: { unit: ValidationStatus; integration: ValidationStatus; e2e: ValidationStatus };
  errors: ValidationError[];
  results: Partial<Record<ValidationStage, TerminalExecResult>>;
};

const defaultCommands: Record<ValidationStage, string> = {
  typecheck: "npm run check",
  lint: "npm run lint",
  unit: "npm run test:unit",
  integration: "npm run test:integration",
  e2e: "npm run test:e2e",
  build: "npm run build",
};

const stages: readonly ValidationStage[] = ["typecheck", "lint", "unit", "integration", "e2e", "build"];

export class ValidationTools {
  constructor(private readonly terminal: TerminalTools) {}

  async validate(scope?: string, commands: ValidationCommands = {}, timeoutMs = 120_000): Promise<ValidationResult> {
    const result: ValidationResult = {
      success: false,
      typecheck: "not_run",
      lint: "not_run",
      tests: "not_run",
      build: "not_run",
      testStages: { unit: "not_run", integration: "not_run", e2e: "not_run" },
      errors: [],
      results: {},
    };

    for (const stage of stages) {
      const command = commandFor(stage, commands[stage]);
      const execution = await this.terminal.exec(command, scope, timeoutMs);
      result.results[stage] = execution;
      const status: ValidationStatus = execution.success ? "passed" : "failed";
      setStageStatus(result, stage, status);
      if (!execution.success) {
        result.errors.push({ stage, command, exitCode: execution.exitCode, message: boundedMessage(execution.stderr || execution.stdout) });
        break;
      }
    }

    result.success = result.errors.length === 0;
    return result;
  }
}

function commandFor(stage: ValidationStage, override?: string): string {
  const command = override?.trim() || defaultCommands[stage];
  if (command.length > 2_000) throw new Error(`Validation command for ${stage} must not exceed 2000 characters.`);
  return command;
}

function setStageStatus(result: ValidationResult, stage: ValidationStage, status: ValidationStatus): void {
  if (stage === "typecheck" || stage === "lint" || stage === "build") result[stage] = status;
  if (stage === "unit" || stage === "integration" || stage === "e2e") {
    result.testStages[stage] = status;
    result.tests = Object.values(result.testStages).some((value) => value === "failed") ? "failed" : Object.values(result.testStages).every((value) => value === "passed") ? "passed" : "not_run";
  }
}

function boundedMessage(value: string): string {
  const message = value.trim();
  return message.length > 4_000 ? `${message.slice(0, 4_000)}…` : message;
}
