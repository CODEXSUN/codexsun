import type { Kysely, Selectable } from "kysely";
import type {
  CreateEnquiryLocation,
  EnquiryLocationDatabase,
  EnquiryLocationRow
} from "./enquiry-location.types.js";

export class EnquiryLocationRepository {
  constructor(private readonly database: Kysely<EnquiryLocationDatabase>) {}

  async create(
    enquiryId: number,
    contactId: number | null,
    input: CreateEnquiryLocation,
    actor: string
  ) {
    const row = await this.database
      .insertInto("crm_enquiry_locations")
      .values({
        enquiry_id: enquiryId,
        contact_id: contactId,
        latitude: String(input.latitude),
        longitude: String(input.longitude),
        accuracy_meters: input.accuracyMeters === null ? null : String(input.accuracyMeters),
        captured_at: new Date(input.capturedAt).toISOString().slice(0, 19).replace("T", " "),
        created_by: actor
      })
      .executeTakeFirstOrThrow();
    return this.findById(Number(row.insertId));
  }

  async list(enquiryId: number) {
    const rows = await this.database
      .selectFrom("crm_enquiry_locations")
      .selectAll()
      .where("enquiry_id", "=", enquiryId)
      .orderBy("captured_at", "desc")
      .orderBy("id", "desc")
      .limit(100)
      .execute();
    return rows.map(mapRow);
  }

  private async findById(id: number) {
    const row = await this.database
      .selectFrom("crm_enquiry_locations")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow();
    return mapRow(row);
  }
}

function mapRow(row: Selectable<EnquiryLocationRow>) {
  return {
    id: Number(row.id),
    uuid: row.uuid,
    enquiryId: Number(row.enquiry_id),
    contactId: row.contact_id === null ? null : Number(row.contact_id),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    accuracyMeters: row.accuracy_meters === null ? null : Number(row.accuracy_meters),
    capturedAt: asUtcIso(row.captured_at),
    createdBy: row.created_by,
    createdAt: asUtcIso(row.created_at)
  };
}

function asUtcIso(value: string | Date) {
  if (value instanceof Date) return value.toISOString();
  return new Date(
    /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value) ? value : `${value.replace(" ", "T")}Z`
  ).toISOString();
}
