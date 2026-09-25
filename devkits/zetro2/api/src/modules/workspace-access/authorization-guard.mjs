// Server-Enforced Workspace Authorization Guard
// Enforces server-resolved membership and capability authorization on API resources and event subscriptions.
// Never trusts client-supplied roles or permissions.

import { CapabilityEvaluator, ROLE_DEFAULT_GRANTS } from './capability-grants.mjs';

export class WorkspaceAuthorizationGuard {
  #service;
  #store;
  #accessModule;

  constructor({ service, store, accessModule }) {
    this.#service = service;
    this.#store = store || service.store;
    this.#accessModule = accessModule || service.accessModule;
  }

  get service() {
    return this.#service;
  }

  // 1. Authorize an HTTP Request for a specific workspace and required capability
  async authorizeRequest(
    token,
    { workspaceId, requiredCapability = 'workspace.read', context = {} } = {}
  ) {
    if (!token || token === 'undefined' || token === 'null') {
      const err = new Error('Authentication required: Missing or empty token');
      err.statusCode = 401;
      throw err;
    }

    // Authenticate token and verify session vitality
    const { actor } = await this.#service.authenticateToken(token);

    // Target workspace resolution: default to token's active session workspace if not specified
    const targetWorkspaceId = workspaceId || actor.workspaceId;
    if (!targetWorkspaceId) {
      const err = new Error('Bad Request: Workspace ID is required');
      err.statusCode = 400;
      throw err;
    }

    // Server-resolved membership check (NEVER trust client-provided role or claims)
    const membership = await this.#store.repository.getMembership(targetWorkspaceId, actor.id);
    if (!membership) {
      const err = new Error(
        `Forbidden: User "${actor.id}" does not hold membership in workspace "${targetWorkspaceId}"`
      );
      err.statusCode = 403;
      throw err;
    }

    // Verify workspace existence
    const workspace = await this.#store.repository.getWorkspaceById(targetWorkspaceId);
    if (!workspace) {
      const err = new Error(`Not Found: Workspace "${targetWorkspaceId}" does not exist`);
      err.statusCode = 404;
      throw err;
    }

    // Server-enforced capability authorization via CapabilityEvaluator
    const role = membership.role;
    if (requiredCapability) {
      const defaultGrants = ROLE_DEFAULT_GRANTS[role] || [];
      const evaluation = CapabilityEvaluator.evaluate({
        grants: defaultGrants,
        requiredCapability,
        context,
      });

      if (!evaluation.allowed) {
        const err = new Error(
          `Forbidden: Role "${role}" lacks required capability "${requiredCapability}" in workspace "${targetWorkspaceId}"`
        );
        err.statusCode = 403;
        throw err;
      }
    }

    return {
      actorId: actor.id,
      sessionId: actor.sessionId,
      workspaceId: targetWorkspaceId,
      workspace,
      membership,
      role,
      capabilities: ROLE_DEFAULT_GRANTS[role] || [],
    };
  }

  // 2. Authorize an Event Subscription (WebSocket / SSE channel)
  // Channel format conventions: "workspace:{workspaceId}:{resource}" or "system:health"
  async authorizeSubscription(token, channel) {
    if (!channel || typeof channel !== 'string') {
      const err = new Error('Bad Request: Event channel is required');
      err.statusCode = 400;
      throw err;
    }

    // System channels with open read (e.g. system:health)
    if (channel === 'system:health') {
      return { authorized: true, channel, anonymous: true };
    }

    if (!token || token === 'undefined' || token === 'null') {
      const err = new Error('Authentication required: Token required for event subscription');
      err.statusCode = 401;
      throw err;
    }

    // Parse channel pattern: "workspace:<workspaceId>:<topic>"
    const channelParts = channel.split(':');
    if (channelParts[0] === 'workspace') {
      const workspaceId = channelParts[1];
      if (!workspaceId) {
        const err = new Error('Bad Request: Invalid workspace event channel syntax');
        err.statusCode = 400;
        throw err;
      }

      // Check server-resolved membership and 'workspace.read'
      const auth = await this.authorizeRequest(token, {
        workspaceId,
        requiredCapability: 'workspace.read',
      });

      return {
        authorized: true,
        channel,
        actorId: auth.actorId,
        sessionId: auth.sessionId,
        workspaceId: auth.workspaceId,
        role: auth.role,
      };
    }

    // Other private channels require valid authenticated session
    const { actor, session } = await this.#service.authenticateToken(token);
    return {
      authorized: true,
      channel,
      actorId: actor.id,
      sessionId: session.id,
    };
  }
}

export function createWorkspaceAuthorizationGuard(options) {
  return new WorkspaceAuthorizationGuard(options);
}
