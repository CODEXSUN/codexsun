export type BrandInput = { name: string; timezone: string; website: string; status: "active" | "inactive"; };
export type BrandRecord = BrandInput & { uuid: string; companyId: number; createdBy: string; updatedBy: string; createdAt: string; updatedAt: string; };
export type BrandActivity = { action: string; actor: string; occurredAt: string; };
