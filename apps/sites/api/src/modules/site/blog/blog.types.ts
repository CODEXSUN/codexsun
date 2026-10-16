import type { Generated } from "kysely";
export type BlogDatabase = {
  sites_blog_posts: {
    id: Generated<number>;
    uuid: string;
    site_id: number;
    slug: string;
    content_json: string;
    published_json: string | null;
    revision: number;
    published_revision: number;
    updated_at: string;
  };
  sites_blog_activity: {
    id: Generated<number>;
    post_uuid: string;
    site_id: number;
    actor: string;
    action: string;
    revision: number;
    created_at: string;
  };
};
