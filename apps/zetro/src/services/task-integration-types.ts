export type ZetroTaskTemplateId =
  | "security-fix"
  | "performance-fix"
  | "test-coverage"
  | "documentation-update"
  | "bug-fix"
  | "refactor"
  | "general";

export type ZetroTaskPriority = "critical" | "high" | "medium" | "low";

export type ZetroTaskTemplate = {
  id: ZetroTaskTemplateId;
  name: string;
  description: string;
  defaultPriority: ZetroTaskPriority;
  autoCreateOnSeverity?: "critical" | "high";
  suggestOnSeverity?: "high" | "medium";
  fields: ZetroTaskTemplateField[];
};

export type ZetroTaskTemplateField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "number" | "date";
  required: boolean;
  defaultValue?: string;
  options?: string[];
};

export type ZetroFindingToTaskMapping = {
  id: string;
  findingId: string;
  taskId: string;
  templateId: ZetroTaskTemplateId;
  createdAt: string;
  syncStatus: "pending" | "synced" | "error";
};

export type ZetroTaskCreateInput = {
  title: string;
  description: string;
  priority?: ZetroTaskPriority;
  status?: string;
  tags?: string[];
  customFields?: Record<string, string>;
};

export type ZetroTaskSyncRule = {
  id: string;
  findingSeverity: "critical" | "high" | "medium" | "low";
  findingCategory?: string;
  action: "auto_create" | "suggest" | "manual_only";
  templateId: ZetroTaskTemplateId;
  priority?: ZetroTaskPriority;
};

