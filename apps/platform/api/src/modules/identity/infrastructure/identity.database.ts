import type { ColumnType } from 'kysely'

type Timestamp = ColumnType<Date, Date | string, Date | string>

export interface IdentityUserTable {
  created_at: Timestamp
  display_name: string
  email: string
  id: string
  portal: string
  status: string
  updated_at: Timestamp
}

export interface IdentityCredentialTable {
  password_hash: string
  updated_at: Timestamp
  user_id: string
}

export interface IdentitySessionTable {
  created_at: Timestamp
  expires_at: Timestamp
  id: string
  device_id: string
  portal: string
  revoked_at: Timestamp | null
  token_hash: string
  user_id: string
}

export interface IdentityUserIdentifierTable {
  created_at: Timestamp
  id: string
  identifier_type: string
  identifier_value: string
  user_id: string
  verified_at: Timestamp | null
}

export interface IdentityDeviceTable {
  activated_at: Timestamp | null
  activated_by: string | null
  client_type: string
  device_id: string
  device_name: string
  first_seen_at: Timestamp
  last_seen_at: Timestamp
  status: string
  token_hash: string
  user_id: string
}

export interface IdentitySecurityEventTable {
  actor_user_id: string | null
  client_type: string | null
  created_at: Timestamp
  device_id: string | null
  event_type: string
  id: string
  ip_address: string | null
  outcome: string
  path: string | null
  risk: string
  subject_user_id: string | null
  user_agent: string | null
}

export interface IdentityRoleTable {
  id: string
  name: string
  portal: string
}

export interface IdentityPermissionTable {
  id: string
  name: string
}

export interface IdentityRolePermissionTable {
  permission_id: string
  role_id: string
}

export interface IdentityUserRoleTable {
  role_id: string
  user_id: string
}

export interface IdentityDatabaseSchema {
  identity_credentials: IdentityCredentialTable
  identity_devices: IdentityDeviceTable
  identity_permissions: IdentityPermissionTable
  identity_role_permissions: IdentityRolePermissionTable
  identity_roles: IdentityRoleTable
  identity_sessions: IdentitySessionTable
  identity_security_events: IdentitySecurityEventTable
  identity_user_identifiers: IdentityUserIdentifierTable
  identity_user_roles: IdentityUserRoleTable
  identity_users: IdentityUserTable
}
