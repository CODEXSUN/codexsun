import type { ColumnType, Generated } from "kysely";

export type SiteStatus = "active" | "draft" | "suspended";

export type SitesPortfolioTable = {
  created_at: ColumnType<string, never, never>;
  description: ColumnType<string, string | undefined, string | undefined>;
  id: Generated<number>;
  name: string;
  port: ColumnType<number, number | undefined, number | undefined>;
  primary_domain: string;
  published_pages: ColumnType<number, number | undefined, number | undefined>;
  slug: string;
  status: ColumnType<SiteStatus, SiteStatus | undefined, SiteStatus | undefined>;
  theme_key: string;
  updated_at: ColumnType<string, never, never>;
  uuid: string;
};

export type SitesDatabase = {
  sites_portfolio_sites: SitesPortfolioTable;
};

export type CmsSite = {
  createdAt: string;
  description: string;
  id: number;
  name: string;
  port: number;
  primaryDomain: string;
  publishedPages: number;
  slug: string;
  status: SiteStatus;
  themeKey: string;
  updatedAt: string;
  uuid: string;
};

export type SiteCreatePayload = {
  description?: string | undefined;
  name: string;
  port?: number | undefined;
  primaryDomain: string;
  slug: string;
  themeKey: string;
};

export type SiteUpdatePayload = {
  description?: string | undefined;
  name: string;
  port?: number | undefined;
  primaryDomain: string;
  slug: string;
  themeKey: string;
};

export type SitesRequestContext = {
  actorEmail?: string | undefined;
  database: unknown;
  tenantId: string;
};
