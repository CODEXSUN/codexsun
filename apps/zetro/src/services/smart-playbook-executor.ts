import type { Kysely } from "kysely";

import type {
  ZetroConditionField,
  ZetroConditionOperator,
  ZetroConditionGroup,
  ZetroPhaseCondition,
  ZetroPhaseConditionConfig,
  ZetroPhaseEvaluationResult,
  ZetroSmartPhaseContext,
  ZetroPhaseFailureAction,
  ZetroPlaybookPhase,
} from "../../shared/playbook-contracts.js";
import { listZetroFindings } from "./finding-service.js";

export function evaluateCondition(
  condition: ZetroPhaseCondition,
  context: ZetroSmartPhaseContext,
): boolean {
  const actual = getConditionValue(condition.field, context);

  switch (condition.operator) {
    case "eq":
      return actual === condition.value;
    case "ne":
      return actual !== condition.value;
    case "gt":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual > condition.value
      );
    case "gte":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual >= condition.value
      );
    case "lt":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual < condition.value
      );
    case "lte":
      return (
        typeof actual === "number" &&
        typeof condition.value === "number" &&
        actual <= condition.value
      );
    case "contains":
      return (
        typeof actual === "string" &&
        typeof condition.value === "string" &&
        actual.includes(condition.value)
      );
    case "notContains":
      return (
        typeof actual === "string" &&
        typeof condition.value === "string" &&
        !actual.includes(condition.value)
      );
    case "startsWith":
      return (
        typeof actual === "string" &&
        typeof condition.value === "string" &&
        actual.startsWith(condition.value)
      );
    case "endsWith":
      return (
        typeof actual === "string" &&
        typeof condition.value === "string" &&
        actual.endsWith(condition.value)
      );
    default:
      return false;
  }
}

function getConditionValue(
  field: ZetroConditionField,
  context: ZetroSmartPhaseContext,
): string | number | boolean {
  switch (field) {
    case "severity":
      if (!context.findings || context.findings.length === 0) return "none";
      const severities = ["critical", "high", "medium", "low"];
      for (const sev of severities) {
        const count = context.findings!.filter(
          (f) => f.severity === sev,
        ).length;
        if (count > 0) return sev;
      }
      return "none";
    case "findingCount":
      return context.findings?.length ?? 0;
    case "criticalFindingCount":
      return (
        context.findings?.filter((f) => f.severity === "critical").length ?? 0
      );
    case "outputContains":
    case "outputNotContains":
      return context.previousOutput ?? "";
    case "commandSuccess":
      return context.previousCommandSuccess === true;
    case "commandFailed":
      return context.previousCommandSuccess === false;
    case "timeElapsed":
      return context.elapsedMs ?? 0;
    case "iterationNumber":
      return context.iteration;
    case "riskLevel":
      if (!context.findings || context.findings.length === 0) return "none";
      if (context.findings.some((f) => f.severity === "critical"))
        return "critical";
      if (context.findings.some((f) => f.severity === "high")) return "high";
      if (context.findings.some((f) => f.severity === "medium"))
        return "medium";
      return "low";
    default:
      return "";
  }
}

export function evaluateConditionGroup(
  group: ZetroConditionGroup,
  context: ZetroSmartPhaseContext,
): {
  passed: boolean;
  results: Array<{
    conditionId: string;
    passed: boolean;
    actual: string | number | boolean;
    expected: string | number | boolean;
  }>;
} {
  const results: Array<{
    conditionId: string;
    passed: boolean;
    actual: string | number | boolean;
    expected: string | number | boolean;
  }> = [];

  for (const condition of group.conditions) {
    const actual = getConditionValue(condition.field, context);
    const passed = evaluateCondition(condition, context);
    results.push({
      conditionId: condition.id,
      passed,
      actual,
      expected: condition.value,
    });
  }

  if (group.logic === "AND") {
    return { passed: results.every((r) => r.passed), results };
  } else {
    return { passed: results.some((r) => r.passed), results };
  }
}

export function evaluatePhaseConditions(
  phase: ZetroPlaybookPhase,
  context: ZetroSmartPhaseContext,
): ZetroPhaseEvaluationResult {
  const result: ZetroPhaseEvaluationResult = {
    phaseId: phase.id,
    shouldExecute: true,
    shouldSkip: false,
    reason: "No conditions configured",
    evaluatedConditions: [],
  };

  if (!phase.conditionConfig) {
    return result;
  }

  if (phase.conditionConfig.skipIf) {
    const skipResult = evaluateConditionGroup(
      phase.conditionConfig.skipIf,
      context,
    );
    for (const r of skipResult.results) {
      result.evaluatedConditions.push({
        conditionId: r.conditionId,
        passed: r.passed,
        actual: r.actual,
        expected: r.expected,
      });
    }
    if (skipResult.passed) {
      result.shouldSkip = true;
      result.shouldExecute = false;
      result.reason = "Skip conditions met";
      return result;
    }
  }

  if (phase.conditionConfig.requireIf) {
    const requireResult = evaluateConditionGroup(
      phase.conditionConfig.requireIf,
      context,
    );
    for (const r of requireResult.results) {
      result.evaluatedConditions.push({
        conditionId: r.conditionId,
        passed: r.passed,
        actual: r.actual,
        expected: r.expected,
      });
    }
    if (!requireResult.passed) {
      result.shouldSkip = true;
      result.shouldExecute = false;
      result.reason = "Required conditions not met";
      return result;
    }
  }

  if (phase.conditionConfig.gotoIf) {
    const gotoResult = evaluateConditionGroup(
      phase.conditionConfig.gotoIf.condition,
      context,
    );
    for (const r of gotoResult.results) {
      result.evaluatedConditions.push({
        conditionId: r.conditionId,
        passed: r.passed,
        actual: r.actual,
        expected: r.expected,
      });
    }
    if (gotoResult.passed) {
      result.shouldGoto = phase.conditionConfig.gotoIf.targetPhaseId;
      result.reason = `Goto condition met, branching to ${phase.conditionConfig.gotoIf.targetPhaseId}`;
    }
  }

  result.reason = "All conditions passed or no conditions configured";
  return result;
}

