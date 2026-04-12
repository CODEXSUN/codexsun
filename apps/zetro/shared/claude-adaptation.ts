export type ZetroClaudeSignal = {
  id: string
  label: string
  source: string
  adaption: string
}

export type ZetroRolloutStep = {
  id: string
  label: string
  scope: string
  exitCheck: string
}

export const zetroClaudeSignals: ZetroClaudeSignal[] = [
  {
    id: "plugin-contract",
    label: "Plugin contract",
    source: "Claude Code plugins use a predictable package shape: metadata, commands, agents, skills, hooks, and optional MCP configuration.",
    adaption: "Model Zetro playbooks as app-owned records with explicit command, review, guardrail, and integration lanes instead of copying plugin files into the suite.",
  },
  {
    id: "feature-dev-flow",
    label: "Feature workflow",
    source: "The feature-dev plugin is organized around discovery, code exploration, questions, architecture, implementation, review, and summary.",
    adaption: "Turn the seven-phase sequence into a governed Codexsun delivery checklist that can attach to Task and CRM follow-up work later.",
  },
  {
    id: "review-agents",
    label: "Review lanes",
    source: "The code-review and PR review examples split review into focused agents for bugs, tests, comments, type design, and simplification.",
    adaption: "Expose separate review intents in Zetro first; only add automated execution after the repo has persisted run history and approval controls.",
  },
  {
    id: "hook-guardrails",
    label: "Guardrails",
    source: "Hookify and security-guidance show pre-tool and session-start style checks for unsafe behavior and policy reminders.",
    adaption: "Map guardrails to existing repository rules, AGENTS instructions, and design-system defaults before adding any live blocking hook.",
  },
]

export const zetroRolloutSteps: ZetroRolloutStep[] = [
  {
    id: "phase-1",
    label: "Phase 1",
    scope: "Keep the current scaffold dashboard-only and document the Claude Code patterns that are useful for this suite.",
    exitCheck: "Dashboard route, manifest registration, workspace items, and typecheck pass without new runtime services.",
  },
  {
    id: "phase-2",
    label: "Phase 2",
    scope: "Add app-owned tables for playbooks, run templates, guardrail rules, and review outcomes under apps/zetro/database.",
    exitCheck: "Migrations and seeders run through the framework database path with no cross-app table ownership.",
  },
  {
    id: "phase-3",
    label: "Phase 3",
    scope: "Add internal API routes for reading playbooks and recording supervised workflow runs.",
    exitCheck: "Routes stay mounted through apps/api and enforce the existing cxapp session model.",
  },
  {
    id: "phase-4",
    label: "Phase 4",
    scope: "Integrate with Task for execution follow-ups and with CLI for operator-approved command runners.",
    exitCheck: "No background agent or shell action runs without explicit operator approval and persisted audit output.",
  },
]
