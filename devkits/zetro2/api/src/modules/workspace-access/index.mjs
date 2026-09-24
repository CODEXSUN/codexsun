// Workspace Access Module public exports
export {
  ZetroAccessModule,
  createAccessModule,
} from './access-module.mjs';

export {
  ROLE_CAPABILITIES,
  ZetroIdentityProvider,
  createIdentityProvider,
} from './identity-provider.mjs';

export {
  ZetroSecretsProvider,
  createSecretsProvider,
} from './secrets-provider.mjs';

export {
  ZetroSessionProvider,
  createSessionProvider,
} from './session-provider.mjs';

export {
  ZetroStorageProvider,
  createStorageProvider,
} from './storage-provider.mjs';

export {
  ROLE_PRESET_METADATA,
  WORKSPACE_ROLES,
  canAssignRole,
  canManageMembership,
  isValidRole,
  workspaceMemberInviteSchema,
  workspaceMembershipSchema,
  workspaceRoleSchema,
  workspaceRoleUpdateSchema,
  workspaceSchema,
} from './membership-contracts.mjs';

export {
  CAPABILITY_KEYS,
  CapabilityEvaluator,
  ROLE_DEFAULT_GRANTS,
  capabilityKeySchema,
  evaluateGrant,
  grantScopeSchema,
  scopedGrantSchema,
} from './capability-grants.mjs';


