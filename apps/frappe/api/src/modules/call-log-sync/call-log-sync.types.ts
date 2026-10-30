export type CallLogImportProgress = {
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  failures: Array<{ name: string; message: string }>;
};
