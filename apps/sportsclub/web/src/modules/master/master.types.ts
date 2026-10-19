import type { ListResponse } from "../../sportsclub-pagination.types";

export type MasterStatus = "active" | "suspended";

export type MasterSavePayload = {
  email: string;
  name: string;
  phone: string;
  title: string;
  primaryDiscipline: string;
  publicBio: string;
  privateNotes: string;
  experienceYears: number;
  isApprovedPublic: boolean;
  status: MasterStatus;
  sortOrder: number;
  revision: number;
};

export type MasterRecord = MasterSavePayload & {
  id?: number | undefined;
  uuid: string;
  assignedStudentsCount?: number | undefined;
  createdAt: string;
  updatedAt: string;
};

export type MasterPage = ListResponse<MasterRecord>;

export type MasterLookup = {
  uuid: string;
  name: string;
  title: string;
  primaryDiscipline: string;
  status: MasterStatus;
};

export type MasterColumnFilters = {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  title?: string | undefined;
  primaryDiscipline?: string | undefined;
  status?: string | undefined;
};
