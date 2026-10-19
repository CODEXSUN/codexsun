export type MemberStatus = "pending" | "active" | "suspended";

export type MemberSavePayload = {
  fullName: string;
  dateOfBirth?: string | null | undefined;
  gender: "male" | "female" | "other";
  bloodGroup?: string | null | undefined;
  guardianName?: string | null | undefined;
  guardianRelation?: string | null | undefined;
  guardianPhone?: string | null | undefined;
  emergencyContact?: string | null | undefined;
  address?: string | null | undefined;
  currentLevel: string;
  masterUuid?: string | null | undefined;
  status: MemberStatus;
};

export type MemberRecord = MemberSavePayload & {
  id: number;
  uuid: string;
  memberNo: string;
  masterName?: string | null | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type MemberPage = {
  items: MemberRecord[];
  total: number;
};

export type MemberLookup = {
  id: number;
  uuid: string;
  name: string;
  memberNo: string;
  currentLevel?: string | undefined;
  status: MemberStatus;
};

export type MemberColumnFilters = {
  memberNo?: string | undefined;
  fullName?: string | undefined;
  currentLevel?: string | undefined;
  status?: string | undefined;
  masterUuid?: string | undefined;
};
