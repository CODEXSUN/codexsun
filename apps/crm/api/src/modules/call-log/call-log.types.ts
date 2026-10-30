import type { Kysely } from "kysely";

export type CallLogContext = { database: Kysely<unknown>; actorEmail: string };
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
  sourceReference?: string | null | undefined;
  occurredAt?: string | null | undefined;
};

export type CallLogComment = {
  id: number;
  callLogId: number;
  body: string;
  createdBy: string;
  createdAt: string;
};
