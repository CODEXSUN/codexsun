import { pageStateSchema, pageContentSchema } from "@codexsun/sites-api/page-contract";
import type { PageGateway } from "./page.types.js";
export function createPageGateway(client: {
  get<T>(url: string): Promise<T>;
  put<T>(url: string, body: unknown): Promise<T>;
  post<T>(url: string, body: unknown): Promise<T>;
}): PageGateway {
  return {
    get: async (uuid) => pageStateSchema.parse(await client.get(`/sites/${uuid}/page`)),
    save: async (uuid, content, revision) =>
      pageStateSchema.parse(
        await client.put(`/sites/${uuid}/page`, {
          content: pageContentSchema.parse(content),
          revision
        })
      ),
    publish: async (uuid, revision) =>
      pageStateSchema.parse(await client.post(`/sites/${uuid}/page/publish`, { revision })),
    activity: (uuid) => client.get(`/sites/${uuid}/page/activity`)
  };
}
