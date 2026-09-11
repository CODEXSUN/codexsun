export const codingWorkerWebModuleManifest = {
  capabilities: ['worker-handoff', 'worker-attempt-registry', 'tool-profile-disclosure'],
  dependencies: { 'zetro.agent-tasks.web': '^1.2.0', 'zetro.coding-workers.api': '^1.0.0' },
  id: 'zetro.coding-workers.web',
  scope: 'zetro-web',
  version: '1.0.0',
} as const
