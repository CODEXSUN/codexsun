export interface ZetroWorkspaceItem {
  id: string;
  name: string;
  route: string;
  summary: string;
}

export const zetroWorkspaceItems: ZetroWorkspaceItem[] = [
  {
    id: "overview",
    name: "Overview",
    route: "/dashboard/apps/zetro",
    summary:
      "Agent operations control room for governed playbooks, review loops, and rollout readiness.",
  },
  {
    id: "claude-analysis",
    name: "Claude Analysis",
    route: "/dashboard/apps/zetro/claude-analysis",
    summary:
      "Assessment of the temp Claude Code plugin model and the patterns worth adapting.",
  },
  {
    id: "playbooks",
    name: "Playbooks",
    route: "/dashboard/apps/zetro/playbooks",
    summary:
      "Candidate command, skill, hook, and review-lane patterns for Codexsun workflows.",
  },
  {
    id: "rollout-plan",
    name: "Rollout Plan",
    route: "/dashboard/apps/zetro/rollout-plan",
    summary:
      "Phased implementation plan for turning the scaffold into an app-owned agent workflow module.",
  },
  {
    id: "runs",
    name: "Runs",
    route: "/dashboard/apps/zetro/runs",
    summary:
      "Manual and supervised workflow runs with output mode, status, and event readiness.",
  },
  {
    id: "findings",
    name: "Findings",
    route: "/dashboard/apps/zetro/findings",
    summary:
      "Review findings grouped by severity, confidence, status, and follow-up readiness.",
  },
  {
    id: "review",
    name: "Review Lanes",
    route: "/dashboard/apps/zetro/review",
    summary:
      "Structured review lanes for organizing AI-generated findings into actionable categories.",
  },
  {
    id: "guardrails",
    name: "Guardrails",
    route: "/dashboard/apps/zetro/guardrails",
    summary:
      "Advisory and blocking rules that keep future agent execution safe and auditable.",
  },
  {
    id: "settings",
    name: "Settings",
    route: "/dashboard/apps/zetro/settings",
    summary:
      "Output defaults, runner mode, approval policy, retention, and CLI allowlist planning.",
  },
];
