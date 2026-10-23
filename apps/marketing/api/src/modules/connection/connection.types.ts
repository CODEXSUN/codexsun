export type ConnectionInput = {
  expectedRevision?: number | undefined;
  brandUuid: string;
  name: string;
  provider:
    | "facebook"
    | "instagram"
    | "whatsapp"
    | "linkedin"
    | "google"
    | "threads"
    | "pinterest"
    | "x"
    | "telegram"
    | "email";
  externalAccountId: string;
  status: "active" | "inactive";
};
export type ConnectionRecord = ConnectionInput & {
  revision: number;
  uuid: string;
  companyId: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
export type ConnectionActivity = { action: string; actor: string; occurredAt: string };
