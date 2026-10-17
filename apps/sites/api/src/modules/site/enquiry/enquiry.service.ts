import { AppError } from "@codexsun/framework/errors";
import type { EnquiryQuery, EnquiryStatus } from "./enquiry.types.js";
import type { EnquiryRepository } from "./enquiry.repository.js";
import { createHash, createHmac, randomUUID } from "node:crypto";
import { enquirySchema } from "./enquiry.schema.js";
export class EnquiryService {
  constructor(private readonly repository: EnquiryRepository) {}
  receive(raw: unknown, key: unknown, address: string, now = Date.now()) {
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success)
      throw Object.assign(new Error("Check the enquiry fields."), {
        status: 422,
        fields: parsed.error.flatten().fieldErrors
      });
    if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key))
      throw Object.assign(new Error("A valid request key is required."), { status: 400 });
    if (parsed.data.website) return { reference: randomUUID(), received: true };
    const hash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
    const previous = this.repository.find(key);
    if (previous) {
      if (previous.payload_hash !== hash)
        throw Object.assign(new Error("This request key was used for a different enquiry."), {
          status: 409
        });
      return { reference: String(previous.reference), received: true };
    }
    const rateKey = createHmac("sha256", this.repository.secret())
      .update(`${Math.floor(now / 3600000)}:${address}`)
      .digest("hex");
    return this.repository.receive(parsed.data, key, hash, rateKey, randomUUID(), now);
  }
  list(query: EnquiryQuery) {
    return this.repository.inbox(query);
  }
  expire() {
    this.repository.expire();
  }
  show(reference: string) {
    return this.repository.show(reference);
  }
  change(
    reference: string,
    revision: number,
    action: "status" | "delete" | "restore",
    actor: string,
    status?: EnquiryStatus
  ) {
    return this.repository.transaction(() => {
      const current = this.repository.show(reference);
      if (current.revision !== revision)
        throw AppError.conflict("This enquiry changed. Refresh before trying again.");
      if (action === "status" && current.deletedAt)
        throw AppError.conflict("Restore this enquiry before changing its status.");
      if (action === "delete" && current.deletedAt)
        throw AppError.conflict("This enquiry is already in the trash.");
      if (action === "restore" && !current.deletedAt)
        throw AppError.conflict("This enquiry is not in the trash.");
      this.repository.writeChange(
        reference,
        status ?? current.status,
        action === "delete"
          ? new Date().toISOString()
          : action === "restore"
            ? null
            : current.deletedAt,
        actor,
        action === "status" ? `status:${status}` : action,
        new Date().toISOString()
      );
      return this.repository.show(reference);
    });
  }
}
