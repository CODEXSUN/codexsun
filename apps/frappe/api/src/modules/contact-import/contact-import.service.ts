import { sql, type Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import { FrappeConnectionAccess, requestFrappe } from "../connection/index.js";
import type { FrappeDatabase, FrappeSettings } from "../connection/index.js";

type RemoteContact = {
  name: string;
  first_name?: string | null;
  last_name?: string | null;
  email_id?: string | null;
  mobile_no?: string | null;
  phone?: string | null;
};

const fields = ["name", "first_name", "last_name", "email_id", "mobile_no", "phone"];
const pageSize = 50;

export class FrappeContactImportService {
  constructor(
    private readonly database: Kysely<FrappeDatabase>,
    private readonly secret: string,
    private readonly defaults: FrappeSettings,
    private readonly resolveContact: (
      name: string,
      mobile: string | null
    ) => Promise<{ id: number }>
  ) {}

  async preview(page: number) {
    const settings = await this.settings();
    const query = new URLSearchParams({
      fields: JSON.stringify(fields),
      limit_start: String((page - 1) * pageSize),
      limit_page_length: String(pageSize + 1),
      order_by: "creation asc"
    });
    const response = await requestFrappe<{ data?: RemoteContact[] }>(
      `/api/resource/Contact?${query}`,
      "GET",
      settings
    );
    if (!Array.isArray(response.data))
      throw AppError.validation("Frappe returned an invalid contact page.");
    const remote = response.data.slice(0, pageSize);
    const names = remote.map((item) => item.name);
    const links = names.length
      ? await this.database
          .selectFrom("frappe_contact_imports")
          .select(["remote_name", "local_contact_id"])
          .where("remote_name", "in", names)
          .execute()
      : [];
    const localByName = new Map(links.map((link) => [link.remote_name, link.local_contact_id]));
    return {
      page,
      pageSize,
      hasMore: response.data.length > pageSize,
      items: remote.map((item) => ({
        name: item.name,
        displayName: [item.first_name, item.last_name].filter(Boolean).join(" ") || item.name,
        email: item.email_id || null,
        phone: item.mobile_no || item.phone || null,
        localContactId: localByName.get(item.name) ?? null
      }))
    };
  }

  async pull(remoteName: string) {
    const existing = await this.database
      .selectFrom("frappe_contact_imports")
      .select("local_contact_id")
      .where("remote_name", "=", remoteName)
      .executeTakeFirst();
    if (existing)
      return { remoteName, localId: existing.local_contact_id, status: "linked" as const };
    const settings = await this.settings();
    const query = encodeURIComponent(JSON.stringify(fields));
    const response = await requestFrappe<{ data?: RemoteContact }>(
      `/api/resource/Contact/${encodeURIComponent(remoteName)}?fields=${query}`,
      "GET",
      settings
    );
    const contact = response.data;
    if (!contact || contact.name !== remoteName)
      throw AppError.notFound("Frappe contact was not found.");
    const name = [contact.first_name, contact.last_name].filter(Boolean).join(" ").trim();
    const phone = (contact.mobile_no || contact.phone || "").replace(/[^\d]/gu, "");
    if (!name || phone.length < 7 || phone.length > 15)
      throw AppError.validation("Frappe contact needs a name and a 7 to 15 digit phone number.");
    const local = await this.resolveContact(name, phone);
    await sql`INSERT INTO frappe_contact_imports (remote_name, local_contact_id)
      VALUES (${remoteName}, ${local.id}) ON DUPLICATE KEY UPDATE local_contact_id=local_contact_id`.execute(
      this.database
    );
    return { remoteName, localId: local.id, status: "created" as const };
  }

  private async settings() {
    const settings = await new FrappeConnectionAccess(
      this.database,
      this.secret,
      this.defaults
    ).credentials();
    if (!settings)
      throw AppError.conflict("Verify the Frappe connection before importing contacts.");
    return settings;
  }
}
