import type { MarketingContext } from "../../context.js";
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
export type CaptureSnapshot = {
  uuid: string;
  brandUuid: string;
  campaignUuid: string;
  name: string;
  noticeVersion: string;
  consentNotice: string;
  status: "active" | "inactive";
};
export type SubmissionDependencies = {
  capture(context: MarketingContext, uuid: string): Promise<CaptureSnapshot>;
  campaign(context: MarketingContext, uuid: string): Promise<{ name: string; status: string }>;
  enqueue(context: MarketingContext, uuid: string): Promise<void>;
};
