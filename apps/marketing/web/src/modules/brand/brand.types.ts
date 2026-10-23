export type BrandInput = {
  expectedRevision?: number | undefined;
  name: string;
  timezone: string;
  website: string;
  status: "active" | "inactive";
};
export type BrandRecord = BrandInput & {
  revision: number;
  uuid: string;
  companyId: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
