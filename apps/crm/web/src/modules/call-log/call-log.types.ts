export type CallLogRecord = {
  name: string;
  from: string;
  to: string;
  type: string;
  status: string;
  duration: number;
  receiver: string;
  caller: string;
  createdAt: string;
  startedAt: string;
};

export type CallLogPage = {
  items: CallLogRecord[];
  page: number;
  pageSize: number;
  hasMore: boolean;
};

export type CallLogFilters = {
  page: number;
  pageSize: number;
  search: string;
  type: string;
  status: string;
};

export type CallLogInput = {
  type: "Incoming" | "Outgoing";
  from: string;
  to: string;
  status: string;
  duration: number;
  user: string | null;
};
