import {
  permissionSchema,
  type PermissionScopeType,
  roleSchema,
  mailboxTemplateSchema,
  type ActorType,
  type AuthPermission,
  type AuthRole,
  type MailboxTemplate,
  type PermissionKey,
  type RoleKey,
} from "../../shared/index.js"

const timestamp = "2026-03-30T10:00:00.000Z"

function definePermission(
  key: PermissionKey,
  name: string,
  summary: string,
  scopeType: PermissionScopeType,
  resourceKey: string,
  options?: {
    actionKey?: string
    appId?: string | null
    isActive?: boolean
    route?: string | null
  }
): AuthPermission {
  return permissionSchema.parse({
    key,
    name,
    summary,
    scopeType,
    appId: options?.appId ?? null,
    resourceKey,
    actionKey: options?.actionKey ?? "view",
    route: options?.route ?? null,
    isActive: options?.isActive ?? true,
  })
}

function defineRole(input: {
  key: RoleKey
  actorType: ActorType
  name: string
  summary: string
  isActive?: boolean
  permissions: AuthPermission[]
}): AuthRole {
  return roleSchema.parse({
    ...input,
    isActive: input.isActive ?? true,
  })
}

function defineMailboxTemplate(
  input: Omit<MailboxTemplate, "createdAt" | "updatedAt">
): MailboxTemplate {
  return mailboxTemplateSchema.parse({
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  })
}

export const authPermissions: AuthPermission[] = [
  definePermission(
    "dashboard:view",
    "Dashboard View",
    "View dashboard surfaces and workspace summaries.",
    "desk",
    "dashboard",
    { route: "/dashboard", actionKey: "view" }
  ),
  definePermission(
    "users:manage",
    "User Management",
    "Create, review, and deactivate authenticated users.",
    "module",
    "users",
    { appId: "framework", route: "/dashboard/settings/users", actionKey: "manage" }
  ),
  definePermission(
    "roles:manage",
    "Role Management",
    "Manage role assignments and actor access.",
    "module",
    "roles",
    { appId: "framework", route: "/dashboard/settings/roles", actionKey: "manage" }
  ),
  definePermission(
    "permissions:manage",
    "Permission Management",
    "Review and adjust permission mappings.",
    "module",
    "permissions",
    { appId: "framework", route: "/dashboard/settings/permissions", actionKey: "manage" }
  ),
  definePermission(
    "customers:view",
    "Customer Access",
    "View customer-facing data and support flows.",
    "page",
    "customers",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/customers", actionKey: "view" }
  ),
  definePermission(
    "vendors:view",
    "Vendor Access",
    "View vendor-facing data and shared operations.",
    "module",
    "vendors",
    { appId: "billing", route: "/dashboard/billing/chart-of-accounts", actionKey: "view" }
  ),
  definePermission(
    "mailbox:manage",
    "Mailbox Management",
    "Manage email templates and outgoing message history.",
    "module-def",
    "mailbox",
    { appId: "cxapp", actionKey: "manage" }
  ),
  definePermission(
    "settings:manage",
    "Settings Management",
    "Review and adjust application-level settings.",
    "workspace",
    "framework-settings",
    { appId: "framework", route: "/dashboard/settings/core-settings", actionKey: "manage" }
  ),
]

export const authRoles: AuthRole[] = [
  defineRole({
    key: "admin_owner",
    actorType: "admin",
    name: "Super Admin",
    summary: "Full platform administration across the suite.",
    permissions: authPermissions,
  }),
  defineRole({
    key: "staff_operator",
    actorType: "staff",
    name: "Staff Operator",
    summary: "Operational workspace access for day-to-day users.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "vendors:view",
        "mailbox:manage",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "employee_portal",
    actorType: "employee",
    name: "Employee Portal",
    summary: "Authenticated access for employee-facing internal workflows.",
    permissions: authPermissions.filter((permission) =>
      ["dashboard:view", "mailbox:manage"].includes(permission.key)
    ),
  }),
  defineRole({
    key: "partner_portal",
    actorType: "partner",
    name: "Partner Portal",
    summary: "Authenticated access for partner-facing shared workflows.",
    permissions: authPermissions.filter((permission) =>
      ["dashboard:view", "customers:view", "vendors:view"].includes(permission.key)
    ),
  }),
  defineRole({
    key: "supplier_portal",
    actorType: "supplier",
    name: "Supplier Portal",
    summary: "Authenticated access for supplier-facing shared operations.",
    permissions: authPermissions.filter((permission) =>
      ["dashboard:view", "vendors:view"].includes(permission.key)
    ),
  }),
  defineRole({
    key: "customer_portal",
    actorType: "customer",
    name: "Customer Portal",
    summary: "Authenticated access for customer-facing application flows.",
    permissions: authPermissions.filter((permission) =>
      ["dashboard:view", "customers:view"].includes(permission.key)
    ),
  }),
  defineRole({
    key: "vendor_portal",
    actorType: "vendor",
    name: "Vendor Portal",
    summary: "Authenticated access for vendor-facing application flows.",
    permissions: authPermissions.filter((permission) =>
      ["dashboard:view", "vendors:view"].includes(permission.key)
    ),
  }),
]

