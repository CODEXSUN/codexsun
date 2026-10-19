import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { EnquiryRepository } from "./enquiry.repository.js";

export async function seedEnquiryModule(db: Kysely<SportsclubDatabase>) {
  const repository = new EnquiryRepository(db);
  const existing = await repository.find("f0010001");
  if (!existing) {
    await repository.save("f0010001", {
      name: "T. Selvam",
      email: "selvam@example.test",
      phone: "+91 98400 12345",
      interest: "Silambam Training for Youth",
      message: "Interested in enrolling two students for evening Silambam batches in Tenkasi.",
      consent: true,
      status: "new",
      notes: "Followed up regarding timing details.",
      revision: 0
    });
  }
}
