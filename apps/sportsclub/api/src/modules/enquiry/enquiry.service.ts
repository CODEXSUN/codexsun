import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import {
  enquiryPayloadSchema,
  publicEnquirySubmissionSchema
} from "./enquiry.schema.js";
import type { EnquiryRepository } from "./enquiry.repository.js";
import type { EnquiryRecord } from "./enquiry.types.js";

export class EnquiryService {
  constructor(
    private readonly repository: EnquiryRepository,
    private readonly context: SportsclubContext
  ) {}

  async submit(input: unknown): Promise<{ reference: string; status: "received" }> {
    const data = publicEnquirySubmissionSchema.parse(input);

    if (data.website) {
      return { reference: "spam-rejected", status: "received" };
    }

    const payload = {
      name: data.name,
      email: data.email,
      phone: data.phone ?? "",
      interest: data.interest || "Silambam Training",
      message: data.message,
      consent: true,
      status: "new" as const,
      notes: "",
      revision: 0
    };

    const record = await this.repository.save(null, payload);
    return { reference: record.uuid, status: "received" };
  }

  async list(): Promise<EnquiryRecord[]> {
    this.assertAdmin();
    return this.repository.list();
  }

  async get(uuid: string): Promise<EnquiryRecord> {
    this.assertAdmin();
    const record = await this.repository.find(uuid);
    if (!record) {
      throw AppError.notFound("Enquiry not found.");
    }
    return record;
  }

  async update(uuid: string, input: unknown): Promise<EnquiryRecord> {
    this.assertAdmin();
    const payload = enquiryPayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Enquiry not found.");
    }
    return this.repository.save(uuid, payload);
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Enquiry not found.");
    }
    await this.repository.forceDelete(uuid);
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }
}