export const authUsers = [
  {
    id: "auth-user:platform-admin",
    email: "sundar@sundar.com",
    phoneNumber: "+919000000001",
    displayName: "Sundar",
    actorType: "admin" as const,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Sundar&background=1f2937&color=ffffff",
    organizationName: "codexsun",
    roleKey: "admin_owner" as const,
    isSuperAdmin: true,
    isActive: true,
    password: "Kalarani1@@",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "auth-user:workspace-operator",
    email: "operator@codexsun.local",
    phoneNumber: "+919000000002",
    displayName: "Workspace Operator",
    actorType: "staff" as const,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Workspace+Operator&background=334155&color=ffffff",
    organizationName: "codexsun",
    roleKey: "staff_operator" as const,
    isSuperAdmin: false,
    isActive: true,
    password: "Operator@12345",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
  {
    id: "auth-user:customer-demo",
    email: "customer@codexsun.local",
    phoneNumber: "+919000000003",
    displayName: "Customer Demo",
    actorType: "customer" as const,
    avatarUrl:
      "https://ui-avatars.com/api/?name=Customer+Demo&background=7c2d12&color=ffffff",
    organizationName: "Loomline Retail",
    roleKey: "customer_portal" as const,
    isSuperAdmin: false,
    isActive: true,
    password: "Customer@12345",
    createdAt: timestamp,
    updatedAt: timestamp,
  },
]

export const mailboxTemplates: MailboxTemplate[] = [
  defineMailboxTemplate({
    id: "mailbox-template:workspace-registration-otp",
    code: "workspace_registration_otp",
    name: "Workspace Registration OTP",
    category: "auth",
    description: "OTP message sent while creating a new workspace account.",
    subjectTemplate: "Your codexsun verification code",
    htmlTemplate:
      "<p>Hello {{displayName}},</p><p>Your verification code is <strong>{{otp}}</strong>.</p><p>This code expires in {{expiryMinutes}} minutes.</p>",
    textTemplate:
      "Hello {{displayName}}, your verification code is {{otp}}. This code expires in {{expiryMinutes}} minutes.",
    sampleData: {
      displayName: "Workspace User",
      otp: "123456",
      expiryMinutes: 10,
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:password-reset-otp",
    code: "password_reset_otp",
    name: "Password Reset OTP",
    category: "auth",
    description: "OTP message sent while resetting an account password.",
    subjectTemplate: "Reset your codexsun password",
    htmlTemplate:
      "<p>Hello {{displayName}},</p><p>Use <strong>{{otp}}</strong> to reset your password.</p><p>This code expires in {{expiryMinutes}} minutes.</p>",
    textTemplate:
      "Hello {{displayName}}, use {{otp}} to reset your password. This code expires in {{expiryMinutes}} minutes.",
    sampleData: {
      displayName: "Workspace User",
      otp: "123456",
      expiryMinutes: 10,
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:account-recovery-otp",
    code: "account_recovery_otp",
    name: "Account Recovery OTP",
    category: "auth",
    description: "OTP message sent while restoring a disabled account.",
    subjectTemplate: "Restore your codexsun account",
    htmlTemplate:
      "<p>Hello {{displayName}},</p><p>Use <strong>{{otp}}</strong> to restore your account.</p><p>This code expires in {{expiryMinutes}} minutes.</p>",
    textTemplate:
      "Hello {{displayName}}, use {{otp}} to restore your account. This code expires in {{expiryMinutes}} minutes.",
    sampleData: {
      displayName: "Workspace User",
      otp: "123456",
      expiryMinutes: 10,
    },
    isSystem: true,
    isActive: true,
  }),
]
