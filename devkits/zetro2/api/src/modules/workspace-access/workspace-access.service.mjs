// Workspace Access Service
// Encapsulates authentication, session expiration, workspace selection, and membership management

import {
  canAssignRole,
  canManageMembership,
  isValidRole,
  ROLE_PRESET_METADATA,
} from './membership-contracts.mjs';
import { ROLE_DEFAULT_GRANTS } from './capability-grants.mjs';

export class WorkspaceAccessService {
  #store;
  #accessModule;
  #clock;

  constructor({ store, accessModule, clock = null }) {
    this.#store = store;
    this.#accessModule = accessModule;
    this.#clock = clock;
  }

  get store() {
    return this.#store;
  }

  get accessModule() {
    return this.#accessModule;
  }

  #getNowEpochSeconds() {
    if (this.#clock && typeof this.#clock.now === 'function') {
      return Math.floor(this.#clock.now().getTime() / 1000);
    }
    return Math.floor(Date.now() / 1000);
  }

  // 1. Login
  async login({ userId, email = null, name = null, workspaceId = null, ttlSeconds = 28800 }) {
    if (!userId) {
      throw new Error('User ID is required for authentication');
    }

    // If workspaceId is not specified, find user's accessible workspaces, or default
    let targetWorkspaceId = workspaceId;
    let targetRole = null;

    if (targetWorkspaceId) {
      const membership = await this.#store.repository.getMembership(targetWorkspaceId, userId);
      if (!membership) {
        throw new Error(`User "${userId}" does not have membership in workspace "${targetWorkspaceId}"`);
      }
      targetRole = membership.role;
    } else {
      // Find all memberships for this user
      const workspaces = await this.#store.repository.listWorkspaces();
      for (const ws of workspaces) {
        const mem = await this.#store.repository.getMembership(ws.id, userId);
        if (mem) {
          targetWorkspaceId = ws.id;
          targetRole = mem.role;
          break;
        }
      }

      // If still no membership, fall back to default workspace if user is admin or create a viewer membership
      if (!targetWorkspaceId) {
        targetWorkspaceId = 'ws-default';
        const defaultMem = await this.#store.repository.getMembership('ws-default', userId);
        if (defaultMem) {
          targetRole = defaultMem.role;
        } else {
          // If workspace exists, grant Viewer
          const ws = await this.#store.repository.getWorkspaceById('ws-default');
          if (ws) {
            const newMem = await this.#store.repository.createMembership({
              workspaceId: 'ws-default',
              userId,
              role: 'Viewer',
              grantedBy: 'system',
              nowEpochSeconds: this.#getNowEpochSeconds(),
            });
            targetRole = newMem.role;
          } else {
            throw new Error('No default workspace available');
          }
        }
      }
    }

    const ws = await this.#store.repository.getWorkspaceById(targetWorkspaceId);
    if (!ws) {
      throw new Error(`Workspace "${targetWorkspaceId}" not found`);
    }

    // Create session via AccessModule
    const { session, token } = this.#accessModule.createAuthenticatedSession({
      actorId: userId,
      workspaceId: targetWorkspaceId,
      role: targetRole,
      ttlSeconds,
    });

    // Record audit log
    await this.#store.repository.recordAuditLog({
      workspaceId: targetWorkspaceId,
      actorId: userId,
      action: 'auth.login',
      targetType: 'session',
      targetId: session.id,
      details: { role: targetRole, email },
      nowEpochSeconds: this.#getNowEpochSeconds(),
    });

    const user = {
      id: userId,
      email: email || `${userId}@codexsun.local`,
      name: name || userId,
      role: targetRole,
      capabilities: ROLE_DEFAULT_GRANTS[targetRole] || [],
    };

    return {
      token,
      session,
      user,
      workspace: ws,
    };
  }

  // 2. Logout
  async logout({ sessionId, actorId, workspaceId = null }) {
    if (!sessionId) {
      throw new Error('Session ID is required for logout');
    }

    this.#accessModule.session.revokeSession(sessionId, 'manual_logout');

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId: actorId || 'anonymous',
      action: 'auth.logout',
      targetType: 'session',
      targetId: sessionId,
      details: { reason: 'manual_logout' },
      nowEpochSeconds: this.#getNowEpochSeconds(),
    });

    return { success: true };
  }

  // 3. Authenticate Request & Verify Session Expiration
  async authenticateToken(token) {
    if (!token) {
      throw new Error('Authorization token is required');
    }

    const claims = this.#accessModule.authenticateToken(token);
    const { subject: userId, sessionId } = claims;

    const session = this.#accessModule.session.getSession(sessionId);
    if (!session || session.status !== 'active') {
      throw new Error('Session expired or revoked');
    }

    const workspaceId = session.workspaceId;
    const membership = workspaceId
      ? await this.#store.repository.getMembership(workspaceId, userId)
      : null;
    const role = membership?.role || session.role || 'Viewer';

    const actor = {
      id: userId,
      sessionId,
      workspaceId,
      role,
      capabilities: ROLE_DEFAULT_GRANTS[role] || [],
    };

    return { actor, session };
  }

  // 4. Workspace Selection
  async selectWorkspace({ actorId, currentSessionId, targetWorkspaceId, ttlSeconds = 28800 }) {
    if (!targetWorkspaceId) {
      throw new Error('Target workspace ID is required');
    }

    const ws = await this.#store.repository.getWorkspaceById(targetWorkspaceId);
    if (!ws) {
      throw new Error(`Workspace "${targetWorkspaceId}" not found`);
    }

    const membership = await this.#store.repository.getMembership(targetWorkspaceId, actorId);
    if (!membership) {
      throw new Error(`User "${actorId}" does not have access to workspace "${targetWorkspaceId}"`);
    }

    // Revoke old session if active
    if (currentSessionId) {
      try {
        this.#accessModule.session.revokeSession(currentSessionId, 'switch_workspace');
      } catch (_) {
        // Ignore if already inactive
      }
    }

    // Create new session for selected workspace
    const { session, token } = this.#accessModule.createAuthenticatedSession({
      actorId,
      workspaceId: targetWorkspaceId,
      role: membership.role,
      ttlSeconds,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId: targetWorkspaceId,
      actorId,
      action: 'workspace.select',
      targetType: 'workspace',
      targetId: targetWorkspaceId,
      details: { role: membership.role, newSessionId: session.id },
      nowEpochSeconds: this.#getNowEpochSeconds(),
    });

    return {
      token,
      session,
      workspace: ws,
      role: membership.role,
      capabilities: ROLE_DEFAULT_GRANTS[membership.role] || [],
    };
  }

  // 5. List Workspaces For User
  async listUserWorkspaces(userId) {
    const allWorkspaces = await this.#store.repository.listWorkspaces();
    const userWorkspaces = [];

    for (const ws of allWorkspaces) {
      const mem = await this.#store.repository.getMembership(ws.id, userId);
      if (mem) {
        userWorkspaces.push({
          workspace: ws,
          membership: mem,
          rolePreset: ROLE_PRESET_METADATA[mem.role] || null,
        });
      }
    }

    return userWorkspaces;
  }

  // 6. Create Workspace
  async createWorkspace({ actorId, slug, name, description = null, rootPath }) {
    const now = this.#getNowEpochSeconds();
    const ws = await this.#store.repository.createWorkspace({
      slug,
      name,
      description,
      rootPath,
      ownerUserId: actorId,
      nowEpochSeconds: now,
    });

    // Owner membership
    const membership = await this.#store.repository.createMembership({
      workspaceId: ws.id,
      userId: actorId,
      role: 'Owner',
      grantedBy: actorId,
      nowEpochSeconds: now,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId: ws.id,
      actorId,
      action: 'workspace.create',
      targetType: 'workspace',
      targetId: ws.id,
      details: { slug, name },
      nowEpochSeconds: now,
    });

    return { workspace: ws, membership };
  }

  // 7. Membership Management: List Members
  async listMembers({ actorId, workspaceId }) {
    const mem = await this.#store.repository.getMembership(workspaceId, actorId);
    if (!mem) {
      throw new Error('Forbidden: You are not a member of this workspace');
    }

    return this.#store.repository.listMemberships(workspaceId);
  }

  // 8. Membership Management: Invite / Add Member
  async addMember({ actorId, workspaceId, targetUserId, role }) {
    if (!isValidRole(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const actorMem = await this.#store.repository.getMembership(workspaceId, actorId);
    if (!actorMem) {
      throw new Error('Forbidden: You are not a member of this workspace');
    }

    if (!canManageMembership(actorMem.role)) {
      throw new Error(`Forbidden: Role "${actorMem.role}" cannot manage workspace memberships`);
    }

    if (!canAssignRole(actorMem.role, role)) {
      throw new Error(`Forbidden: Role "${actorMem.role}" cannot assign role "${role}"`);
    }

    const existing = await this.#store.repository.getMembership(workspaceId, targetUserId);
    if (existing) {
      throw new Error(`User "${targetUserId}" is already a member of this workspace`);
    }

    const now = this.#getNowEpochSeconds();
    const membership = await this.#store.repository.createMembership({
      workspaceId,
      userId: targetUserId,
      role,
      grantedBy: actorId,
      nowEpochSeconds: now,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId,
      action: 'membership.add',
      targetType: 'membership',
      targetId: membership.id,
      details: { targetUserId, role },
      nowEpochSeconds: now,
    });

    return membership;
  }

  // 9. Membership Management: Update Role
  async updateMemberRole({ actorId, workspaceId, targetUserId, newRole }) {
    if (!isValidRole(newRole)) {
      throw new Error(`Invalid role: ${newRole}`);
    }

    const actorMem = await this.#store.repository.getMembership(workspaceId, actorId);
    if (!actorMem) {
      throw new Error('Forbidden: You are not a member of this workspace');
    }

    if (!canManageMembership(actorMem.role)) {
      throw new Error(`Forbidden: Role "${actorMem.role}" cannot manage workspace memberships`);
    }

    if (!canAssignRole(actorMem.role, newRole)) {
      throw new Error(`Forbidden: Role "${actorMem.role}" cannot assign role "${newRole}"`);
    }

    const targetMem = await this.#store.repository.getMembership(workspaceId, targetUserId);
    if (!targetMem) {
      throw new Error(`User "${targetUserId}" is not a member of this workspace`);
    }

    // Cannot demote another Owner if not higher rank
    if (targetMem.role === 'Owner' && actorId !== targetUserId) {
      throw new Error('Forbidden: Cannot modify an Owner membership');
    }

    const now = this.#getNowEpochSeconds();
    const updated = await this.#store.repository.updateMembershipRole(
      workspaceId,
      targetUserId,
      newRole,
      actorId,
      now
    );

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId,
      action: 'membership.update_role',
      targetType: 'membership',
      targetId: targetMem.id,
      details: { targetUserId, oldRole: targetMem.role, newRole },
      nowEpochSeconds: now,
    });

    return updated;
  }

  // 10. Membership Management: Remove Member
  async removeMember({ actorId, workspaceId, targetUserId }) {
    const actorMem = await this.#store.repository.getMembership(workspaceId, actorId);
    if (!actorMem) {
      throw new Error('Forbidden: You are not a member of this workspace');
    }

    // Users can leave a workspace themselves, otherwise requires membership.manage
    const isSelf = actorId === targetUserId;
    if (!isSelf && !canManageMembership(actorMem.role)) {
      throw new Error(`Forbidden: Role "${actorMem.role}" cannot remove members`);
    }

    const targetMem = await this.#store.repository.getMembership(workspaceId, targetUserId);
    if (!targetMem) {
      throw new Error(`User "${targetUserId}" is not a member of this workspace`);
    }

    if (targetMem.role === 'Owner') {
      // Check if there are other owners
      const allMembers = await this.#store.repository.listMemberships(workspaceId);
      const owners = allMembers.filter((m) => m.role === 'Owner');
      if (owners.length <= 1) {
        throw new Error('Forbidden: Cannot remove the last Owner of a workspace');
      }
    }

    const removed = await this.#store.repository.removeMembership(workspaceId, targetUserId);

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId,
      action: 'membership.remove',
      targetType: 'membership',
      targetId: targetMem.id,
      details: { targetUserId, removedBy: actorId },
      nowEpochSeconds: this.#getNowEpochSeconds(),
    });

    return { removed };
  }
}

export function createWorkspaceAccessService(options) {
  return new WorkspaceAccessService(options);
}
