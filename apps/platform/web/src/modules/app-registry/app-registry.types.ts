export type PlatformApp = {
  alwaysEnabled: boolean;
  appId: string;
  defaultLanding: boolean;
  description: string;
  id: number;
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
    | "logicx-erp"
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
export type PlatformAppSavePayload = Omit<PlatformApp, "id" | "uuid">;
