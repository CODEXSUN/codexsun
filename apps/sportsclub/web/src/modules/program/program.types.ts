import type { ListResponse } from "../../sportsclub-pagination.types";

export type ProgramLevel = "beginner" | "intermediate" | "advanced" | "all_levels";
export type ProgramStatus = "active" | "inactive";

export type ProgramSavePayload = {
  code: string;
  name: string;
  discipline: string;
  description: string;
  level: ProgramLevel;
  ageGroup: string;
  isApprovedPublic: boolean;
  status: ProgramStatus;
  sortOrder: number;
  revision: number;
};

export type ProgramRecord = ProgramSavePayload & {
  id?: number | undefined;
  uuid: string;
  activeSessionsCount?: number | undefined;
  createdAt: string;
  updatedAt: string;
};

export type ProgramPage = ListResponse<ProgramRecord>;

export type ProgramLookup = {
  uuid: string;
  code: string;
  name: string;
  discipline: string;
  status: ProgramStatus;
};

export type ProgramColumnFilters = {
  code?: string | undefined;
  name?: string | undefined;
  discipline?: string | undefined;
  level?: string | undefined;
  status?: string | undefined;
  ageGroup?: string | undefined;
};
