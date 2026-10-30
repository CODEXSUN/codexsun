import { blogRecordSchema } from "@codexsun/sites-api/blog-contract";
import type { BlogGateway } from "./blog.types.js";
export function createBlogGateway(client: {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
  put<T>(url: string, body: unknown): Promise<T>;
}): BlogGateway {
  return {
    list: async (uuid) =>
      (await client.get<unknown[]>(`/sites/${uuid}/blogs`)).map((row) =>
        blogRecordSchema.parse(row)
      ),
    save: async (siteUuid, uuid, content, revision) =>
      blogRecordSchema.parse(
        uuid
          ? await client.put(`/sites/${siteUuid}/blogs/${uuid}`, { content, revision })
          : await client.post(`/sites/${siteUuid}/blogs`, { content, revision })
      ),
    publication: async (siteUuid, post, publish) =>
      (
        await client.post<unknown[]>(
          `/sites/${siteUuid}/blogs/${post.uuid}/${publish ? "publish" : "unpublish"}`,
          { revision: post.revision }
        )
      ).map((row) => blogRecordSchema.parse(row)),
    remove: (siteUuid, post) =>
      client.post(`/sites/${siteUuid}/blogs/${post.uuid}/delete`, { revision: post.revision })
  };
}
