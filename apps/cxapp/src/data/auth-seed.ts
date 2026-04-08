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

function buildStorefrontMailFrame(input: {
  eyebrow: string
  title: string
  summary: string
  accentFrom: string
  accentTo: string
  bodyHtml: string
}) {
  return `
    <div style="margin:0;background:#f4efe5;padding:32px 16px;font-family:Arial,sans-serif;color:#201711;">
      <div style="margin:0 auto;max-width:680px;overflow:hidden;border:1px solid #e7dcc9;border-radius:30px;background:#fffaf5;box-shadow:0 20px 60px rgba(88, 56, 31, 0.14);">
        <div style="background:linear-gradient(135deg,${input.accentFrom} 0%,${input.accentTo} 100%);padding:32px 34px;color:#fff7ef;">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.78;">Tm Next Storefront</div>
          <h1 style="margin:14px 0 0;font-size:32px;line-height:1.18;font-weight:700;">${input.title}</h1>
          <p style="margin:12px 0 0;max-width:560px;font-size:14px;line-height:1.75;opacity:0.9;">${input.summary}</p>
          <div style="margin-top:16px;display:inline-flex;align-items:center;border-radius:999px;background:rgba(255,255,255,0.14);padding:8px 12px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">${input.eyebrow}</div>
        </div>
        <div style="padding:32px;">
          ${input.bodyHtml}
        </div>
      </div>
    </div>
  `
}

function buildStorefrontFooter() {
  return `
    <div style="margin-top:28px;border-top:1px solid #eadfce;padding-top:20px;">
      <div style="font-size:12px;line-height:1.8;color:#6f6257;">
        Need help? <a href="{{supportMailTo}}" style="color:#8b5e34;text-decoration:none;">{{supportEmail}}</a> | <a href="{{supportPhoneHref}}" style="color:#8b5e34;text-decoration:none;">{{supportPhone}}</a>
      </div>
      <div style="margin-top:8px;font-size:12px;line-height:1.8;color:#6f6257;">
        Sent by Tm Next - Mail Service
      </div>
    </div>
  `
}

function buildStorefrontButton(hrefKey: string, labelKey: string) {
  return `
    <a href="{{${hrefKey}}}" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;background:#221812;color:#fff7ef;padding:13px 20px;font-size:13px;font-weight:700;text-decoration:none;margin:0 12px 12px 0;">{{${labelKey}}}</a>
  `
}

