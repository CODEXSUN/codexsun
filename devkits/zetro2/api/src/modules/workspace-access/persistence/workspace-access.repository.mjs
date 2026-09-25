// Workspace Access Repository
// Encapsulates Kysely database operations and enforces Zod data contracts

import { randomUUID } from 'node:crypto';
import {
  createWorkspaceInputSchema,
  createMembershipInputSchema,
  createGrantInputSchema,
  createAuditLogInputSchema,
  createApprovalInputSchema,
  workspaceEntitySchema,
  workspaceMembershipEntitySchema,
  capabilityGrantEntitySchema,
  accessAuditLogEntitySchema,
  actionApprovalEntitySchema,
} from './workspace-access-contracts.mjs';

export class WorkspaceAccessRepository {
  #database;
  #secretsProvider;

  constructor(database, secretsProvider = null) {
    this.#database = database;
    this.#secretsProvider = secretsProvider;
  }

  // Workspaces
  async createWorkspace(input) {
    const validated = createWorkspaceInputSchema.parse(input);
    const now = validated.nowEpochSeconds || Math.floor(Date.now() / 1000);
    const id = validated.id || randomUUID();

    const record = {
      id,
      slug: validated.slug,
      name: validated.name,
      description: validated.description || null,
      root_path: validated.rootPath,
      owner_user_id: validated.ownerUserId,
      created_at: now,
      updated_at: now,
    };

    await this.#database.insertInto('zetro_workspaces').values(record).execute();
    return workspaceEntitySchema.parse(record);
  }

  async getWorkspaceById(id) {
    const row = await this.#database
      .selectFrom('zetro_workspaces')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? workspaceEntitySchema.parse(row) : null;
  }

  async getWorkspaceBySlug(slug) {
    const row = await this.#database
      .selectFrom('zetro_workspaces')
      .selectAll()
      .where('slug', '=', slug)
      .executeTakeFirst();
    return row ? workspaceEntitySchema.parse(row) : null;
  }

  async listWorkspaces() {
    const rows = await this.#database
      .selectFrom('zetro_workspaces')
      .selectAll()
      .orderBy('created_at', 'asc')
      .execute();
    return rows.map((r) => workspaceEntitySchema.parse(r));
  }

  // Memberships
  async createMembership(input) {
    const validated = createMembershipInputSchema.parse(input);
    const now = validated.nowEpochSeconds || Math.floor(Date.now() / 1000);
    const id = validated.id || randomUUID();

    const record = {
      id,
      workspace_id: validated.workspaceId,
      user_id: validated.userId,
      role: validated.role,
      joined_at: now,
      granted_by: validated.grantedBy,
      updated_at: now,
    };

    await this.#database.insertInto('zetro_workspace_memberships').values(record).execute();
    return workspaceMembershipEntitySchema.parse(record);
  }

  async getMembership(workspaceId, userId) {
    if (!workspaceId || !userId) return null;
    const row = await this.#database
      .selectFrom('zetro_workspace_memberships')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return row ? workspaceMembershipEntitySchema.parse(row) : null;
  }

  async listMemberships(workspaceId) {
    const rows = await this.#database
      .selectFrom('zetro_workspace_memberships')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .orderBy('joined_at', 'asc')
      .execute();
    return rows.map((r) => workspaceMembershipEntitySchema.parse(r));
  }

  async updateMembershipRole(workspaceId, userId, newRole, updatedBy, nowEpochSeconds = null) {
    const now = nowEpochSeconds || Math.floor(Date.now() / 1000);
    await this.#database
      .updateTable('zetro_workspace_memberships')
      .set({
        role: newRole,
        granted_by: updatedBy,
        updated_at: now,
      })
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .execute();

    return this.getMembership(workspaceId, userId);
  }

  async removeMembership(workspaceId, userId) {
    const result = await this.#database
      .deleteFrom('zetro_workspace_memberships')
      .where('workspace_id', '=', workspaceId)
      .where('user_id', '=', userId)
      .executeTakeFirst();
    return Number(result.numDeletedRows || 0) > 0;
  }

  // Capability Grants
  async createCapabilityGrant(input) {
    const validated = createGrantInputSchema.parse(input);
    const now = validated.nowEpochSeconds || Math.floor(Date.now() / 1000);
    const id = validated.id || randomUUID();

    const record = {
      id,
      workspace_id: validated.workspaceId,
      user_id: validated.userId || null,
      role: validated.role || null,
      capability: validated.capability,
      scope_json: validated.scope ? JSON.stringify(validated.scope) : null,
      expires_at: validated.expiresAt || null,
      created_at: now,
    };

    await this.#database.insertInto('zetro_capability_grants').values(record).execute();
    return capabilityGrantEntitySchema.parse(record);
  }

