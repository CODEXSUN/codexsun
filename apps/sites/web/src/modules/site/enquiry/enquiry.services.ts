import { enquiryDetailSchema, enquiryListSchema } from "@codexsun/sites-api/enquiry-contract";

import { enquiryStatusChange } from "./enquiry.schema.js";

import type { EnquiryGateway } from "./enquiry.types.js";

type Client = {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, body?: unknown): Promise<T>;
  put<T>(url: string, body: unknown): Promise<T>;
};

export function createEnquiryGateway(client: Client): EnquiryGateway {
  return {
    list: async (uuid, query) =>
      enquiryListSchema.parse(
        await client.get(
          `/sites/${uuid}/enquiries?${new URLSearchParams({ ...query, page: String(query.page) })}`
        )
      ),

    get: async (uuid, reference) =>
      enquiryDetailSchema.parse(await client.get(`/sites/${uuid}/enquiries/${reference}`)),

    status: async (uuid, record, status) =>
      enquiryDetailSchema.parse(
        await client.put(
          `/sites/${uuid}/enquiries/${record.reference}/status`,
          enquiryStatusChange.parse({ status, revision: record.revision })
        )
      ),

    trash: async (uuid, record, restore) =>
      enquiryDetailSchema.parse(
        await client.post(
          `/sites/${uuid}/enquiries/${record.reference}/${restore ? "restore" : "delete"}`,
          { revision: record.revision }
        )
      )
  };
}
