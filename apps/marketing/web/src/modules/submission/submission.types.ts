export type SubmissionInput = {
  captureUuid: string;
  sourceKey: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyConsent: true;
  sourceReference?: string;
  sourceConsentAt?: string;
  sourceNoticeVersion?: string;
};
export type SubmissionRecord = SubmissionInput & {
  sourceReference: string;
  sourceConsentAt: string;
  sourceNoticeVersion: string;
  uuid: string;
  companyId: number;
  brandUuid: string;
  campaignUuid: string;
  campaignLabel: string;
  noticeVersion: string;
  consentNotice: string;
  createdAt: string;
  createdBy: string;
  status: "pending" | "delivered";
  leadUuid: string | null;
};