  async listCapabilityGrants(workspaceId, userId = null, role = null) {
    let query = this.#database
      .selectFrom('zetro_capability_grants')
      .selectAll()
      .where('workspace_id', '=', workspaceId);

    if (userId) {
      query = query.where((eb) =>
        eb.or([eb('user_id', '=', userId), eb('user_id', 'is', null)])
      );
    }
    if (role) {
      query = query.where((eb) =>
        eb.or([eb('role', '=', role), eb('role', 'is', null)])
      );
    }

    const rows = await query.orderBy('created_at', 'asc').execute();
    return rows.map((r) => capabilityGrantEntitySchema.parse(r));
  }

  // Audit Logs (Strictly Append-Only: No updates or deletes permitted)
  async recordAuditLog(input) {
    const validated = createAuditLogInputSchema.parse(input);
    const now = validated.nowEpochSeconds || Math.floor(Date.now() / 1000);
    const id = validated.id || randomUUID();

    let detailsJson = null;
    if (validated.details) {
      let stringified = JSON.stringify(validated.details);
      if (this.#secretsProvider) {
        stringified = this.#secretsProvider.redact(stringified);
      }
      detailsJson = stringified;
    }

    const record = {
      id,
      workspace_id: validated.workspaceId || null,
      actor_id: validated.actorId,
      action: validated.action,
      target_type: validated.targetType,
      target_id: validated.targetId,
      details_json: detailsJson,
      created_at: now,
    };

    await this.#database.insertInto('zetro_access_audit_logs').values(record).execute();
    return accessAuditLogEntitySchema.parse(record);
  }

  async listAuditLogs(workspaceIdOrFilter = null, limit = 50) {
    let query = this.#database.selectFrom('zetro_access_audit_logs').selectAll();
    if (typeof workspaceIdOrFilter === 'string') {
      query = query.where('workspace_id', '=', workspaceIdOrFilter);
    } else if (workspaceIdOrFilter && typeof workspaceIdOrFilter === 'object') {
      const {
        workspaceId,
        actorId,
        action,
        targetType,
        targetId,
        limit: filterLimit,
      } = workspaceIdOrFilter;
      if (workspaceId) query = query.where('workspace_id', '=', workspaceId);
      if (actorId) query = query.where('actor_id', '=', actorId);
      if (action) query = query.where('action', '=', action);
      if (targetType) query = query.where('target_type', '=', targetType);
      if (targetId) query = query.where('target_id', '=', targetId);
      if (filterLimit) limit = filterLimit;
    }
    const rows = await query.orderBy('created_at', 'desc').limit(limit).execute();
    return rows.map((r) => accessAuditLogEntitySchema.parse(r));
  }

  // 5. Action Approvals
  async createApproval(input) {
    const validated = createApprovalInputSchema.parse(input);
    const now = validated.nowEpochSeconds || Math.floor(Date.now() / 1000);
    const id = validated.id || `appr-${randomUUID()}`;
    const expiresAt = now + validated.ttlSeconds;

    const record = {
      id,
      workspace_id: validated.workspaceId,
      actor_id: validated.actorId,
      approver_id: null,
      action: validated.action,
      target_resource: validated.targetResource,
      content_digest: validated.contentDigest,
      status: 'pending',
      created_at: now,
      expires_at: expiresAt,
      consumed_at: null,
      rejection_reason: null,
    };

    await this.#database.insertInto('zetro_action_approvals').values(record).execute();
    return actionApprovalEntitySchema.parse(record);
  }

  async getApprovalById(id) {
    if (!id) return null;
    const row = await this.#database
      .selectFrom('zetro_action_approvals')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();
    return row ? actionApprovalEntitySchema.parse(row) : null;
  }

  async updateApprovalStatus({
    id,
    status,
    approverId = null,
    rejectionReason = null,
    consumedAt = null,
  }) {
    const updateValues = { status };
    if (approverId !== undefined && approverId !== null) updateValues.approver_id = approverId;
    if (rejectionReason !== undefined) updateValues.rejection_reason = rejectionReason;
    if (consumedAt !== undefined) updateValues.consumed_at = consumedAt;

    await this.#database
      .updateTable('zetro_action_approvals')
      .set(updateValues)
      .where('id', '=', id)
      .execute();

    return this.getApprovalById(id);
  }

  async listApprovalsByWorkspace(workspaceId) {
    if (!workspaceId) return [];
    const rows = await this.#database
      .selectFrom('zetro_action_approvals')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .orderBy('created_at', 'desc')
      .execute();
    return rows.map((r) => actionApprovalEntitySchema.parse(r));
  }
}
