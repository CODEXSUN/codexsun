export type Tenant = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
  defaultLandingApp:
    | "application"
    | "billing"
    | "accounts"
    | "devkit"
    | "project-manager"
    | "mail"
    | "notes"
    | "chat"
    | "task-manager"
    | "blog"
    | "auditor"
    | "marketing"
    | "crm"
    | "frappe"
    | "zetro"
    | "logicx-erp"
    | "tconnect"
    | "sportsclub"
    | "ecommerce"
    | "qcafe"
    | "hrms"
    | "docs"
    | "codeit"
    | "himsx"
    | "codexsun"
    | "sites";
  id: number;
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  primaryDomain: string;
  slug: string;
  storagePrivateRoot: string;
  storagePublicRoot: string;
  storageRoot: string;
  tenantCode: string;
  tenantName: string;
  uuid: string;
  status: "active" | "inactive" | "provisioning" | "suspended" | string;
};

export type TenantSavePayload = {
  corporateId: string | null;
  dbHost: string;
  dbName: string;
  dbPort: number;
  dbSecretRef: string;
  dbType: string;
  dbUser: string;
  enabledModuleKeys: string[];
  defaultLandingApp:
    | "application"
    | "billing"
    | "accounts"
    | "devkit"
    | "project-manager"
    | "mail"
    | "notes"
    | "chat"
    | "task-manager"
    | "blog"
    | "auditor"
    | "marketing"
    | "crm"
    | "frappe"
    | "zetro"
    | "logicx-erp"
    | "tconnect"
    | "sportsclub"
    | "ecommerce"
    | "qcafe"
    | "hrms"
    | "docs"
    | "codeit"
    | "himsx"
    | "codexsun"
    | "sites";
  mobile: string | null;
  payloadSettings: Record<string, unknown>;
  primaryDomain: string;
  slug: string;
  status: string;
  tenantCode: string;
  tenantName: string;
};

export type AuditEventDTO = {
  actor_email?: string | null;
  created_at?: string;
  event_name: string;
  id: number | string;
};

export type TenantRuntime = {
  apps: Array<{
    alwaysEnabled: boolean;
    defaultLanding: boolean;
    description: string;
    enabled: boolean;
    id:
      | "application"
      | "billing"
      | "accounts"
      | "devkit"
      | "project-manager"
      | "mail"
      | "notes"
      | "chat"
      | "task-manager"
      | "blog"
      | "auditor"
      | "marketing"
      | "crm"
      | "frappe"
      | "zetro"
      | "logicx-erp"
      | "tconnect"
      | "ecommerce"
      | "qcafe"
      | "hrms"
      | "docs"
      | "codeit"
      | "himsx"
      | "codexsun";
    label: string;
    moduleKey: string;
    stack:
      | "platform"
      | "billing"
      | "accounts"
      | "devkit"
      | "project-manager"
      | "mail"
      | "notes"
      | "chat"
      | "platform-task-manager"
      | "blog"
      | "auditor"
      | "marketing"
      | "crm"
      | "frappe"
      | "zetro"
      | "logicx-erp"
      | "tconnect"
      | "ecommerce"
      | "qcafe"
      | "hrms"
      | "docs"
      | "codeit"
      | "himsx"
      | "codexsun";
  }>;
  defaultLandingApp:
    | "application"
    | "billing"
    | "accounts"
    | "devkit"
    | "project-manager"
    | "mail"
    | "notes"
    | "chat"
    | "task-manager"
    | "blog"
    | "auditor"
    | "marketing"
    | "crm"
    | "frappe"
    | "zetro"
    | "logicx-erp"
    | "tconnect"
    | "ecommerce"
    | "qcafe"
    | "hrms"
    | "docs"
    | "codeit"
    | "himsx"
    | "codexsun";
  tenant: Tenant | null;
};
