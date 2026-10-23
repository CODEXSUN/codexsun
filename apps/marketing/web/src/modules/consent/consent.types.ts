export type ConsentInput = {
  brandUuid: string;
  recipient: string;
  channel: "email";
  purpose: "promotional";
  action: "grant" | "withdraw";
  noticeVersion: string;
  evidence: string;
  source: string;
  occurredAt: string;
  expiresAt: string | null;
  requestKey: string;
};
export type ConsentRecord = ConsentInput & {
  uuid: string;
  companyId: number;
  createdBy: string;
  createdAt: string;
};
export type EligibilityResult = {
  eligible: boolean;
  checkedAt: string;
  consentUuid: string | null;
  reasons: string[];
};
