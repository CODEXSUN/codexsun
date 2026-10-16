import type { FastifyRequest } from "fastify";
import type { Kysely } from "kysely";

export type NoteStatus = "active" | "inactive";

export type NoteRuntimeContext = {
  actorEmail: string;
  authorize: (permission: string) => Promise<void>;
  companyId: number;
  database: Kysely<Record<string, Record<string, unknown>>>;
  tenantDatabase: string;
  tenantId: string;
};

export type NoteModuleDependencies = {
  resolveContext: (request: FastifyRequest) => NoteRuntimeContext | Promise<NoteRuntimeContext>;
};

export type NoteSavePayload = {
  body: string;
  title: string;
};

export type NoteListFilters = {
  limit?: number;
  search?: string;
  status?: NoteStatus;
};

export type Note = {
  body: string;
  createdAt: string;
  id: number;
  status: NoteStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};
