export type CampaignInput = {
  expectedRevision?: number | undefined;
  brandUuid: string;
  name: string;
  objective: string;
  channel:
    | "website"
    | "facebook"
    | "instagram"
    | "whatsapp"
    | "linkedin"
    | "google-ads"
    | "google-business"
    | "youtube"
    | "threads"
    | "pinterest"
    | "x"
    | "telegram"
    | "email";
  landingUrl: string;
  status: "active" | "inactive";
};
export type CampaignRecord = CampaignInput & {
  revision: number;
  uuid: string;
  companyId: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
export type CampaignActivity = { action: string; actor: string; occurredAt: string };