export function getFailureAction(
  phase: ZetroPlaybookPhase,
  attemptNumber: number,
): { action: ZetroPhaseFailureAction; shouldRetry: boolean } {
  if (!phase.onFailure) {
    return { action: "stop", shouldRetry: false };
  }

  if (phase.onFailure === "retry" && phase.retryConfig) {
    const shouldRetry = attemptNumber < phase.retryConfig.maxRetries;
    return { action: "retry", shouldRetry };
  }

  return { action: phase.onFailure, shouldRetry: false };
}

export function calculateRetryDelay(
  phase: ZetroPlaybookPhase,
  attemptNumber: number,
): number {
  if (!phase.retryConfig) return 1000;

  const multiplier = phase.retryConfig.backoffMultiplier ?? 2;
  return phase.retryConfig.delayMs * Math.pow(multiplier, attemptNumber - 1);
}

export async function buildSmartPhaseContext(
  database: Kysely<unknown>,
  runId: string,
  iteration: number,
  previousOutput?: string,
  previousCommandSuccess?: boolean,
): Promise<ZetroSmartPhaseContext> {
  const findings = await listZetroFindings(database, { runId });

  const context: ZetroSmartPhaseContext = {
    runId,
    iteration,
    previousOutput,
    previousCommandSuccess,
    severityCounts: {},
    findings: findings.map((f) => ({
      severity: f.severity,
      title: f.title,
    })),
  };

  for (const finding of findings) {
    context.severityCounts![finding.severity] =
      (context.severityCounts![finding.severity] ?? 0) + 1;
  }

  return context;
}

export function getNextPhaseIndex(
  phases: ZetroPlaybookPhase[],
  currentIndex: number,
  evaluation: ZetroPhaseEvaluationResult,
): number {
  if (evaluation.shouldGoto) {
    const gotoIndex = phases.findIndex((p) => p.id === evaluation.shouldGoto);
    if (gotoIndex !== -1) return gotoIndex;
  }

  return currentIndex + 1;
}

export function shouldContinueLoop(
  phases: ZetroPlaybookPhase[],
  currentIndex: number,
  maxIterations: number,
  iteration: number,
): boolean {
  if (iteration >= maxIterations) return false;

  const remainingPhases = phases.length - currentIndex - 1;
  if (remainingPhases <= 0) return false;

  return true;
}

export type ZetroConditionViolation = {
  phaseId: string;
  conditionId: string;
  expected: string | number | boolean;
  actual: string | number | boolean;
};

export function validatePlaybookConditions(phases: ZetroPlaybookPhase[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  for (const phase of phases) {
    if (!phase.conditionConfig) continue;

    if (phase.conditionConfig.gotoIf) {
      const targetExists = phases.some(
        (p) => p.id === phase.conditionConfig!.gotoIf!.targetPhaseId,
      );
      if (!targetExists) {
        errors.push(
          `Phase "${phase.name}" (${phase.id}) has goto target "${phase.conditionConfig.gotoIf.targetPhaseId}" which does not exist`,
        );
      }

      if (phase.conditionConfig.gotoIf.targetPhaseId === phase.id) {
        errors.push(
          `Phase "${phase.name}" (${phase.id}) has self-referential goto (would create infinite loop)`,
        );
      }
    }

    if (phase.conditionConfig.skipIf && phase.conditionConfig.requireIf) {
      for (const skipCond of phase.conditionConfig.skipIf.conditions) {
        for (const reqCond of phase.conditionConfig.requireIf.conditions) {
          if (skipCond.id === reqCond.id) {
            errors.push(
              `Phase "${phase.name}" (${phase.id}) has conflicting skip and require conditions for "${skipCond.field}"`,
            );
          }
        }
      }
    }

    if (phase.retryConfig && phase.onFailure !== "retry") {
      errors.push(
        `Phase "${phase.name}" (${phase.id}) has retryConfig but onFailure is "${phase.onFailure}" (should be "retry")`,
      );
    }

    if (phase.retryConfig && phase.retryConfig.maxRetries < 1) {
      errors.push(
        `Phase "${phase.name}" (${phase.id}) has invalid maxRetries: ${phase.retryConfig.maxRetries}`,
      );
    }
  }

  return { valid: errors.length === 0, errors };
}
