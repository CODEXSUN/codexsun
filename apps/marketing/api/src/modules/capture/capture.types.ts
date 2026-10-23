export type CaptureInput = { brandUuid: string; campaignUuid: string; name: string; allowedOrigin: string; consentNotice: string; noticeVersion: string; status: "active" | "inactive"; };
export type CaptureRecord = CaptureInput & { uuid: string; companyId: number; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string; };
export type CaptureActivity = { action: string; actor: string; occurredAt: string; };
