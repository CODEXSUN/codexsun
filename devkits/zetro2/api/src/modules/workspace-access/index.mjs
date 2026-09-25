// Workspace Access Module Index
// Central public export surface for identity, sessions, secrets, storage,
// persistence contracts, repositories, services, guards, approvals, gateways, and HTTP handlers.

export {
  ROLE_PRESET_METADATA,
  WORKSPACE_ROLES,
  canAssignRole,
  canManageMembership,
  isValidRole,
  workspaceRoleSchema,
  workspaceSchema,
  workspaceMembershipSchema,
  workspaceMemberInviteSchema,
  workspaceRoleUpdateSchema,
} from './membership-contracts.mjs';

export {
  CAPABILITY_KEYS,
  ROLE_DEFAULT_GRANTS,
  CapabilityEvaluator,
  evaluateGrant,
  capabilityKeySchema,
  grantScopeSchema,
  scopedGrantSchema,
} from './capability-grants.mjs';

export {
  ZetroIdentityProvider,
  ZetroIdentityProvider as IdentityProvider,
  createIdentityProvider,
} from './identity-provider.mjs';

export {
  ZetroSessionProvider,
  ZetroSessionProvider as SessionProvider,
  createSessionProvider,
} from './session-provider.mjs';

export {
  ZetroSecretsProvider,
  ZetroSecretsProvider as SecretsProvider,
  createSecretsProvider,
} from './secrets-provider.mjs';

export {
  ZetroStorageProvider,
  ZetroStorageProvider as StorageProvider,
  createStorageProvider,
} from './storage-provider.mjs';

export {
  ZetroAccessModule,
  createAccessModule,
} from './access-module.mjs';

export {
  accessAuditLogEntitySchema,
  capabilityGrantEntitySchema,
  createAuditLogInputSchema,
  createGrantInputSchema,
  createMembershipInputSchema,
  createWorkspaceInputSchema,
  workspaceEntitySchema,
  workspaceMembershipEntitySchema,
  approvalStatusSchema,
  actionApprovalEntitySchema,
  createApprovalInputSchema,
  decideApprovalInputSchema,
  verifyApprovalInputSchema,
} from './persistence/workspace-access-contracts.mjs';

export {
  workspaceAccessMigration001,
  workspaceAccessMigration002,
} from './persistence/workspace-access-migration.mjs';
export { workspaceAccessSeeder001 } from './persistence/workspace-access-seeder.mjs';
export { workspaceAccessLifecyclePlan } from './persistence/workspace-access-lifecycle-plan.mjs';
export { WorkspaceAccessRepository } from './persistence/workspace-access.repository.mjs';
export {
  WorkspaceAccessStore,
  createWorkspaceAccessStore,
} from './persistence/workspace-access-store.mjs';

export {
  WorkspaceAccessService,
  createWorkspaceAccessService,
} from './workspace-access.service.mjs';

export {
  WorkspaceAuthorizationGuard,
  createWorkspaceAuthorizationGuard,
} from './authorization-guard.mjs';

export {
  EventSubscriptionHub,
  createEventSubscriptionHub,
} from './event-subscription-hub.mjs';

export {
  UpstreamGateway,
  createUpstreamGateway,
} from './upstream-gateway.mjs';

export {
  ApprovalBindingManager,
  createApprovalBindingManager,
} from './approval-binding-manager.mjs';

export {
  RunCancellationCoordinator,
  createRunCancellationCoordinator,
} from './run-cancellation-coordinator.mjs';

export {
  handleWorkspaceAccessRequest,
} from './workspace-access.router.mjs';