export const ZETRO_TASK_TEMPLATES: ZetroTaskTemplate[] = [
  {
    id: "security-fix",
    name: "Security Fix",
    description: "Template for addressing security vulnerabilities",
    defaultPriority: "critical",
    autoCreateOnSeverity: "critical",
    suggestOnSeverity: "high",
    fields: [
      {
        key: "vulnerability_type",
        label: "Vulnerability Type",
        type: "text",
        required: true,
      },
      {
        key: "cve_id",
        label: "CVE ID (if applicable)",
        type: "text",
        required: false,
      },
      {
        key: "affected_files",
        label: "Affected Files",
        type: "textarea",
        required: true,
      },
      {
        key: "attack_vector",
        label: "Attack Vector",
        type: "textarea",
        required: false,
      },
      {
        key: "remediation_steps",
        label: "Remediation Steps",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "performance-fix",
    name: "Performance Optimization",
    description: "Template for addressing performance issues",
    defaultPriority: "medium",
    autoCreateOnSeverity: "high",
    fields: [
      {
        key: "metric_affected",
        label: "Affected Metric",
        type: "select",
        required: true,
        options: ["latency", "throughput", "memory", "cpu", "database"],
      },
      {
        key: "current_value",
        label: "Current Value",
        type: "text",
        required: true,
      },
      {
        key: "target_value",
        label: "Target Value",
        type: "text",
        required: true,
      },
      {
        key: "profiling_data",
        label: "Profiling Data",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "test-coverage",
    name: "Test Coverage Improvement",
    description: "Template for adding or improving tests",
    defaultPriority: "medium",
    fields: [
      {
        key: "coverage_gap",
        label: "Coverage Gap",
        type: "textarea",
        required: true,
      },
      {
        key: "test_type",
        label: "Test Type Needed",
        type: "select",
        required: true,
        options: ["unit", "integration", "e2e", "performance"],
      },
      {
        key: "affected_module",
        label: "Affected Module",
        type: "text",
        required: true,
      },
    ],
  },
  {
    id: "documentation-update",
    name: "Documentation Update",
    description: "Template for updating documentation",
    defaultPriority: "low",
    fields: [
      {
        key: "doc_type",
        label: "Documentation Type",
        type: "select",
        required: true,
        options: ["README", "API docs", "Internal docs", "Changelog"],
      },
      {
        key: "change_summary",
        label: "Change Summary",
        type: "textarea",
        required: true,
      },
      {
        key: "affected_sections",
        label: "Affected Sections",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "bug-fix",
    name: "Bug Fix",
    description: "Template for fixing general bugs",
    defaultPriority: "high",
    autoCreateOnSeverity: "high",
    suggestOnSeverity: "medium",
    fields: [
      {
        key: "steps_to_reproduce",
        label: "Steps to Reproduce",
        type: "textarea",
        required: true,
      },
      {
        key: "expected_behavior",
        label: "Expected Behavior",
        type: "textarea",
        required: true,
      },
      {
        key: "actual_behavior",
        label: "Actual Behavior",
        type: "textarea",
        required: true,
      },
      {
        key: "environment",
        label: "Environment",
        type: "text",
        required: false,
      },
    ],
  },
  {
    id: "refactor",
    name: "Code Refactoring",
    description: "Template for code refactoring tasks",
    defaultPriority: "medium",
    fields: [
      {
        key: "refactor_type",
        label: "Refactor Type",
        type: "select",
        required: true,
        options: [
          "extract",
          "inline",
          "rename",
          "simplify",
          "consolidate",
          "other",
        ],
      },
      {
        key: "target_file",
        label: "Target File/Module",
        type: "text",
        required: true,
      },
      {
        key: "reason",
        label: "Reason for Refactor",
        type: "textarea",
        required: true,
      },
    ],
  },
  {
    id: "general",
    name: "General Task",
    description: "Generic task template for any purpose",
    defaultPriority: "medium",
    fields: [
      {
        key: "details",
        label: "Task Details",
        type: "textarea",
        required: true,
      },
    ],
  },
];

export const ZETRO_TASK_SYNC_RULES: ZetroTaskSyncRule[] = [
  {
    id: "security-critical",
    findingSeverity: "critical",
    findingCategory: "security",
    action: "auto_create",
    templateId: "security-fix",
    priority: "critical",
  },
  {
    id: "security-high",
    findingSeverity: "high",
    findingCategory: "security",
    action: "suggest",
    templateId: "security-fix",
    priority: "high",
  },
  {
    id: "bug-critical",
    findingSeverity: "critical",
    findingCategory: "bug",
    action: "auto_create",
    templateId: "bug-fix",
    priority: "critical",
  },
  {
    id: "bug-high",
    findingSeverity: "high",
    findingCategory: "bug",
    action: "suggest",
    templateId: "bug-fix",
    priority: "high",
  },
  {
    id: "performance-high",
    findingSeverity: "high",
    findingCategory: "performance",
    action: "auto_create",
    templateId: "performance-fix",
    priority: "high",
  },
  {
    id: "test-medium",
    findingSeverity: "medium",
    findingCategory: "testing",
    action: "suggest",
    templateId: "test-coverage",
    priority: "medium",
  },
  {
    id: "documentation-low",
    findingSeverity: "low",
    findingCategory: "documentation",
    action: "suggest",
    templateId: "documentation-update",
    priority: "low",
  },
];

export function getTaskTemplate(
  templateId: ZetroTaskTemplateId,
): ZetroTaskTemplate | undefined {
  return ZETRO_TASK_TEMPLATES.find((t) => t.id === templateId);
}

export function getTaskSyncRules(
  severity?: string,
  category?: string,
): ZetroTaskSyncRule[] {
  return ZETRO_TASK_SYNC_RULES.filter((rule) => {
    if (severity && rule.findingSeverity !== severity) return false;
    if (category && rule.findingCategory && rule.findingCategory !== category)
      return false;
    return true;
  });
}

export function determineTaskAction(
  severity: string,
  category?: string,
): {
  action: ZetroTaskSyncRule["action"];
  templateId: ZetroTaskTemplateId;
  priority: ZetroTaskPriority;
} | null {
  const matchingRule = ZETRO_TASK_SYNC_RULES.find((rule) => {
    if (rule.findingSeverity !== severity) return false;
    if (category && rule.findingCategory && rule.findingCategory !== category)
      return false;
    return true;
  });

  if (!matchingRule) {
    return {
      action: "manual_only",
      templateId: "general",
      priority: "medium",
    };
  }

  return {
    action: matchingRule.action,
    templateId: matchingRule.templateId,
    priority: matchingRule.priority ?? "medium",
  };
}
