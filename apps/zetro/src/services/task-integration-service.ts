import type { Kysely } from "kysely";

import type { ZetroFinding } from "./finding-service.js";
import {
  ZETRO_TASK_TEMPLATES,
  ZETRO_TASK_SYNC_RULES,
  determineTaskAction,
  getTaskTemplate,
  type ZetroTaskTemplateId,
  type ZetroTaskPriority,
  type ZetroFindingToTaskMapping,
  type ZetroTaskCreateInput,
  type ZetroTaskSyncRule,
} from "./task-integration-types.js";

const findingTaskLinks: ZetroFindingToTaskMapping[] = [];

export type ZetroTaskIntegrationResult = {
  success: boolean;
  taskId?: string;
  linkId?: string;
  error?: string;
  action: ZetroTaskSyncRule["action"];
  templateId: ZetroTaskTemplateId;
  message?: string;
};

export async function createTaskFromFinding(
  _database: Kysely<unknown>,
  finding: ZetroFinding,
  templateId?: ZetroTaskTemplateId,
): Promise<ZetroTaskIntegrationResult> {
  const template = templateId
    ? getTaskTemplate(templateId)
    : determineTaskAction(finding.severity, finding.category)?.templateId
      ? getTaskTemplate(
          determineTaskAction(finding.severity, finding.category)!.templateId,
        )
      : getTaskTemplate("general");

  if (!template) {
    return {
      success: false,
      error: `Template not found: ${templateId ?? "general"}`,
      action: "manual_only",
      templateId: "general",
    };
  }

  const action = determineTaskAction(finding.severity, finding.category);

  const taskTitle = `[Zetro Finding] ${finding.title}`;
  const taskDescription = buildTaskDescription(finding, template);

  const existingLink = findingTaskLinks.find((l) => l.findingId === finding.id);
  if (existingLink) {
    return {
      success: true,
      taskId: existingLink.taskId,
      linkId: existingLink.id,
      action: action?.action ?? "manual_only",
      templateId: template.id,
      message: `Finding already linked to task: ${existingLink.taskId}`,
    };
  }

  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const link: ZetroFindingToTaskMapping = {
    id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    findingId: finding.id,
    taskId,
    templateId: template.id,
    createdAt: new Date().toISOString(),
    syncStatus: "synced",
  };

  findingTaskLinks.push(link);

  return {
    success: true,
    taskId,
    linkId: link.id,
    action: action?.action ?? "manual_only",
    templateId: template.id,
    message: `Task created from finding: ${taskId}`,
  };
}

export function linkFindingToTask(
  findingId: string,
  taskId: string,
  templateId: ZetroTaskTemplateId = "general",
): ZetroFindingToTaskMapping {
  const existingIndex = findingTaskLinks.findIndex(
    (l) => l.findingId === findingId,
  );
  if (existingIndex !== -1) {
    return findingTaskLinks[existingIndex]!;
  }

  const link: ZetroFindingToTaskMapping = {
    id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    findingId,
    taskId,
    templateId,
    createdAt: new Date().toISOString(),
    syncStatus: "synced",
  };

  findingTaskLinks.push(link);
  return link;
}

export function unlinkFindingFromTask(findingId: string): boolean {
  const index = findingTaskLinks.findIndex((l) => l.findingId === findingId);
  if (index !== -1) {
    findingTaskLinks.splice(index, 1);
    return true;
  }
  return false;
}

export function getTaskLinksForFinding(
  findingId: string,
): ZetroFindingToTaskMapping[] {
  return findingTaskLinks.filter((l) => l.findingId === findingId);
}

export function getFindingLinksForTask(
  taskId: string,
): ZetroFindingToTaskMapping[] {
  return findingTaskLinks.filter((l) => l.taskId === taskId);
}

export function getAllTaskLinks(): ZetroFindingToTaskMapping[] {
  return [...findingTaskLinks];
}

export function suggestTaskForFinding(finding: ZetroFinding): {
  shouldSuggest: boolean;
  templateId: ZetroTaskTemplateId;
  priority: ZetroTaskPriority;
  reason: string;
} {
  const action = determineTaskAction(finding.severity, finding.category);

  if (!action) {
    return {
      shouldSuggest: false,
      templateId: "general",
      priority: "medium",
      reason: "No matching sync rule found",
    };
  }

  if (action.action === "auto_create") {
    return {
      shouldSuggest: true,
      templateId: action.templateId,
      priority: action.priority,
      reason: `Auto-create: ${finding.severity} ${finding.category ?? ""} finding`,
    };
  }

  if (action.action === "suggest") {
    return {
      shouldSuggest: true,
      templateId: action.templateId,
      priority: action.priority,
      reason: `Suggested: ${finding.severity} ${finding.category ?? ""} finding`,
    };
  }

  return {
    shouldSuggest: false,
    templateId: action.templateId,
    priority: action.priority,
    reason: "Manual only: no auto-action for this finding type",
  };
}

export function buildTaskDescription(
  finding: ZetroFinding,
  template: {
    id: ZetroTaskTemplateId;
    name: string;
    fields: Array<{ key: string; label: string }>;
  },
): string {
  const sections: string[] = [
    `# ${template.name}`,
    "",
    `## Source Finding`,
    `**ID:** ${finding.id}`,
    `**Severity:** ${finding.severity}`,
    `**Category:** ${finding.category}`,
    `**Confidence:** ${finding.confidence}%`,
    `**Status:** ${finding.status}`,
    "",
    `## Finding Summary`,
    finding.summary,
    "",
  ];

  if (template.id === "bug-fix") {
    sections.push("## Steps to Reproduce", "[To be completed]", "");
    sections.push("## Expected Behavior", "[To be completed]", "");
    sections.push("## Actual Behavior", "[To be completed]", "");
  }

  if (template.id === "security-fix") {
    sections.push("## Vulnerability Details", "[To be completed]", "");
    sections.push("## Affected Components", "[To be completed]", "");
    sections.push("## Remediation Plan", "[To be completed]", "");
  }

  sections.push("## Notes", "Created from Zetro finding.", "");

  return sections.join("\n");
}

export function getAvailableTemplates(): typeof ZETRO_TASK_TEMPLATES {
  return [...ZETRO_TASK_TEMPLATES];
}

export function getAvailableSyncRules(): ZetroTaskSyncRule[] {
  return [...ZETRO_TASK_SYNC_RULES];
}

export function getTaskIntegrationStats(): {
  totalLinks: number;
  byTemplate: Record<ZetroTaskTemplateId, number>;
  bySeverity: Record<string, number>;
} {
  const byTemplate: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  for (const link of findingTaskLinks) {
    byTemplate[link.templateId] = (byTemplate[link.templateId] ?? 0) + 1;
  }

  return {
    totalLinks: findingTaskLinks.length,
    byTemplate: byTemplate as Record<ZetroTaskTemplateId, number>,
    bySeverity,
  };
}

export function clearTaskLinks(findingId?: string): number {
  if (findingId) {
    const initialLength = findingTaskLinks.length;
    const filtered = findingTaskLinks.filter((l) => l.findingId !== findingId);
    const removed = initialLength - filtered.length;
    findingTaskLinks.length = 0;
    findingTaskLinks.push(...filtered);
    return removed;
  }

  const count = findingTaskLinks.length;
  findingTaskLinks.length = 0;
  return count;
}
