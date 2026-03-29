import type { DatabaseMigrationSection } from "../../../types.js"

export const authControlMigrationSection: DatabaseMigrationSection = {
  key: "platform-04-auth-control",
  order: 4,
  moduleKey: "platform",
  schemaSectionKey: "auth-control",
  name: "Auth And User Control",
  tableNames: [
    "auth_users",
    "auth_roles",
    "auth_permissions",
    "auth_role_permissions",
    "company_memberships",
    "company_membership_roles",
    "auth_sessions",
    "auth_api_tokens",
    "auth_password_reset_tokens",
    "auth_contact_verifications",
    "auth_user_preferences",
    "auth_access_logs",
  ],
}
