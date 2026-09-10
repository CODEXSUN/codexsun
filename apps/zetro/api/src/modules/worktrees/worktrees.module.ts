import type { FastifyInstance } from 'fastify'
import type { CodexWorktreeService } from '../codex-connection/index.js'
import { registerWorktreeRoutes } from './worktrees.routes.js'

export const worktreesModuleManifest = {
  capabilities: ['worktree-inventory', 'worktree-disk-usage', 'safe-cleanup', 'retention-sweep'],
  dependencies: { 'zetro.codex-connection.api': '^0.9.0' },
  id: 'zetro.worktrees.api',
  lifecycle: {
    activate: 'Register worktree inventory and cleanup routes.',
    deactivate: 'Stop accepting cleanup requests.',
    install: 'No worktree is created until a conversation starts.',
    uninstall: 'Preserve worktrees until an explicit cleanup request.',
    upgrade: 'Add safe clean-worktree removal and retention sweeps.',
  },
  publicContracts: ['/api/v1/worktrees/*'],
  scope: 'zetro-api',
  version: '1.0.0',
} as const

export async function registerWorktreesModule(
  server: FastifyInstance,
  worktrees: CodexWorktreeService,
): Promise<void> {
  await registerWorktreeRoutes(server, worktrees)
}
