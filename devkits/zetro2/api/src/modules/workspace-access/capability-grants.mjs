// Scoped Capability Grants Engine for Zetro2
// Implements granular permission evaluation with resource, tool, path, and budget scoping

import { z } from 'zod';
import minimatch from 'minimatch';

export const CAPABILITY_KEYS = [
  'workspace.read',
  'workspace.write',
  'process.execute',
  'agent.run',
  'change.approve',
  'git.commit',
  'git.push',
  'provider.manage',
  'mcp.manage',
  'browser.use',
  'computer.use',
  'membership.manage',
  'workspace.admin',
];

export const capabilityKeySchema = z.enum(CAPABILITY_KEYS);

export const grantScopeSchema = z.object({
  paths: z.array(z.string()).optional(),
  forbiddenPaths: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  commands: z.array(z.string()).optional(),
  maxExecutionSec: z.number().positive().optional(),
  maxTokens: z.number().positive().optional(),
});

export const scopedGrantSchema = z.object({
  capability: capabilityKeySchema,
  scope: grantScopeSchema.optional(),
  expiresAt: z.number().int().positive().optional(),
});

export const ROLE_DEFAULT_GRANTS = Object.freeze({
  Owner: [
    { capability: 'workspace.read' },
    { capability: 'workspace.write' },
    { capability: 'process.execute' },
    { capability: 'agent.run' },
    { capability: 'change.approve' },
    { capability: 'git.commit' },
    { capability: 'git.push' },
    { capability: 'provider.manage' },
    { capability: 'mcp.manage' },
    { capability: 'browser.use' },
    { capability: 'membership.manage' },
    { capability: 'workspace.admin' },
    // computer.use is deliberately omitted by default; must be explicitly granted
  ],
  Maintainer: [
    { capability: 'workspace.read' },
    { capability: 'workspace.write' },
    { capability: 'process.execute' },
    { capability: 'agent.run' },
    { capability: 'change.approve' },
    { capability: 'git.commit' },
    { capability: 'git.push' },
    { capability: 'provider.manage' },
    { capability: 'mcp.manage' },
    { capability: 'browser.use' },
  ],
  Developer: [
    { capability: 'workspace.read' },
    { capability: 'workspace.write' },
    { capability: 'process.execute' },
    { capability: 'agent.run' },
    { capability: 'change.approve' },
    { capability: 'git.commit' },
    { capability: 'browser.use' },
  ],
  Reviewer: [
    { capability: 'workspace.read' },
    { capability: 'change.approve' },
  ],
  Viewer: [
    { capability: 'workspace.read' },
  ],
});

export class CapabilityEvaluator {
  static evaluate({ grants, requiredCapability, context = {}, nowEpochSeconds = Math.floor(Date.now() / 1000) }) {
    if (!grants || !Array.isArray(grants)) {
      return { allowed: false, reason: 'No grants provided' };
    }

    const matchingGrants = grants.filter(g => g.capability === requiredCapability);
    if (matchingGrants.length === 0) {
      return { allowed: false, reason: `Missing grant for "${requiredCapability}"` };
    }

    // Check expiration and scope constraints on matching grants
    for (const grant of matchingGrants) {
      if (grant.expiresAt && grant.expiresAt <= nowEpochSeconds) {
        continue; // expired
      }

      if (!grant.scope) {
        // Unscoped grant permits all
        return { allowed: true };
      }

      const scope = grant.scope;

      // Check path scoping if context includes a path
      if (context.path) {
        if (scope.forbiddenPaths && scope.forbiddenPaths.length > 0) {
          const isForbidden = scope.forbiddenPaths.some(pattern =>
            minimatch(context.path, pattern, { dot: true })
          );
          if (isForbidden) {
            continue; // this grant doesn't satisfy because path is forbidden
          }
        }

        if (scope.paths && scope.paths.length > 0) {
          const isAllowed = scope.paths.some(pattern =>
            minimatch(context.path, pattern, { dot: true })
          );
          if (!isAllowed) {
            continue; // not in allowed paths
          }
        }
      }

      // Check tool scoping if context includes tool
      if (context.tool && scope.tools && scope.tools.length > 0) {
        const isToolAllowed = scope.tools.some(pattern =>
          minimatch(context.tool, pattern)
        );
        if (!isToolAllowed) {
          continue;
        }
      }

      // Check command scoping if context includes command
      if (context.command && scope.commands && scope.commands.length > 0) {
        const isCommandAllowed = scope.commands.some(prefix =>
          context.command.startsWith(prefix)
        );
        if (!isCommandAllowed) {
          continue;
        }
      }

      // All active scope checks passed for this grant
      return { allowed: true };
    }

    return { allowed: false, reason: `Grant scope constraints not satisfied for "${requiredCapability}"` };
  }
}

export function evaluateGrant(options) {
  return CapabilityEvaluator.evaluate(options);
}
