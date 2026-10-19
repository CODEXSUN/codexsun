export type ProgressStatus = "in_progress" | "passed" | "recommended";
export type ProgressSavePayload = {
  memberUuid: string;
  stageLevel: string;
  score: number | null;
  assessment: string;
  privateNotes: string;
  status: ProgressStatus;
  programUuid: string | null;
  revision: number;
};
export type ProgressRecord = ProgressSavePayload & {
  uuid: string;
  masterUuid: string;
  gradedAt: string;
  createdAt: string;
  updatedAt: string;
};
export type ProgressPage = {
  items: ProgressRecord[];
  total: number;
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  } | null;
};
export type ProgressColumnFilters = {
  memberUuid?: string;
  masterUuid?: string;
  programUuid?: string;
  stageLevel?: string;
  status?: ProgressStatus;
};
