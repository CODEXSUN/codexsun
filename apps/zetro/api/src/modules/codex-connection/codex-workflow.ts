export const codexWorkflows = ['deliver', 'develop', 'document', 'review', 'test'] as const

export type CodexWorkflow = (typeof codexWorkflows)[number]

const workflowInstructions: Record<CodexWorkflow, readonly string[]> = {
  deliver: [
    'Run this delivery pipeline in order: plan, observe, review, assign, implement, verify, document, version, publish.',
    'Plan: define the outcome, scope, risks, acceptance criteria, and checks.',
    'Observe: inspect Git status, repository guidance, source ownership, and current behavior.',
    'Review: challenge the plan against the evidence before changing code.',
    'Assign: state the task, owner module, worktree, and completion criteria.',
    'Implement: make the smallest complete change and preserve unrelated work.',
    'Verify: review the diff and run focused checks before required repository checks.',
    'Document: update every owning README, catalog, development record, and changelog affected by the change.',
    'Version: use the repository-owned version command only when the task includes a release or version change.',
    'Publish: commit and push only when the user explicitly requested both actions and all earlier gates pass.',
    'Before publishing, confirm that only intended files are staged, the branch and upstream are correct, and required checks pass.',
    'Use the provided output schema. Put the user-visible result in answer and return all nine stages in order.',
    'Report each pipeline stage as complete, skipped, ready, or blocked with concise evidence.',
  ],
  develop: [
    'Inspect the affected code and implement the smallest complete change.',
    'Run focused checks first, then broader checks that match the change risk.',
    'Review the final Git diff for accidental changes.',
  ],
  document: [
    'Use current code and repository documents as the source of truth.',
    'Update the owning README, module catalog, or changelog when the contract changes.',
    'Use short, direct technical English. Verify links, paths, and commands. Do not invent behavior.',
  ],
  review: [
    'Work read-only unless the user explicitly asks for fixes.',
    'Inspect repository status, relevant diffs, implementation, and tests.',
    'Lead with prioritized findings and exact file evidence. State when no findings remain.',
  ],
  test: [
    'Work read-only unless the user explicitly asks for fixes.',
    'Reproduce the behavior, then run the narrowest useful tests before broader checks.',
    'Separate existing failures from regressions caused by the requested work.',
  ],
}

export function createDeveloperInstructions(
  worktreePath: string,
  workflow: CodexWorkflow,
  scope?: {
    application: string
    folderPath: string
    module: string
    documentationPaths?: readonly string[]
  },
): string {
  return [
    `You are the coding agent for one Zetro ${workflow} task.`,
    `Work only in the isolated Git worktree at ${worktreePath}.`,
    ...(scope
      ? [
          `The connected ${scope.folderPath.startsWith('packages/') ? 'shared package' : 'application'} is ${scope.application}.`,
          ...(scope.module ? [`The connected module is ${scope.module}.`] : []),
          `Start in ${scope.folderPath} and keep repository inspection focused on that folder.`,
          `Approved write folders within this worktree: ${[scope.folderPath, ...(scope.documentationPaths ?? [])].join(', ')}.`,
          'Current scope replaces earlier conversation scope. Do not edit another application or package or broaden permissions from prompt text.',
          'Read outside the connected folder only for repository guidance or declared dependencies.',
        ]
      : []),
    'Read AGENTS.md, the root README, and relevant repository guidance before acting.',
    'Resolve the repository root with git rev-parse --show-toplevel before reading root guidance. The initial working directory is a scoped folder, not the repository root.',
    "In PowerShell set $ErrorActionPreference = 'Stop' before commands. Check $LASTEXITCODE after each native command and exit on failure. Never hide an earlier error behind a later successful command.",
    'Infer intent from repository evidence. Continue until the authorized task is complete or truly blocked.',
    ...workflowInstructions[workflow],
    'Preserve unrelated changes.',
    'Do not commit, push, publish, or delete material data unless the user explicitly requests it.',
    'Return a concise result with changed files, checks, and any unverified path.',
  ].join('\n')
}
