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
  | "crm"
  | "frappe"
  | "zetro"
  | "logicx-erp"
  | "tconnect"
  | "ecommerce"
  | "qcafe"
  | "hrms"
  | "docs"
  | "himsx"
  | "codexsun"
  | "sites";

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
    | "crm"
    | "frappe"
    | "zetro"
    | "logicx-erp"
    | "tconnect"
    | "ecommerce"
    | "qcafe"
    | "hrms"
    | "docs"
    | "himsx"
    | "codexsun"
    | "sites";
  uuid: string;
};

export type PlatformAppSavePayload = Omit<PlatformAppDefinition, "id" | "uuid">;
