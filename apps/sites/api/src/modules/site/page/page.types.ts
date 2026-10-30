import type { Generated } from "kysely";
export type PageDatabase = {
  sites_pages: {
    id: Generated<number>;
    uuid: string;
    site_id: number;
    content_json: string;
    published_json: string | null;
    revision: number;
    published_revision: number;
    updated_at: string;
  };
  sites_page_activity: {
    id: Generated<number>;
    page_uuid: string;
    actor: string;
    action: string;
    revision: number;
    created_at: string;
  };
};
export type PageOwner = {
  id: number;
  uuid: string;
  slug: string;
  status: string;
  name?: string;
  primaryDomain?: string;
  description?: string;
};
