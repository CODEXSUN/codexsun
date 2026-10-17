import { createHash } from "node:crypto";
import { sql, type Kysely } from "kysely";
import { z } from "zod";
import { AppError } from "@codexsun/framework/errors";
import { FrappeConnectionAccess, requestFrappe } from "../connection/index.js";
import type { FrappeDatabase, FrappeSettings } from "../connection/index.js";
import type { MobileCustomerResolver } from "./contact-import.types.js";

const pairSchema = z.object({
  name: z.string().min(1),
  mobile_contact: z.string().regex(/^\d{10}$/),
  customer: z.string().min(1),
  customer_name: z.string().nullable().optional()
});
const fields = ["name", "mobile_contact", "customer", "customer_name"];
const pageSize = 50;

export class FrappeContactImportService {
  constructor(
    private readonly database: Kysely<FrappeDatabase>,
    private readonly secret: string,
    private readonly defaults: FrappeSettings,
    private readonly resolveContact: MobileCustomerResolver
  ) {}

  async preview(page: number) {
    const settings = await this.settings();
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      limit_start: String((page - 1) * pageSize),
      limit_page_length: String(pageSize + 1),
      order_by: "creation asc, name asc"
    });
    const response = await requestFrappe<{ data?: unknown }>(
      `/api/resource/Mobile Contact Customer?${query}`,
      "GET",
      settings
    );
    const parsed = z.array(pairSchema).safeParse(response.data);
    if (!parsed.success)
      throw AppError.validation("Frappe returned an invalid Mobile Contact Customer page.");
    const remote = parsed.data.slice(0, pageSize);
    const keys = remote.map((item) => this.linkKey(settings, item.name));
    const links = keys.length
      ? await this.database
          .selectFrom("frappe_contact_imports")
          .select(["remote_name", "local_contact_id"])
          .where("remote_name", "in", keys)
          .execute()
      : [];
    const localByKey = new Map(links.map((link) => [link.remote_name, link.local_contact_id]));
    return {
      source: "mobile-contact-customer" as const,
      page,
      pageSize,
      hasMore: parsed.data.length > pageSize,
      items: remote.map((item) => ({
        name: item.name,
        customerId: item.customer,
        displayName: item.customer_name?.trim() || item.customer,
        email: null,
        phone: item.mobile_contact,
        localContactId: localByKey.get(this.linkKey(settings, item.name)) ?? null
      }))
    };
  }

  async pull(remoteName: string) {
    const settings = await this.settings();
    const response = await requestFrappe<{ data?: unknown }>(
      `/api/resource/Mobile Contact Customer/${encodeURIComponent(remoteName)}`,
      "GET",
      settings
    );
    const parsed = pairSchema.safeParse(response.data);
    if (!parsed.success || parsed.data.name !== remoteName)
      throw AppError.validation(
        "Frappe Mobile Contact Customer was not found or has invalid fields."
      );
    const pair = parsed.data;
    const mobile = await requestFrappe<{ data?: unknown }>(
      `/api/resource/Mobile Contact/${encodeURIComponent(pair.mobile_contact)}`,
      "GET",
      settings
    );
    const mobileRecord = z
      .object({ name: z.string(), mobile_number: z.string().regex(/^\d{10}$/) })
      .safeParse(mobile.data);
    if (
      !mobileRecord.success ||
      mobileRecord.data.name !== pair.mobile_contact ||
      mobileRecord.data.mobile_number !== pair.mobile_contact
    )
      throw AppError.validation("The selected customer's Mobile Contact is invalid.");
    const customer = await requestFrappe<{ data?: unknown }>(
      `/api/resource/Customer/${encodeURIComponent(pair.customer)}`,
      "GET",
      settings
    );
    const customerRecord = z
      .object({
        name: z.string(),
        customer_name: z.string().trim().min(1),
        disabled: z.union([z.number(), z.boolean()]).optional()
      })
      .safeParse(customer.data);
    if (
      !customerRecord.success ||
      customerRecord.data.name !== pair.customer ||
      customerRecord.data.disabled
    )
      throw AppError.validation("The selected Frappe Customer is missing, invalid, or disabled.");
    const key = this.linkKey(settings, pair.name);
    const existing = await this.database
      .selectFrom("frappe_contact_imports")
      .select("local_contact_id")
      .where("remote_name", "=", key)
      .executeTakeFirst();
    const local = await this.resolveContact({
      externalKey: this.identity(settings, "customer", pair.customer),
      name: customerRecord.data.customer_name,
      mobile: pair.mobile_contact
    });
    if (existing && existing.local_contact_id !== local.id)
      throw AppError.conflict(
        "This mobile/customer association is already linked to a different Core customer."
      );
    await sql`INSERT INTO frappe_contact_imports (remote_name,local_contact_id) VALUES (${key},${local.id}) ON DUPLICATE KEY UPDATE local_contact_id=local_contact_id`.execute(
      this.database
    );
    const saved = await this.database
      .selectFrom("frappe_contact_imports")
      .select("local_contact_id")
      .where("remote_name", "=", key)
      .executeTakeFirstOrThrow();
    if (saved.local_contact_id !== local.id)
      throw AppError.conflict("A concurrent import linked this association to another customer.");
    return {
      remoteName,
      localId: saved.local_contact_id,
      status: existing ? ("linked" as const) : ("created" as const)
    };
  }

  private linkKey(settings: FrappeSettings, name: string) {
    return `mobile-customer:${this.identity(settings, "pair", name)}`;
  }
  private identity(settings: FrappeSettings, kind: string, name: string) {
    return createHash("sha256")
      .update(
        JSON.stringify([
          new URL(settings.baseUrl).origin.toLowerCase(),
          "Mobile Contact Customer",
          kind,
          name
        ])
      )
      .digest("hex");
  }
  private async settings() {
    const settings = await new FrappeConnectionAccess(
      this.database,
      this.secret,
      this.defaults
    ).credentials();
    if (!settings)
      throw AppError.conflict("Verify the Frappe connection before importing mobile customers.");
    return settings;
  }
}
