export type ProgressStatus = "eligible" | "in_progress" | "passed" | "retry";

export type ProgressSavePayload = {
  memberUuid: string;
  masterUuid: string;
  stageLevel: string;
  assessmentDate: string;
  status: ProgressStatus;
  certificateNo?: string | null | undefined;
  evaluationNotes?: string | null | undefined;
};

export type ProgressRecord = ProgressSavePayload & {
  id: number;
  uuid: string;
  studentName?: string | null | undefined;
  studentMemberNo?: string | null | undefined;
  masterName?: string | null | undefined;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export type ProgressPage = {
  items: ProgressRecord[];
  total: number;
};

export type ProgressColumnFilters = {
  memberUuid?: string | undefined;
  masterUuid?: string | undefined;
  stageLevel?: string | undefined;
  status?: string | undefined;
};
