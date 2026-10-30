export type PlatformAppId =
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
  | "codexsun"
  | "sites"
  | "sportsclub";

export type PlatformAppDefinition = {
  alwaysEnabled: boolean;
  defaultLanding: boolean;
  description: string;
  id: number;
  appId: PlatformAppId;
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
    | "codexsun"
    | "sites"
    | "sportsclub";
  uuid: string;
};

export type PlatformAppSavePayload = Omit<PlatformAppDefinition, "id" | "uuid">;
