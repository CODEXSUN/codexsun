import type { Kysely } from "kysely";

import type {
  ZetroAutonomyConfig,
  ZetroAutonomyLevel,
  ZetroAutonomyLogEntry,
  ZetroAutoApproveRule,
  ZetroRiskLevel,
} from "./autonomy-types.js";
import {
  DEFAULT_AUTONOMY_CONFIG,
  classifyRiskLevel,
  ZETRO_AUTONOMY_LEVEL_SUMMARY,
  ZETRO_RISK_LEVEL_SUMMARY,
} from "./autonomy-types.js";

const autonomyLogs: ZetroAutonomyLogEntry[] = [];

let autonomyConfig: ZetroAutonomyConfig = { ...DEFAULT_AUTONOMY_CONFIG };

export function getAutonomyConfig(): ZetroAutonomyConfig {
  return { ...autonomyConfig };
}

export function updateAutonomyConfig(
  config: Partial<ZetroAutonomyConfig>,
): void {
  autonomyConfig = {
    ...autonomyConfig,
    ...config,
  };
}

export function resetAutonomyConfig(): void {
  autonomyConfig = { ...DEFAULT_AUTONOMY_CONFIG };
}

export function getDefaultAutonomyLevel(): ZetroAutonomyLevel {
  return autonomyConfig.defaultLevel;
}

export function setDefaultAutonomyLevel(level: ZetroAutonomyLevel): void {
  autonomyConfig.defaultLevel = level;
}

export function getAutonomyRules(): ZetroAutoApproveRule[] {
  return [...autonomyConfig.rules];
}

export function addAutonomyRule(rule: ZetroAutoApproveRule): void {
  autonomyConfig.rules.push(rule);
}

export function removeAutonomyRule(ruleId: string): boolean {
  const index = autonomyConfig.rules.findIndex((r) => r.id === ruleId);
  if (index !== -1) {
    autonomyConfig.rules.splice(index, 1);
    return true;
  }
  return false;
}

export function findMatchingRule(
  command: string,
): ZetroAutoApproveRule | undefined {
  for (const rule of autonomyConfig.rules) {
    try {
      const regex = new RegExp(rule.pattern, "i");
      if (regex.test(command)) {
        return rule;
      }
    } catch {
      if (command.toLowerCase().includes(rule.pattern.toLowerCase())) {
        return rule;
      }
    }
  }
  return undefined;
}

export function classifyCommandRisk(command: string): ZetroRiskLevel {
  return classifyRiskLevel(command);
}

export type AutonomyDecision = {
  autonomyLevel: ZetroAutonomyLevel;
  riskLevel: ZetroRiskLevel;
  action: ZetroAutonomyLogEntry["action"];
  reason: string;
  matchedRule?: ZetroAutoApproveRule;
};

export function shouldAutoApprove(
  command: string,
  runAutonomyLevel?: ZetroAutonomyLevel,
): AutonomyDecision {
  const effectiveLevel = runAutonomyLevel ?? autonomyConfig.defaultLevel;

  if (effectiveLevel === "manual") {
    return {
      autonomyLevel: effectiveLevel,
      riskLevel: classifyCommandRisk(command),
      action: "requires_approval",
      reason: "Manual mode requires explicit approval for all commands",
    };
  }

  const riskLevel = classifyCommandRisk(command);

  if (riskLevel === "critical") {
    return {
      autonomyLevel: effectiveLevel,
      riskLevel,
      action: "blocked",
      reason:
        "Critical risk commands are always blocked regardless of autonomy level",
    };
  }

  const matchedRule = findMatchingRule(command);

  if (matchedRule) {
    const ruleAutonomy = matchedRule.autonomyLevel;
    const levelOrder: Record<ZetroAutonomyLevel, number> = {
      manual: 0,
      assisted: 1,
      supervised: 2,
      autonomous: 3,
    };

    if (levelOrder[effectiveLevel] >= levelOrder[ruleAutonomy]) {
      return {
        autonomyLevel: effectiveLevel,
        riskLevel,
        action: "auto_approved",
        reason: matchedRule.reason ?? `Matched rule: ${matchedRule.id}`,
        matchedRule,
      };
    } else {
      return {
        autonomyLevel: effectiveLevel,
        riskLevel,
        action: "requires_approval",
        reason: `Command requires ${ruleAutonomy} level but run is ${effectiveLevel}`,
        matchedRule,
      };
    }
  }

  if (effectiveLevel === "autonomous") {
    return {
      autonomyLevel: effectiveLevel,
      riskLevel,
      action: riskLevel === "high" ? "requires_approval" : "auto_approved",
      reason:
        riskLevel === "high"
          ? "High risk commands require approval even in autonomous mode"
          : "Autonomous mode with no matching rule",
    };
  }

  if (effectiveLevel === "supervised") {
    return {
      autonomyLevel: effectiveLevel,
      riskLevel,
      action:
        riskLevel === "medium" || riskLevel === "high"
          ? "requires_approval"
          : "auto_approved",
      reason:
        riskLevel === "medium" || riskLevel === "high"
          ? "Medium/high risk requires approval in supervised mode"
          : "Supervised mode auto-approves low-risk commands",
    };
  }

  return {
    autonomyLevel: effectiveLevel,
    riskLevel,
    action: "requires_approval",
    reason: "No matching rule found",
  };
}

