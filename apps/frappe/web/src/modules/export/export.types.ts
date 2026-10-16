export type LocalExportRow = {
  id: number;
  label: string;
  detail: string | null;
  remoteName: string | null;
  dependency: string | null;
};

export type LocalExportPage = {
  items: LocalExportRow[];
  page: number;
  pageSize: number;
  total: number;
};

export type ExportJob = {
  jobId: number;
  status: string;
  progress: {
    scanned: number;
    exported: number;
    failed: number;
    failures: Array<{ id: number; message: string }>;
    results: Array<{
      id: number;
      outcome: "linked" | "matched" | "new" | "blocked" | "exported";
      remoteName: string | null;
      message: string | null;
    }>;
  } | null;
  errorMessage: string | null;
};
