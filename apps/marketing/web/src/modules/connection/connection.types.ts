export type ConnectionInput = {
  expectedRevision?: number | undefined;
  brandUuid: string;
  name: string;
  provider: string;
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