function buildStorefrontSecondaryButton(hrefKey: string, labelKey: string) {
  return `
    <a href="{{${hrefKey}}}" style="display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid #d8c9b8;color:#3b2a1f;padding:13px 20px;font-size:13px;font-weight:700;text-decoration:none;margin:0 12px 12px 0;">{{${labelKey}}}</a>
  `
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
    "billing:workspace:view",
    "Billing Workspace",
    "Open the billing accounting workspace and review finance operations.",
    "workspace",
    "billing-workspace",
    { appId: "billing", route: "/dashboard/billing", actionKey: "view" }
  ),
  definePermission(
    "billing:vouchers:manage",
    "Billing Voucher Management",
    "Create, edit, reverse, reconcile, and operate billing vouchers and books.",
    "module",
    "billing-vouchers",
    { appId: "billing", route: "/dashboard/billing/voucher-register", actionKey: "manage" }
  ),
  definePermission(
    "billing:vouchers:approve",
    "Billing Voucher Approval",
    "Approve or reject high-risk billing documents in the finance review flow.",
    "module",
    "billing-review",
    { appId: "billing", route: "/dashboard/billing/voucher-register", actionKey: "approve" }
  ),
  definePermission(
    "billing:reports:view",
    "Billing Reports",
    "Review accounting reports, statements, GST books, and finance dashboards.",
    "report",
    "billing-reports",
    { appId: "billing", route: "/dashboard/billing/trial-balance", actionKey: "view" }
  ),
  definePermission(
    "billing:audit:view",
    "Billing Audit Visibility",
    "Review accounting exceptions, control surfaces, and audit-focused finance data.",
    "report",
    "billing-audit",
    { appId: "billing", route: "/dashboard/billing", actionKey: "view" }
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
  definePermission(
    "ecommerce:workspace:view",
    "Ecommerce Workspace",
    "Open the ecommerce operational workspace and review its dashboards.",
    "workspace",
    "ecommerce-workspace",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce", actionKey: "view" }
  ),
  definePermission(
    "ecommerce:storefront:view",
    "Storefront Designer Visibility",
    "Review storefront designers, preview content blocks, and inspect publishing-facing ecommerce settings without edit access.",
    "workspace",
    "ecommerce-storefront",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/storefront", actionKey: "view" }
  ),
  definePermission(
    "ecommerce:storefront:design",
    "Storefront Designer Edit",
    "Edit storefront blocks, campaign content, and publishing-facing ecommerce settings.",
    "workspace",
    "ecommerce-storefront",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/storefront", actionKey: "design" }
  ),
  definePermission(
    "ecommerce:storefront:approve",
    "Storefront Publish Approval",
    "Approve and publish storefront draft changes or rollback live storefront content.",
    "workspace",
    "ecommerce-storefront",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/storefront", actionKey: "approve" }
  ),
  definePermission(
    "ecommerce:storefront:manage",
    "Storefront Management",
    "Manage storefront blocks, campaign content, and publishing-facing ecommerce settings.",
    "workspace",
    "ecommerce-storefront",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/storefront", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:catalog:manage",
    "Ecommerce Catalog Management",
    "Maintain ecommerce product merchandising, collections, and catalog presentation controls.",
    "module",
    "ecommerce-catalog",
    { appId: "ecommerce", route: "/dashboard/apps/core/products", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:orders:manage",
    "Ecommerce Order Operations",
    "Review and operate ecommerce orders, shipment progress, and fulfilment workflows.",
    "module",
    "ecommerce-orders",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/orders", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:customers:manage",
    "Ecommerce Customer Operations",
    "Review customer accounts, lifecycle state, and portal-access actions.",
    "module",
    "ecommerce-customers",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/customers", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:support:manage",
    "Ecommerce Support Operations",
    "Review storefront support cases and linked customer service workflows.",
    "module",
    "ecommerce-support",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/support", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:payments:manage",
    "Ecommerce Payments Operations",
    "Review payment exceptions, refunds, reconciliation, and settlement operations.",
    "module",
    "ecommerce-payments",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/payments", actionKey: "manage" }
  ),
  definePermission(
    "ecommerce:communications:view",
    "Ecommerce Communications Visibility",
    "Review storefront communication health, failures, and customer-facing message activity.",
    "module",
    "ecommerce-communications",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce/communications", actionKey: "view" }
  ),
  definePermission(
    "ecommerce:analytics:view",
    "Ecommerce Analytics",
    "Review ecommerce summaries, KPIs, and reporting surfaces.",
    "module",
    "ecommerce-analytics",
    { appId: "ecommerce", route: "/dashboard/apps/ecommerce", actionKey: "view" }
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
    key: "billing_accountant",
    actorType: "staff",
    name: "Billing Accountant",
    summary: "Owns day-to-day voucher entry, posting review, and finance reporting inside billing.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "vendors:view",
        "billing:workspace:view",
        "billing:vouchers:manage",
        "billing:reports:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "billing_finance_manager",
    actorType: "staff",
    name: "Finance Manager",
    summary: "Approves high-risk accounting actions and reviews finance controls and reports.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "vendors:view",
        "billing:workspace:view",
        "billing:vouchers:manage",
        "billing:vouchers:approve",
        "billing:reports:view",
        "billing:audit:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "billing_auditor",
    actorType: "staff",
    name: "Billing Auditor",
    summary: "Reviews books, exceptions, and audit-facing finance controls without mutation access.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "vendors:view",
        "billing:workspace:view",
        "billing:reports:view",
        "billing:audit:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "billing_cashier",
    actorType: "staff",
    name: "Billing Cashier",
    summary: "Handles cash and bank-linked vouchers, collections, and payment operation entry.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "vendors:view",
        "billing:workspace:view",
        "billing:vouchers:manage",
        "billing:reports:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "billing_operator",
    actorType: "staff",
    name: "Billing Operator",
    summary: "Supports data-entry and register-level accounting operations inside billing.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "vendors:view",
        "billing:workspace:view",
        "billing:vouchers:manage",
      ].includes(permission.key)
    ),
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
    key: "ecommerce_admin",
    actorType: "staff",
    name: "Ecommerce Admin",
    summary: "Broad ecommerce operational control across storefront, orders, support, payments, and communications.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "ecommerce:workspace:view",
        "ecommerce:storefront:view",
        "ecommerce:storefront:design",
        "ecommerce:storefront:approve",
        "ecommerce:storefront:manage",
        "ecommerce:catalog:manage",
        "ecommerce:customers:manage",
        "ecommerce:orders:manage",
        "ecommerce:support:manage",
        "ecommerce:payments:manage",
        "ecommerce:communications:view",
        "ecommerce:analytics:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "ecommerce_catalog_manager",
    actorType: "staff",
    name: "Catalog Manager",
    summary: "Owns ecommerce merchandising, product readiness, and storefront catalog presentation.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "ecommerce:workspace:view",
        "ecommerce:storefront:view",
        "ecommerce:storefront:design",
        "ecommerce:catalog:manage",
        "ecommerce:analytics:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "ecommerce_order_manager",
    actorType: "staff",
    name: "Order Manager",
    summary: "Owns daily ecommerce order handling, fulfilment progression, and delivery operations.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "ecommerce:workspace:view",
        "ecommerce:orders:manage",
        "ecommerce:analytics:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "ecommerce_support_agent",
    actorType: "staff",
    name: "Support Agent",
    summary: "Handles order-linked support cases, customer follow-up, and communication visibility.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "ecommerce:workspace:view",
        "ecommerce:customers:manage",
        "ecommerce:support:manage",
        "ecommerce:communications:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "ecommerce_finance_operator",
    actorType: "staff",
    name: "Finance Operator",
    summary: "Handles payment exceptions, refunds, reconciliation, and settlement visibility for ecommerce.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "ecommerce:workspace:view",
        "ecommerce:payments:manage",
        "ecommerce:communications:view",
        "ecommerce:analytics:view",
      ].includes(permission.key)
    ),
  }),
  defineRole({
    key: "ecommerce_analyst",
    actorType: "staff",
    name: "Analyst",
    summary: "Reviews ecommerce dashboards, operational trends, and reporting without mutation access.",
    permissions: authPermissions.filter((permission) =>
      [
        "dashboard:view",
        "customers:view",
        "ecommerce:workspace:view",
        "ecommerce:storefront:view",
        "ecommerce:communications:view",
        "ecommerce:analytics:view",
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
    subjectTemplate: "Your Tm Next verification code",
    htmlTemplate: `
      <div style="margin:0;background:#f4efe5;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="margin:0 auto;max-width:560px;overflow:hidden;border:1px solid #e7dcc9;border-radius:28px;background:#fffdf8;box-shadow:0 18px 50px rgba(148, 120, 84, 0.14);">
          <div style="background:linear-gradient(135deg,#264653 0%,#3d6b63 100%);padding:28px 32px;color:#f9f6ef;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.74;">Tm Next</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Verify your email address</h1>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.7;opacity:0.88;">Your account request is almost ready. Use the code below to continue registration.</p>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
            <div style="margin:0 0 22px;border:1px solid #d9ead3;border-radius:22px;background:#edf8ec;padding:18px 22px;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#3b6b43;">One-time password</div>
              <div style="margin-top:10px;font-size:34px;letter-spacing:0.36em;font-weight:700;color:#1d4d2b;">{{otp}}</div>
            </div>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#4b5563;">This code expires in <strong>{{expiryMinutes}} minutes</strong>. If you did not request this, you can safely ignore this email.</p>
            <div style="border-top:1px solid #eee4d5;padding-top:16px;font-size:12px;line-height:1.7;color:#6b7280;">Sent by Tm Next - Mail Service</div>
          </div>
        </div>
      </div>
    `,
    textTemplate:
      "Tm Next verification\n\nHello {{displayName}},\nYour verification code is {{otp}}.\nThis code expires in {{expiryMinutes}} minutes.\nIf you did not request this, you can ignore this email.",
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
    subjectTemplate: "Reset your Tm Next password",
    htmlTemplate: `
      <div style="margin:0;background:#f4efe5;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="margin:0 auto;max-width:560px;overflow:hidden;border:1px solid #e7dcc9;border-radius:28px;background:#fffdf8;box-shadow:0 18px 50px rgba(148, 120, 84, 0.14);">
          <div style="background:linear-gradient(135deg,#6b3f1d 0%,#b05f1b 100%);padding:28px 32px;color:#fff7ed;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.74;">Tm Next</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Reset your password</h1>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.7;opacity:0.88;">Use this one-time code to confirm your password reset.</p>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
            <div style="margin:0 0 22px;border:1px solid #f1d0af;border-radius:22px;background:#fff1e2;padding:18px 22px;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#9a4f17;">Reset code</div>
              <div style="margin-top:10px;font-size:34px;letter-spacing:0.36em;font-weight:700;color:#7c2d12;">{{otp}}</div>
            </div>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#4b5563;">This code expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
            <div style="border-top:1px solid #eee4d5;padding-top:16px;font-size:12px;line-height:1.7;color:#6b7280;">Sent by Tm Next - Mail Service</div>
          </div>
        </div>
      </div>
    `,
    textTemplate:
      "Tm Next password reset\n\nHello {{displayName}},\nUse {{otp}} to reset your password.\nThis code expires in {{expiryMinutes}} minutes.",
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
    subjectTemplate: "Restore your Tm Next account",
    htmlTemplate: `
      <div style="margin:0;background:#f4efe5;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2937;">
        <div style="margin:0 auto;max-width:560px;overflow:hidden;border:1px solid #e7dcc9;border-radius:28px;background:#fffdf8;box-shadow:0 18px 50px rgba(148, 120, 84, 0.14);">
          <div style="background:linear-gradient(135deg,#1f4b6e 0%,#326d8f 100%);padding:28px 32px;color:#f0f9ff;">
            <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.74;">Tm Next</div>
            <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2;font-weight:700;">Restore your account</h1>
            <p style="margin:10px 0 0;font-size:14px;line-height:1.7;opacity:0.88;">Use this code to restore access to your account.</p>
          </div>
          <div style="padding:32px;">
            <p style="margin:0 0 18px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
            <div style="margin:0 0 22px;border:1px solid #bfd8ea;border-radius:22px;background:#edf6fb;padding:18px 22px;text-align:center;">
              <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#1d5b83;">Restore code</div>
              <div style="margin-top:10px;font-size:34px;letter-spacing:0.36em;font-weight:700;color:#1f4b6e;">{{otp}}</div>
            </div>
            <p style="margin:0 0 14px;font-size:14px;line-height:1.8;color:#4b5563;">This code expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
            <div style="border-top:1px solid #eee4d5;padding-top:16px;font-size:12px;line-height:1.7;color:#6b7280;">Sent by Tm Next - Mail Service</div>
          </div>
        </div>
      </div>
    `,
    textTemplate:
      "Tm Next account recovery\n\nHello {{displayName}},\nUse {{otp}} to restore your account.\nThis code expires in {{expiryMinutes}} minutes.",
    sampleData: {
      displayName: "Workspace User",
      otp: "123456",
      expiryMinutes: 10,
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-customer-welcome",
    code: "storefront_customer_welcome",
    name: "Storefront Customer Welcome",
    category: "storefront",
    description: "Warm welcome email sent when a new storefront customer account is created.",
    subjectTemplate: "Welcome to {{storeName}}",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Customer portal ready",
      title: "Your storefront account is ready",
      summary:
        "A warm welcome from Tm Next. Your customer portal is open and a fresh set of arrivals is waiting for you.",
      accentFrom: "#5b2f1f",
      accentTo: "#d38b3a",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">{{summary}}</p>
        <div style="margin:0 0 22px;border:1px solid #e7dcc9;border-radius:24px;background:#fffdf9;padding:18px 20px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8b715d;">Storefront note</div>
          <div style="margin-top:8px;font-size:14px;line-height:1.75;color:#3f3128;">{{announcement}}</div>
        </div>
        <div style="margin:0 0 26px;">
          ${buildStorefrontButton("shopNowUrl", "shopNowLabel")}
          ${buildStorefrontSecondaryButton("accountUrl", "accountLabel")}
        </div>
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8b715d;">Fresh arrivals</div>
        <div style="margin-top:16px;font-size:0;">
          {{productCardsHtml}}
        </div>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "Welcome to {{storeName}}\n\nHello {{displayName}},\n{{summary}}\n\nBrowse the store: {{shopNowUrl}}\nOpen your customer portal: {{accountUrl}}\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      storeName: "Tm Next Storefront",
      displayName: "Sundar",
      summary:
        "Your customer portal is live. Browse fresh arrivals, manage orders, and keep your next factory-direct pick just a click away.",
      announcement: "Free shipping on prepaid orders above Rs. 3,999 across the primary storefront catalog.",
      shopNowUrl: "http://localhost:5173/shop/catalog",
      shopNowLabel: "Start shopping",
      accountUrl: "http://localhost:5173/profile",
      accountLabel: "Open customer portal",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
      productCardsHtml:
        "<div style=\"display:inline-block;vertical-align:top;width:calc(50% - 10px);max-width:calc(50% - 10px);margin:0 10px 16px 0;border:1px solid #e6d8c8;border-radius:18px;padding:16px;background:#fffaf4;\">New arrival spotlight 01</div><div style=\"display:inline-block;vertical-align:top;width:calc(50% - 10px);max-width:calc(50% - 10px);margin:0 0 16px 0;border:1px solid #e6d8c8;border-radius:18px;padding:16px;background:#fffaf4;\">New arrival spotlight 02</div><div style=\"display:inline-block;vertical-align:top;width:calc(50% - 10px);max-width:calc(50% - 10px);margin:0 10px 16px 0;border:1px solid #e6d8c8;border-radius:18px;padding:16px;background:#fffaf4;\">New arrival spotlight 03</div><div style=\"display:inline-block;vertical-align:top;width:calc(50% - 10px);max-width:calc(50% - 10px);margin:0 0 16px 0;border:1px solid #e6d8c8;border-radius:18px;padding:16px;background:#fffaf4;\">New arrival spotlight 04</div>",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-campaign-subscription",
    code: "storefront_campaign_subscription",
    name: "Storefront Campaign Subscription",
    category: "storefront",
    description: "Confirmation email sent when a customer opts into storefront campaigns.",
    subjectTemplate: "You are subscribed to {{storeName}} updates",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Campaign updates",
      title: "You are on the list",
      summary:
        "Subscribers receive new-arrival drops, curated offers, and campaign-led storefront notes before the wider audience.",
      accentFrom: "#50301f",
      accentTo: "#b26c33",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">{{summary}}</p>
        <div style="margin:0 0 24px;border:1px solid #eed8bf;border-radius:24px;background:#fff5e9;padding:18px 20px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#a45a1f;">What you will get</div>
          <ul style="margin:12px 0 0;padding-left:18px;color:#4f3f33;font-size:14px;line-height:1.8;">
            <li>First look at curated new arrivals</li>
            <li>Limited storefront promotions</li>
            <li>Customer-only campaign notes and launch reminders</li>
          </ul>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin:0 0 18px;">
          ${buildStorefrontButton("catalogUrl", "catalogLabel")}
        </div>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "You are subscribed to {{storeName}} updates\n\nHello {{displayName}},\n{{summary}}\n\nBrowse latest arrivals: {{catalogUrl}}\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      storeName: "Tm Next Storefront",
      displayName: "Sundar",
      summary:
        "You are subscribed to launch drops, curated offers, and customer-only campaign notes from the storefront.",
      catalogUrl: "http://localhost:5173/shop/catalog",
      catalogLabel: "Browse latest arrivals",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-order-confirmed",
    code: "storefront_order_confirmed",
    name: "Storefront Order Confirmed",
    category: "storefront",
    description: "Order confirmation email sent after a storefront payment is verified.",
    subjectTemplate: "Your order {{orderNumber}} is confirmed",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Order confirmed",
      title: "Your order is locked in",
      summary:
        "Payment is captured and the storefront team can move into fulfillment. The full order summary stays below for a quick review.",
      accentFrom: "#6d2e1f",
      accentTo: "#e08a32",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <div style="margin:0 0 24px;border:1px solid #f2d7bf;border-radius:24px;background:#fff3e6;padding:22px;">
          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b561d;">Order reference</div>
              <div style="margin-top:8px;font-size:22px;line-height:1.2;font-weight:700;color:#4f2618;">{{orderNumber}}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b561d;">Grand total</div>
              <div style="margin-top:8px;font-size:22px;line-height:1.2;font-weight:700;color:#4f2618;">{{totalAmount}}</div>
            </div>
          </div>
          <div style="margin-top:12px;font-size:13px;line-height:1.8;color:#7a4b2d;">Status: {{orderStatus}} | Payment: {{paymentStatus}} | Purchased: {{purchasedAt}}</div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:0 0 24px;">
          {{milestoneCardsHtml}}
        </div>
        <div style="font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#8b715d;">Purchased items</div>
        <div style="margin-top:18px;">
          {{orderItemsHtml}}
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin:24px 0 0;">
          ${buildStorefrontButton("orderUrl", "orderUrlLabel")}
          ${buildStorefrontSecondaryButton("reviewUrl", "orderUrlLabel")}
        </div>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "Your order {{orderNumber}} is confirmed\n\nHello {{displayName}},\nTotal: {{totalAmount}}\nStatus: {{orderStatus}}\nPayment: {{paymentStatus}}\nPurchased: {{purchasedAt}}\n\nOpen order details: {{orderUrl}}\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      storeName: "Tm Next Storefront",
      displayName: "Sundar",
      orderNumber: "ECM-20260406-0001",
      orderStatus: "confirmed",
      totalAmount: "Rs. 4,499",
      purchasedAt: "Apr 6, 2026, 5:30 PM",
      paymentStatus: "paid",
      orderUrl: "http://localhost:5173/customer/orders/storefront-order%3A123",
      orderUrlLabel: "Open order details",
      reviewUrl: "http://localhost:5173/customer/orders/storefront-order%3A123",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
      milestoneCardsHtml:
        "<div style=\"border-radius:18px;background:#edf7ee;padding:14px;\">Purchased</div>",
      orderItemsHtml:
        "<div style=\"border:1px solid #eadfce;border-radius:18px;padding:14px;background:#fffaf4;\">Order item summary</div>",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-payment-failed",
    code: "storefront_payment_failed",
    name: "Storefront Payment Failed",
    category: "storefront",
    description: "Payment recovery email sent when a storefront payment attempt fails.",
    subjectTemplate: "Payment issue for order {{orderNumber}}",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Payment action needed",
      title: "Your order is waiting for payment recovery",
      summary:
        "The order is still safe in the storefront, but the last payment attempt did not complete successfully.",
      accentFrom: "#6d241f",
      accentTo: "#d06d42",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">We could not complete payment for order <strong>{{orderNumber}}</strong>. {{failureReason}}</p>
        <div style="margin:0 0 24px;border:1px solid #f2d7bf;border-radius:24px;background:#fff3e6;padding:22px;">
          <div style="display:flex;flex-wrap:wrap;gap:16px;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b561d;">Order reference</div>
              <div style="margin-top:8px;font-size:22px;line-height:1.2;font-weight:700;color:#4f2618;">{{orderNumber}}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#9b561d;">Amount pending</div>
              <div style="margin-top:8px;font-size:22px;line-height:1.2;font-weight:700;color:#4f2618;">{{totalAmount}}</div>
            </div>
          </div>
          <div style="margin-top:12px;font-size:13px;line-height:1.8;color:#7a4b2d;">Current order status: {{orderStatus}} | Payment status: {{paymentStatus}}</div>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin:0 0 18px;">
          ${buildStorefrontButton("checkoutUrl", "checkoutLabel")}
          ${buildStorefrontSecondaryButton("orderUrl", "orderLabel")}
        </div>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "Payment issue for order {{orderNumber}}\n\nHello {{displayName}},\nWe could not complete payment for your order. {{failureReason}}\nAmount pending: {{totalAmount}}\nOrder status: {{orderStatus}}\nPayment status: {{paymentStatus}}\n\nRetry checkout: {{checkoutUrl}}\nOpen order: {{orderUrl}}\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      displayName: "Sundar",
      orderNumber: "ECM-20260406-0002",
      totalAmount: "Rs. 4,499",
      orderStatus: "payment pending",
      paymentStatus: "failed",
      failureReason: "Your bank declined the transaction. You can retry using the same order.",
      checkoutUrl: "http://localhost:5173/shop/checkout",
      checkoutLabel: "Retry payment",
      orderUrl: "http://localhost:5173/customer/orders/storefront-order%3A123",
      orderLabel: "Open order",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-order-review-request",
    code: "storefront_order_review_request",
    name: "Storefront Order Review Request",
    category: "storefront",
    description: "Review request template kept ready for delivered storefront orders.",
    subjectTemplate: "How did order {{orderNumber}} feel?",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Review request",
      title: "Tell us how your order felt",
      summary:
        "A short review helps the storefront team improve fit, finish, and service details for the next customer.",
      accentFrom: "#5a321d",
      accentTo: "#c27a3f",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">Your order <strong>{{orderNumber}}</strong> has reached you. If the fit, fabric, and finish matched expectations, a quick review would help the next buyer.</p>
        <div style="display:flex;flex-wrap:wrap;gap:12px;margin:0 0 18px;">
          ${buildStorefrontButton("reviewUrl", "reviewLabel")}
        </div>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "How did order {{orderNumber}} feel?\n\nHello {{displayName}},\nLeave a quick review here: {{reviewUrl}}\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      displayName: "Sundar",
      orderNumber: "ECM-20260406-0001",
      reviewUrl: "http://localhost:5173/customer/orders/storefront-order%3A123",
      reviewLabel: "Leave a review",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-order-shipped",
    code: "storefront_order_shipped",
    name: "Storefront Order Shipped",
    category: "storefront",
    description: "Shipment update template ready for storefront fulfillment events.",
    subjectTemplate: "Order {{orderNumber}} is on the way",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Shipment update",
      title: "Your order is moving",
      summary:
        "A ready-to-use shipment notification template for future fulfillment automation inside the storefront.",
      accentFrom: "#1f4966",
      accentTo: "#4f7897",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">Order <strong>{{orderNumber}}</strong> is on the way. Tracking and delivery updates can be shared through this template when shipment events are connected.</p>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "Order {{orderNumber}} is on the way\n\nHello {{displayName}},\nTracking updates will follow.\nSupport: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      displayName: "Sundar",
      orderNumber: "ECM-20260406-0001",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
    },
    isSystem: true,
    isActive: true,
  }),
  defineMailboxTemplate({
    id: "mailbox-template:storefront-order-delivered",
    code: "storefront_order_delivered",
    name: "Storefront Order Delivered",
    category: "storefront",
    description: "Delivery confirmation template ready for storefront fulfillment events.",
    subjectTemplate: "Order {{orderNumber}} was delivered",
    htmlTemplate: buildStorefrontMailFrame({
      eyebrow: "Delivered",
      title: "Your order has arrived",
      summary:
        "A delivery confirmation template kept ready for future storefront automation and follow-up care.",
      accentFrom: "#214d38",
      accentTo: "#5a876a",
      bodyHtml: `
        <p style="margin:0 0 14px;font-size:15px;line-height:1.8;">Hello {{displayName}},</p>
        <p style="margin:0 0 18px;font-size:14px;line-height:1.8;color:#5f5146;">Order <strong>{{orderNumber}}</strong> shows as delivered. If anything feels off, support is ready below.</p>
        ${buildStorefrontFooter()}
      `,
    }),
    textTemplate:
      "Order {{orderNumber}} was delivered\n\nHello {{displayName}},\nIf anything feels off, contact support: {{supportEmail}} | {{supportPhone}}",
    sampleData: {
      displayName: "Sundar",
      orderNumber: "ECM-20260406-0001",
      supportEmail: "info@tmnext.in",
      supportMailTo: "mailto:info@tmnext.in",
      supportPhone: "+91 90000 12345",
      supportPhoneHref: "tel:+919000012345",
    },
    isSystem: true,
    isActive: true,
  }),
]
