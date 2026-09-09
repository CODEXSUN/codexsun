import type { SystemTaskDetail } from '../system-tasks'

export function createAutomationSupervisorPrompt(task: SystemTaskDetail): string {
  const evidence = task.steps.map((step) => `- ${step.status}: ${step.message}`).join('\n')
  return [
    'Diagnose this failed deterministic Zetro automation run.',
    '',
    `Run: ${task.title}`,
    `Run ID: ${task.id}`,
    `Type: ${task.type}`,
    `Status: ${task.status}`,
    `Error: ${task.error ?? 'No explicit error was recorded.'}`,
    '',
    'Recorded steps:',
    evidence || '- No steps were recorded.',
    '',
    'Inspect the repository-owned script and its diagnostic evidence. Do not rerun the workflow,',
    'commit, push, publish, delete, or clean files. Explain the cause and propose the smallest',
    'script fix with tests. Wait for review before making changes.',
  ].join('\n')
}
