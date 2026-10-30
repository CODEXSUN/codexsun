import { createHash, createHmac, randomUUID } from "node:crypto";
import { enquirySchema } from "./enquiry.schema.ts";

export class D1EnquiryService {
  constructor(repository) {
    this.repository = repository;
  }
  async receive(raw, key, address, now = Date.now()) {
    const parsed = enquirySchema.safeParse(raw);
    if (!parsed.success)
      throw Object.assign(new Error("Check the enquiry fields."), {
        status: 422,
        fields: parsed.error.flatten().fieldErrors
      });
    if (typeof key !== "string" || !/^[a-f0-9-]{36}$/.test(key))
      throw Object.assign(new Error("A valid request key is required."), { status: 400 });
    if (parsed.data.website) return { reference: randomUUID(), received: true };
    await this.repository.verifyIdentity();
    await this.repository.expire(now);
    const hash = createHash("sha256").update(JSON.stringify(parsed.data)).digest("hex");
    const previous = await this.repository.find(key);
    if (previous) {
      if (previous.payload_hash !== hash)
        throw Object.assign(new Error("This request key was used for a different enquiry."), {
          status: 409
        });
      return { reference: previous.reference, received: true };
    }
    const rateKey = createHmac("sha256", await this.repository.secret())
      .update(`${Math.floor(now / 3600000)}:${address}`)
      .digest("hex");
    return this.repository.receive(parsed.data, key, hash, rateKey, randomUUID(), now);
  }
}
