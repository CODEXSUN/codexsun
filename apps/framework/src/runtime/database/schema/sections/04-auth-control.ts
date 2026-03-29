import type { DatabaseFoundationSection } from "../types.js"

export const authControlSection: DatabaseFoundationSection = {
  key: "auth-control",
  order: 4,
  name: "Auth And User Control",
  purpose: "Defines users, memberships, roles, tokens, sessions, and access logs.",
  tables: [
    { key: "auth_users", name: "auth_users", purpose: "Platform user identities." },
    { key: "auth_roles", name: "auth_roles", purpose: "Reusable role definitions." },
    { key: "auth_permissions", name: "auth_permissions", purpose: "Permission definitions." },
    { key: "auth_role_permissions", name: "auth_role_permissions", purpose: "Role to permission mapping." },
    { key: "company_memberships", name: "company_memberships", purpose: "Company to user membership records." },
    { key: "company_membership_roles", name: "company_membership_roles", purpose: "Membership role assignments." },
    { key: "auth_sessions", name: "auth_sessions", purpose: "Session state." },
    { key: "auth_api_tokens", name: "auth_api_tokens", purpose: "API token records." },
    { key: "auth_password_reset_tokens", name: "auth_password_reset_tokens", purpose: "Password reset flows." },
    { key: "auth_contact_verifications", name: "auth_contact_verifications", purpose: "OTP and contact verification state." },
    { key: "auth_user_preferences", name: "auth_user_preferences", purpose: "Theme, locale, and user preferences." },
    { key: "auth_access_logs", name: "auth_access_logs", purpose: "Auth access logging." },
  ],
}
