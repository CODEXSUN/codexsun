// Approval Binding Manager
// Binds high-risk and mutation approvals strictly to:
// 1. Exact action
// 2. Exact actor
// 3. Exact workspace
// 4. Cryptographic content digest (SHA-256)
// 5. Expiration (+ one-time replay prevention)

import { createHash } from 'node:crypto';
import { CapabilityEvaluator, ROLE_DEFAULT_GRANTS } from './capability-grants.mjs';

export class ApprovalBindingManager {
  #store;
  #clock;

  constructor({ store, clock = null }) {
    this.#store = store;
    this.#clock = clock;
  }

  #getNowEpochSeconds() {
    if (this.#clock && typeof this.#clock.now === 'function') {
      return Math.floor(this.#clock.now().getTime() / 1000);
    }
    return Math.floor(Date.now() / 1000);
  }

  // Cryptographic content hashing (SHA-256 hex)
  computeContentDigest(content) {
    if (content === null || content === undefined) {
      throw new Error('Content is required to compute digest');
    }
    let payload = content;
    if (typeof content === 'object' && !Buffer.isBuffer(content)) {
      payload = JSON.stringify(content);
    }
    return createHash('sha256').update(payload).digest('hex');
  }

  // 1. Request an Approval bound to action, actor, workspace, target resource, content digest, and TTL
  async requestApproval({
    workspaceId,
    actorId,
    action,
    targetResource,
    content = null,
    contentDigest = null,
    ttlSeconds = 3600,
  }) {
    if (!workspaceId || !actorId || !action || !targetResource) {
      throw new Error(
        'Workspace ID, actor ID, action, and target resource are required to request approval'
      );
    }

    const digest = contentDigest || (content !== null ? this.computeContentDigest(content) : null);
    if (!digest) {
      throw new Error('Either content or contentDigest must be provided');
    }

    const now = this.#getNowEpochSeconds();
    const approval = await this.#store.repository.createApproval({
      workspaceId,
      actorId,
      action,
      targetResource,
      contentDigest: digest,
      ttlSeconds,
      nowEpochSeconds: now,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId,
      action: 'approval.requested',
      targetType: 'action_approval',
      targetId: approval.id,
      details: { action, targetResource, contentDigest: digest, expiresAt: approval.expires_at },
      nowEpochSeconds: now,
    });

    return approval;
  }

  // 2. Decide on an Approval (approve or reject) by an authorized reviewer/owner
  async decideApproval({ approvalId, approverId, decision, rejectionReason = null }) {
    if (!approvalId || !approverId || !decision) {
      throw new Error('Approval ID, approver ID, and decision are required');
    }

    const approval = await this.#store.repository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval "${approvalId}" not found`);
    }

    const now = this.#getNowEpochSeconds();
    if (approval.expires_at <= now) {
      await this.#store.repository.updateApprovalStatus({ id: approvalId, status: 'expired' });
      throw new Error('Cannot decide on an expired approval');
    }

    if (approval.status !== 'pending') {
      throw new Error(`Approval "${approvalId}" is not pending (current status: ${approval.status})`);
    }

    // Server-enforce approver has 'change.approve' capability in this workspace
    const membership = await this.#store.repository.getMembership(
      approval.workspace_id,
      approverId
    );
    if (!membership) {
      throw new Error(
        `Forbidden: Approver "${approverId}" is not a member of workspace "${approval.workspace_id}"`
      );
    }

    const defaultGrants = ROLE_DEFAULT_GRANTS[membership.role] || [];
    const evaluation = CapabilityEvaluator.evaluate({
      grants: defaultGrants,
      requiredCapability: 'change.approve',
    });
    if (!evaluation.allowed) {
      throw new Error(
        `Forbidden: Role "${membership.role}" lacks capability "change.approve" to decide approvals`
      );
    }

    const newStatus = decision === 'approved' ? 'approved' : 'rejected';
    const updated = await this.#store.repository.updateApprovalStatus({
      id: approvalId,
      status: newStatus,
      approverId,
      rejectionReason: decision === 'rejected' ? rejectionReason : null,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId: approval.workspace_id,
      actorId: approverId,
      action: `approval.${decision}`,
      targetType: 'action_approval',
      targetId: approvalId,
      details: { decision, rejectionReason },
      nowEpochSeconds: now,
    });

    return updated;
  }

  // 3. Verify and Consume Approval
  // Strict multi-dimensional validation: action, actor, workspace, digest, expiration, single-use
  async verifyAndConsumeApproval({
    approvalId,
    actorId,
    workspaceId,
    action,
    targetResource,
    content = null,
    contentDigest = null,
  }) {
    const approval = await this.#store.repository.getApprovalById(approvalId);
    if (!approval) {
      throw new Error(`Approval "${approvalId}" not found`);
    }

    const now = this.#getNowEpochSeconds();

    // 1. Status check & replay prevention
    if (approval.status === 'consumed') {
      throw new Error('Approval replay rejected: Approval has already been consumed');
    }
    if (approval.status === 'rejected') {
      throw new Error(`Approval rejected: ${approval.rejection_reason || 'Rejected by reviewer'}`);
    }
    if (approval.status === 'pending') {
      throw new Error('Approval pending: Has not been approved by a reviewer');
    }
    if (approval.status === 'expired' || approval.expires_at <= now) {
      if (approval.status !== 'expired') {
        await this.#store.repository.updateApprovalStatus({ id: approvalId, status: 'expired' });
      }
      throw new Error('Approval expired: Approval validity window has expired');
    }
    if (approval.status !== 'approved') {
      throw new Error(`Approval invalid: status is "${approval.status}"`);
    }

    // 2. Exact workspace binding
    if (approval.workspace_id !== workspaceId) {
      throw new Error(
        `Cross-workspace approval rejected: Bound to workspace "${approval.workspace_id}", attempted in "${workspaceId}"`
      );
    }

    // 3. Exact actor binding
    if (approval.actor_id !== actorId) {
      throw new Error(
        `Actor substitution rejected: Bound to actor "${approval.actor_id}", attempted by "${actorId}"`
      );
    }

    // 4. Exact action binding
    if (approval.action !== action) {
      throw new Error(
        `Action mismatch: Bound to action "${approval.action}", attempted "${action}"`
      );
    }

    // 5. Exact target resource binding
    if (approval.target_resource !== targetResource) {
      throw new Error(
        `Target resource mismatch: Bound to "${approval.target_resource}", attempted "${targetResource}"`
      );
    }

    // 6. Exact content digest binding (tamper prevention)
    const expectedDigest =
      contentDigest || (content !== null ? this.computeContentDigest(content) : null);
    if (approval.content_digest !== expectedDigest) {
      throw new Error(
        `Content digest mismatch: Bound to digest "${approval.content_digest}", received "${expectedDigest}". Content was modified after approval.`
      );
    }

    // 7. Consume approval (one-time use)
    const consumed = await this.#store.repository.updateApprovalStatus({
      id: approvalId,
      status: 'consumed',
      consumedAt: now,
    });

    await this.#store.repository.recordAuditLog({
      workspaceId,
      actorId,
      action: 'approval.consumed',
      targetType: 'action_approval',
      targetId: approvalId,
      details: { action, targetResource, contentDigest: approval.content_digest },
      nowEpochSeconds: now,
    });

    return { verified: true, approval: consumed };
  }
}

export function createApprovalBindingManager(options) {
  return new ApprovalBindingManager(options);
}
