import type { Kysely } from "kysely";
export type KnowledgePermission = "docs.knowledge.view" | "docs.knowledge.edit";
export interface KnowledgeSource {
  pageKey: string;
  appKey: string;
  appLabel: string;
  groupKey: string;
  groupLabel: string;
  moduleKey: string;
  title: string;
  summary: string;
  sourcePath: string;
  sourceHash: string;
  sortOrder: number;
}
export interface KnowledgeRecord extends KnowledgeSource {
  uuid: string;
  revision: number;
  hasOverride: boolean;
  updatedAt: string;
}
export interface KnowledgePage extends KnowledgeRecord {
  body: string;
  format: "md" | "mdx";
  origin: "repository" | "database";
  activity: KnowledgeActivity[];
}
export interface KnowledgeActivity {
  action: string;
  actor: string;
  summary: string;
  createdAt: string;
}
export interface KnowledgeInput {
  body: string | null;
  expectedRevision: number;
}
export type KnowledgeDatabase = {
  docs_knowledge_pages: { id: number };
  docs_knowledge_activity: { id: number };
  app_permissions: { id: number; key: string };
  app_role_permissions: { id: number; role_id: number; permission_id: number };
  app_roles: { id: number; key: string };
};
export type KnowledgeContext = {
  database: Kysely<KnowledgeDatabase>;
  actorEmail: string;
  authorize: (permission: KnowledgePermission) => Promise<void>;
};
export interface DeveloperReference {
  title: string;
  pageKey: string;
  url: string;
  sourcePath: string;
  sourceHash: string;
  revision: number;
  origin: "repository" | "database";
  excerpt: string;
}
