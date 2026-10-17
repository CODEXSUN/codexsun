import { createEnquiryGateway } from "./enquiry/index.js";
import { sitePayloadSchema } from "./site.schema.js";
import type { CmsSite, SiteGateway, SitePayload } from "./site.types.js";
import { createPageGateway } from "./page/index.js";
import { createBlogGateway } from "./blog/index.js";
import { deliverySnapshotSchema } from "@codexsun/sites-api/delivery-contract";

type HttpClient = {
  delete<T>(path: string): Promise<T>;
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body?: unknown): Promise<T>;
  put<T>(path: string, body?: unknown): Promise<T>;
};

export function createSiteGateway(client: HttpClient): SiteGateway {
  return {
    enquiries: createEnquiryGateway(client),
    exportPublication: async (uuid) =>
      deliverySnapshotSchema.parse(await client.post(`/sites/${uuid}/publication/export`)),
    page: createPageGateway(client),
    blog: createBlogGateway(client),
    start(uuid: string) {
      return client.post<{ port: number; state: "running"; url: string }>(`/sites/${uuid}/start`);
    },
    create(payload: SitePayload): Promise<CmsSite> {
      return client.post<CmsSite>("/sites", sitePayloadSchema.parse(payload));
    },
    delete(uuid: string): Promise<{ deleted: boolean; uuid: string }> {
      return client.delete<{ deleted: boolean; uuid: string }>(`/sites/${uuid}`);
    },
    get(uuid: string): Promise<CmsSite> {
      return client.get<CmsSite>(`/sites/${uuid}`);
    },
    list(): Promise<CmsSite[]> {
      return client.get<CmsSite[]>("/sites");
    },
    restore(uuid: string): Promise<CmsSite> {
      return client.post<CmsSite>(`/sites/${uuid}/restore`);
    },
    suspend(uuid: string): Promise<CmsSite> {
      return client.post<CmsSite>(`/sites/${uuid}/suspend`);
    },
    update(uuid: string, payload: SitePayload): Promise<CmsSite> {
      return client.put<CmsSite>(`/sites/${uuid}`, sitePayloadSchema.parse(payload));
    }
  };
}
