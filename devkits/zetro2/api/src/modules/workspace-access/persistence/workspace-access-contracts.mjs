// Zod Data Contracts for Workspace Access Persistence
// Enforces schema validation on entity creation, updates, and persistence models

import { z } from 'zod';
import { WORKSPACE_ROLES, workspaceRoleSchema } from '../membership-contracts.mjs';
import { CAPABILITY_KEYS, capabilityKeySchema } from '../capability-grants.mjs';

export const workspaceEntitySchema = z.object({
  id: z.string().min(1).max(36),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(128),
  description: z.string().max(500).nullable().optional(),
  root_path: z.string().min(1).max(255),
  owner_user_id: z.string().min(1).max(64),
  created_at: z.number().int().positive(),
  updated_at: z.number().int().positive(),
});

export const createWorkspaceInputSchema = z.object({
  id: z.string().min(1).max(36).optional(),
  slug: z.string().min(1).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(128),
  description: z.string().max(500).nullable().optional(),
  rootPath: z.string().min(1).max(255),
  ownerUserId: z.string().min(1).max(64),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const workspaceMembershipEntitySchema = z.object({
  id: z.string().min(1).max(36),
  workspace_id: z.string().min(1).max(36),
  user_id: z.string().min(1).max(64),
  role: workspaceRoleSchema,
  joined_at: z.number().int().positive(),
  granted_by: z.string().min(1).max(64),
  updated_at: z.number().int().positive().nullable().optional(),
});

export const createMembershipInputSchema = z.object({
  id: z.string().min(1).max(36).optional(),
  workspaceId: z.string().min(1).max(36),
  userId: z.string().min(1).max(64),
  role: workspaceRoleSchema,
  grantedBy: z.string().min(1).max(64),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const capabilityGrantEntitySchema = z.object({
  id: z.string().min(1).max(36),
  workspace_id: z.string().min(1).max(36),
  user_id: z.string().max(64).nullable().optional(),
  role: workspaceRoleSchema.nullable().optional(),
  capability: capabilityKeySchema,
  scope_json: z.string().nullable().optional(),
  expires_at: z.number().int().positive().nullable().optional(),
  created_at: z.number().int().positive(),
});

export const createGrantInputSchema = z.object({
  id: z.string().min(1).max(36).optional(),
  workspaceId: z.string().min(1).max(36),
  userId: z.string().max(64).nullable().optional(),
  role: workspaceRoleSchema.nullable().optional(),
  capability: capabilityKeySchema,
  scope: z.record(z.unknown()).nullable().optional(),
  expiresAt: z.number().int().positive().nullable().optional(),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const accessAuditLogEntitySchema = z.object({
  id: z.string().min(1).max(36),
  workspace_id: z.string().max(36).nullable().optional(),
  actor_id: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
  target_type: z.string().min(1).max(32),
  target_id: z.string().min(1).max(64),
  details_json: z.string().nullable().optional(),
  created_at: z.number().int().positive(),
});

export const createAuditLogInputSchema = z.object({
  id: z.string().min(1).max(36).optional(),
  workspaceId: z.string().max(36).nullable().optional(),
  actorId: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
  targetType: z.string().min(1).max(32),
  targetId: z.string().min(1).max(64),
  details: z.record(z.unknown()).nullable().optional(),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const approvalStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'consumed',
  'expired',
]);

export const actionApprovalEntitySchema = z.object({
  id: z.string().min(1).max(64),
  workspace_id: z.string().min(1).max(64),
  actor_id: z.string().min(1).max(64),
  approver_id: z.string().max(64).nullable().optional(),
  action: z.string().min(1).max(64),
  target_resource: z.string().min(1).max(255),
  content_digest: z.string().length(64),
  status: approvalStatusSchema,
  created_at: z.number().int().positive(),
  expires_at: z.number().int().positive(),
  consumed_at: z.number().int().positive().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
});

export const createApprovalInputSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  workspaceId: z.string().min(1).max(64),
  actorId: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
  targetResource: z.string().min(1).max(255),
  contentDigest: z.string().length(64),
  ttlSeconds: z.number().int().positive().default(3600),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const decideApprovalInputSchema = z.object({
  approvalId: z.string().min(1).max(64),
  approverId: z.string().min(1).max(64),
  decision: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().max(500).optional(),
  nowEpochSeconds: z.number().int().positive().optional(),
});

export const verifyApprovalInputSchema = z.object({
  approvalId: z.string().min(1).max(64),
  workspaceId: z.string().min(1).max(64),
  actorId: z.string().min(1).max(64),
  action: z.string().min(1).max(64),
  targetResource: z.string().min(1).max(255),
  contentDigest: z.string().length(64),
  nowEpochSeconds: z.number().int().positive().optional(),
});
