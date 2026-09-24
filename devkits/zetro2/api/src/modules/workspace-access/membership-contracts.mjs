// Workspace Membership and Role Preset Contracts for Zetro2
// Defines canonical schemas, role presets, and membership validation rules

import { z } from 'zod';

export const WORKSPACE_ROLES = ['Owner', 'Maintainer', 'Developer', 'Reviewer', 'Viewer'];

export const workspaceRoleSchema = z.enum(WORKSPACE_ROLES);

export const ROLE_PRESET_METADATA = Object.freeze({
  Owner: {
    role: 'Owner',
    rank: 100,
    title: 'Workspace Owner',
    description: 'Full administrative control, workspace settings, member management, secrets, and all agent/runtime capabilities.',
    isAdministrative: true,
  },
  Maintainer: {
    role: 'Maintainer',
    rank: 80,
    title: 'Maintainer',
    description: 'Project configuration, MCP integration management, full developer capabilities, and agent execution.',
    isAdministrative: false,
  },
  Developer: {
    role: 'Developer',
    rank: 60,
    title: 'Developer',
    description: 'Active coding, running tasks and agent sessions, creating commits, direct editing, and browser previews.',
    isAdministrative: false,
  },
  Reviewer: {
    role: 'Reviewer',
    rank: 40,
    title: 'Code Reviewer',
    description: 'Read-only repository access, proposing review comments, inspecting diffs, and approving proposed changes.',
    isAdministrative: false,
  },
  Viewer: {
    role: 'Viewer',
    rank: 20,
    title: 'Observer / Viewer',
    description: 'Read-only inspection of workspace files and status without execution, editing, or approval permissions.',
    isAdministrative: false,
  },
});

export const workspaceSchema = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rootPath: z.string().min(1),
  ownerUserId: z.string().min(1),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export const workspaceMembershipSchema = z.object({
  id: z.string().min(1),
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  role: workspaceRoleSchema,
  joinedAt: z.number().int().positive(),
  grantedBy: z.string().min(1),
  updatedAt: z.number().int().positive().optional(),
});

export const workspaceMemberInviteSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  role: workspaceRoleSchema,
});

export const workspaceRoleUpdateSchema = z.object({
  workspaceId: z.string().min(1),
  userId: z.string().min(1),
  newRole: workspaceRoleSchema,
});

export function canManageMembership(actorRole) {
  return actorRole === 'Owner';
}

export function canAssignRole(actorRole, targetRole) {
  const actorRank = ROLE_PRESET_METADATA[actorRole]?.rank || 0;
  const targetRank = ROLE_PRESET_METADATA[targetRole]?.rank || 0;
  return actorRank > targetRank;
}

export function isValidRole(role) {
  return WORKSPACE_ROLES.includes(role);
}
