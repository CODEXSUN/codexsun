export type ZetroAutonomyLevel =
  | "manual"
  | "assisted"
  | "supervised"
  | "autonomous";

export type ZetroRiskLevel = "none" | "low" | "medium" | "high" | "critical";

export type ZetroAutoApproveRule = {
  id: string;
  pattern: string;
  autonomyLevel: ZetroAutonomyLevel;
  reason?: string;
};

export type ZetroAutonomyLogEntry = {
  id: string;
  timestamp: string;
  runId?: string;
  command: string;
  autonomyLevel: ZetroAutonomyLevel;
  riskLevel: ZetroRiskLevel;
  action:
    | "auto_approved"
    | "requires_approval"
    | "blocked"
    | "manual_approved"
    | "manual_rejected";
  reason: string;
  details?: Record<string, unknown>;
};

export type ZetroAutonomyConfig = {
  defaultLevel: ZetroAutonomyLevel;
  rules: ZetroAutoApproveRule[];
  overrideRequiresApproval: boolean;
  logAllDecisions: boolean;
};

export const ZETRO_AUTONOMY_LEVEL_SUMMARY: Record<ZetroAutonomyLevel, string> =
  {
    manual: "All commands require explicit approval",
    assisted: "Low-risk auto-approved, high-risk needs approval",
    supervised: "Auto-run with live operator monitoring",
    autonomous: "Auto-run with post-run review",
  };

export const ZETRO_RISK_LEVEL_SUMMARY: Record<ZetroRiskLevel, string> = {
  none: "No risk",
  low: "Read-only, no side effects",
  medium: "May modify files, reversible",
  high: "Destructive or hard to reverse",
  critical: "System-level, irreversible",
};

export const DEFAULT_AUTONOMY_CONFIG: ZetroAutonomyConfig = {
  defaultLevel: "manual",
  overrideRequiresApproval: true,
  logAllDecisions: true,
  rules: [
    {
      id: "git-status",
      pattern: "^git (status|log|diff|show|branch)$",
      autonomyLevel: "assisted",
      reason: "Read-only git commands",
    },
    {
      id: "git-fetch-pull",
      pattern: "^git (fetch|pull)$",
      autonomyLevel: "assisted",
      reason: "Network operations but safe",
    },
    {
      id: "npm-build-test",
      pattern: "^npm (run )?(build|test|lint|typecheck)$",
      autonomyLevel: "assisted",
      reason: "Safe development commands",
    },
    {
      id: "ls-cat-head-tail",
      pattern: "^(ls|cd|cat|head|tail|grep|find|wc)$",
      autonomyLevel: "assisted",
      reason: "Read-only file operations",
    },
    {
      id: "npm-install",
      pattern: "^npm install",
      autonomyLevel: "supervised",
      reason: "Modifies node_modules",
    },
    {
      id: "git-commit",
      pattern: "^git commit",
      autonomyLevel: "autonomous",
      reason: "Creates commits with approval history",
    },
    {
      id: "git-push",
      pattern: "^git push",
      autonomyLevel: "manual",
      reason: "Remote changes require explicit approval",
    },
    {
      id: "npm-run-dev",
      pattern: "^npm (run )?dev",
      autonomyLevel: "assisted",
      reason: "Local development server",
    },
    {
      id: "tsc",
      pattern: "^tsc",
      autonomyLevel: "assisted",
      reason: "Type checking only",
    },
    {
      id: "rm-rf",
      pattern: "^rm (-rf|-r)?",
      autonomyLevel: "manual",
      reason: "Destructive file operations",
    },
    {
      id: "docker",
      pattern: "^docker (run|rm|rmi|prune)$",
      autonomyLevel: "manual",
      reason: "Container operations can be destructive",
    },
    {
      id: "drop-table",
      pattern: "^DROP (TABLE|DATABASE)",
      autonomyLevel: "manual",
      reason: "Database destruction",
    },
    {
      id: "delete-files",
      pattern: "^(del|rmdir|rm -rf|mkfs|dd|fdisk)$",
      autonomyLevel: "manual",
      reason: "System-level destructive commands",
    },
  ],
};

export function classifyRiskLevel(command: string): ZetroRiskLevel {
  const lowerCommand = command.toLowerCase();

  if (
    lowerCommand.match(
      /^(sudo|su|chmod|chown|chgrp|mount|umount|init|shutdown|reboot|halt)$/,
    )
  ) {
    return "critical";
  }

  if (
    lowerCommand.match(/^rm (-rf)?/) ||
    lowerCommand.match(/del |^del |rmdir|rm -rf/) ||
    lowerCommand.match(/^dd /) ||
    lowerCommand.match(/^fdisk/) ||
    lowerCommand.match(/^mkfs/)
  ) {
    return "critical";
  }

  if (
    lowerCommand.match(/^drop table/) ||
    lowerCommand.match(/^drop database/) ||
    lowerCommand.match(/^delete from.*where/) ||
    lowerCommand.match(/truncate/)
  ) {
    return "critical";
  }

  if (
    lowerCommand.match(/^docker (rm|rmi|prune)/) ||
    lowerCommand.match(/^git push/) ||
    lowerCommand.match(/^git reset --hard/) ||
    lowerCommand.match(/^git push --force/)
  ) {
    return "high";
  }

  if (
    lowerCommand.match(/^npm install/) ||
    lowerCommand.match(/^npm uninstall/) ||
    lowerCommand.match(/^yarn (add|remove)/) ||
    lowerCommand.match(/^docker build/) ||
    lowerCommand.match(/^docker run/)
  ) {
    return "medium";
  }

  if (
    lowerCommand.match(/^npm run/) ||
    lowerCommand.match(/^npx/) ||
    lowerCommand.match(/^tsc/) ||
    lowerCommand.match(/^git commit/) ||
    lowerCommand.match(/^git add/)
  ) {
    return "low";
  }

  if (
    lowerCommand.match(/^git (status|log|diff|show|branch|fetch|pull)/) ||
    lowerCommand.match(/^ls|^cd|^cat|^head|^tail|^grep|^find|^wc|^pwd/)
  ) {
    return "none";
  }

  return "medium";
}