export function logAutonomyDecision(
  command: string,
  decision: AutonomyDecision,
  runId?: string,
  details?: Record<string, unknown>,
): void {
  if (!autonomyConfig.logAllDecisions && decision.action === "auto_approved") {
    return;
  }

  const entry: ZetroAutonomyLogEntry = {
    id: `autonomy-log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString(),
    runId,
    command,
    autonomyLevel: decision.autonomyLevel,
    riskLevel: decision.riskLevel,
    action: decision.action,
    reason: decision.reason,
    details,
  };

  autonomyLogs.push(entry);
}

export function getAutonomyLogs(runId?: string): ZetroAutonomyLogEntry[] {
  if (runId) {
    return autonomyLogs.filter((log) => log.runId === runId);
  }
  return [...autonomyLogs];
}

export function getAutonomyStats(): {
  total: number;
  byAction: Record<ZetroAutonomyLogEntry["action"], number>;
  byAutonomyLevel: Record<ZetroAutonomyLevel, number>;
  byRiskLevel: Record<ZetroRiskLevel, number>;
} {
  const stats = {
    total: autonomyLogs.length,
    byAction: {
      auto_approved: 0,
      requires_approval: 0,
      blocked: 0,
      manual_approved: 0,
      manual_rejected: 0,
    } as Record<ZetroAutonomyLogEntry["action"], number>,
    byAutonomyLevel: {
      manual: 0,
      assisted: 0,
      supervised: 0,
      autonomous: 0,
    } as Record<ZetroAutonomyLevel, number>,
    byRiskLevel: {
      none: 0,
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    } as Record<ZetroRiskLevel, number>,
  };

  for (const log of autonomyLogs) {
    stats.byAction[log.action]++;
    stats.byAutonomyLevel[log.autonomyLevel]++;
    stats.byRiskLevel[log.riskLevel]++;
  }

  return stats;
}

export function clearAutonomyLogs(runId?: string): number {
  if (runId) {
    const initialLength = autonomyLogs.length;
    const filtered = autonomyLogs.filter((log) => log.runId !== runId);
    const removed = initialLength - filtered.length;
    autonomyLogs.length = 0;
    autonomyLogs.push(...filtered);
    return removed;
  }
  const count = autonomyLogs.length;
  autonomyLogs.length = 0;
  return count;
}

export function getAutonomyLevelSummary(level: ZetroAutonomyLevel): string {
  return ZETRO_AUTONOMY_LEVEL_SUMMARY[level];
}

export function getRiskLevelSummary(level: ZetroRiskLevel): string {
  return ZETRO_RISK_LEVEL_SUMMARY[level];
}

export function validateCommandAgainstPolicy(command: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!command || command.trim().length === 0) {
    errors.push("Command cannot be empty");
  }

  const blockedPatterns = [
    { pattern: /^sudo /, message: "Sudo commands are blocked" },
    { pattern: /^su /, message: "Switch user commands are blocked" },
  ];

  for (const { pattern, message } of blockedPatterns) {
    if (pattern.test(command)) {
      errors.push(message);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
