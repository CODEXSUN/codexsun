export type CaptureInput = {
  expectedRevision?: number | undefined;
  brandUuid: string;
  campaignUuid: string;
  name: string;
  allowedOrigin: string;
  consentNotice: string;
  noticeVersion: string;
  status: "active" | "inactive";
};
export type CaptureRecord = CaptureInput & {
  revision: number;
  uuid: string;
  companyId: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
