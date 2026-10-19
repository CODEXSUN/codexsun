export type ProgramStatus = "active" | "inactive";

export type ProgramSavePayload = {
  title: string;
  slug: string;
  description: string;
  category: "silambam" | "varma" | "traditional" | "fitness";
  skillLevels: string;
  isApprovedPublic: boolean;
  status: ProgramStatus;
};

export type ProgramRecord = ProgramSavePayload & {
  id: number;
  uuid: string;
  activeSessionsCount?: number;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgramPage = {
  items: ProgramRecord[];
  total: number;
};

export type ProgramLookup = {
  id: number;
  uuid: string;
  title: string;
  slug: string;
  category: string;
  status: ProgramStatus;
};

export type ProgramColumnFilters = {
  title?: string;
  category?: string;
  status?: string;
};
