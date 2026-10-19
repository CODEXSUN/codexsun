export type MasterStatus = "active" | "inactive";

export type MasterSavePayload = {
  fullName: string;
  title: string;
  biography?: string | null | undefined;
  phone?: string | null | undefined;
  email?: string | null | undefined;
  specialization: string;
  experienceYears?: number | null | undefined;
  isApprovedPublic: boolean;
  status: MasterStatus;
};

export type MasterRecord = MasterSavePayload & {
  id: number;
  uuid: string;
  assignedStudentsCount?: number | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type MasterPage = {
  items: MasterRecord[];
  total: number;
};

export type MasterLookup = {
  id: number;
  uuid: string;
  name: string;
  title: string;
  specialization: string;
  status: MasterStatus;
};

export type MasterColumnFilters = {
  fullName?: string | undefined;
  title?: string | undefined;
  specialization?: string | undefined;
  status?: string | undefined;
};
