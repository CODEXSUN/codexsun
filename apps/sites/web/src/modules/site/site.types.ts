export type SiteStatus = "active" | "draft" | "suspended";

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

export type SitePayload = {
  description?: string | undefined;
  name: string;
  port?: number | undefined;
  primaryDomain: string;
  slug: string;
  themeKey: string;
};

export type SiteGateway = {
  create(payload: SitePayload): Promise<CmsSite>;
  delete(uuid: string): Promise<{ deleted: boolean; uuid: string }>;
  get(uuid: string): Promise<CmsSite>;
  list(): Promise<CmsSite[]>;
  restore(uuid: string): Promise<CmsSite>;
  suspend(uuid: string): Promise<CmsSite>;
  update(uuid: string, payload: SitePayload): Promise<CmsSite>;
};
