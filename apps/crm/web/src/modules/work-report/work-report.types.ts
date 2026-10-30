export type WorkReportTarget = { enquiryId: number | null; taskId: number | null };
export type WorkReport = {
  id: number;
  uuid: string;
  action: string;
  comment_id?: number | null;
  body: string;
  amount: string | number | null;
  latitude: string | null;
  longitude: string | null;
  accuracy_meters: string | null;
  captured_at: string | null;
  created_by: string;
  created_by_name?: string;
  created_at: string;
};
export type WorkReportPayload = WorkReportTarget & {
  action: "report" | "check-in" | "check-out" | "charge" | "collection";
  body: string;
  amount: number | null;
  requestId: string;
  latitude: number | null;
  longitude: number | null;
  accuracyMeters: number | null;
  capturedAt: string | null;
};
export type WorkReportHistoryFilter = "all" | "checkpoints" | "charges";
export type WorkReportHistory = {
  items: WorkReport[];
  total: number;
  page: number;
  pageSize: number;
  amounts: { charges: number; collections: number };
};
