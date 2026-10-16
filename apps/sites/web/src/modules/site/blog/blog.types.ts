export type { BlogContent, BlogRecord } from "@codexsun/sites-api/blog-contract";
import type { BlogContent, BlogRecord } from "@codexsun/sites-api/blog-contract";
export type BlogGateway = {
  list(siteUuid: string): Promise<BlogRecord[]>;
  save(
    siteUuid: string,
    uuid: string | null,
    content: BlogContent,
    revision: number
  ): Promise<BlogRecord>;
  publication(siteUuid: string, post: BlogRecord, publish: boolean): Promise<BlogRecord[]>;
  remove(siteUuid: string, post: BlogRecord): Promise<{ deleted: boolean }>;
};
