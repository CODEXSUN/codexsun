export interface KnowledgeRecord {
  uuid: string;
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
  revision: number;
  hasOverride: boolean;
  updatedAt: string;
}
export interface KnowledgePage extends KnowledgeRecord {
  body: string;
  format: "md" | "mdx";
  origin: "repository" | "database";
  activity: { action: string; actor: string; summary: string; createdAt: string }[];
}
export interface KnowledgeInput {
  body: string | null;
  expectedRevision: number;
}
export interface KnowledgeCatalog {
  pages: KnowledgeRecord[];
  canEdit: boolean;
}
export interface KnowledgeGateway {
  catalog: () => Promise<KnowledgeCatalog>;
  page: (uuid: string) => Promise<KnowledgePage>;
  save: (uuid: string, input: KnowledgeInput) => Promise<KnowledgePage>;
}
