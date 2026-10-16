export type FrappeCallLog = {
  name: string;
  from: string | null;
  to: string | null;
  direction: string | null;
  status: string | null;
  startedAt: string | null;
  localCallLogId: number | null;
};
export type FrappeCallLogPage = {
  items: FrappeCallLog[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};
