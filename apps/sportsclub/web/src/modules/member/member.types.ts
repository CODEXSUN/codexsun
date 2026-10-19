import type { ListResponse } from "../../sportsclub-pagination.types";

export type MemberRole = "student" | "master";
export type MemberStatus = "pending" | "active" | "suspended" | "graduated";

export type MemberSavePayload = {
  email: string;
  name: string;
  phone?: string | undefined;
  dateOfBirth?: string | null | undefined;
  gender?: string | null | undefined;
  guardianName?: string | null | undefined;
  guardianPhone?: string | null | undefined;
  emergencyContact?: string | null | undefined;
  medicalNotes?: string | undefined;
  address?: string | undefined;
  programUuid?: string | null | undefined;
  masterUuid?: string | null | undefined;
  role?: MemberRole | undefined;
  status?: MemberStatus | undefined;
  progressNote?: string | undefined;
  revision?: number | undefined;
};

export type MemberRecord = MemberSavePayload & {
  id?: number | undefined;
  uuid: string;
  memberNo?: string | undefined;
  masterName?: string | null | undefined;
  programName?: string | null | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type MemberPage = ListResponse<MemberRecord>;

export type MemberLookup = {
  uuid: string;
  name: string;
  role: MemberRole;
  status: MemberStatus;
};

export type MemberColumnFilters = {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  status?: string | undefined;
  role?: string | undefined;
  programUuid?: string | undefined;
  masterUuid?: string | undefined;
};
