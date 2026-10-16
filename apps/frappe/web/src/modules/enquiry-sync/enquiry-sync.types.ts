export type RemoteEnquiry = {
  name: string;
  title: string;
  mobile: string | null;
  date: string | null;
  status: string | null;
  priority: string | null;
  modifiedAt: string | null;
  localEnquiryId: number | null;
};

export type RemoteEnquiryPage = {
  hasMore: boolean;
  items: RemoteEnquiry[];
  page: number;
  pageSize: number;
  total: number;
};

export type EnquiryImportJob = {
  jobId: number;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  progress: {
    scanned: number;
    created: number;
    skipped: number;
    failed: number;
    failures: { name: string; message: string }[];
  } | null;
  errorMessage: string | null;
};

export type FrappeConnectionState = {
  configured: boolean;
  enabled: boolean;
  baseUrl: string | null;
};

export type SyncQueueStatus = "all" | "pending" | "processing" | "retry" | "failed" | "synced";

export type SyncQueueEvent = {
  id: number;
  enquiryId: number;
  enquiryNo: number;
  title: string;
  eventType: string;
  status: Exclude<SyncQueueStatus, "all">;
  attempts: number;
  remoteName: string | null;
  lastError: string | null;
  createdAt: string;
};

export type SyncQueuePage = {
  items: SyncQueueEvent[];
  page: number;
  pageSize: number;
  total: number;
};
