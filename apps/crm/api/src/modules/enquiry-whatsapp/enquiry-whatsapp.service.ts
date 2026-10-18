import { AppError } from "@codexsun/framework/errors";
import type { WhatsAppContext } from "./enquiry-whatsapp.types.js";
import { EnquiryWhatsAppRepository } from "./enquiry-whatsapp.repository.js";
export class EnquiryWhatsAppService {
  private readonly repository: EnquiryWhatsAppRepository;
  constructor(private readonly context: WhatsAppContext) {
    this.repository = new EnquiryWhatsAppRepository(context);
  }
  async list(id: number) {
    await this.context.verifyEnquiry(id);
    return this.repository.list(id);
  }
  async create(id: number, message: string, requestId: string) {
    const enquiry = await this.context.verifyEnquiry(id);
    let recipient = enquiry.mobile?.replace(/\D/gu, "") ?? "";
    if (recipient.startsWith("00")) recipient = recipient.slice(2);
    if (recipient.length === 10) recipient = `91${recipient}`;
    if (recipient.length < 8 || recipient.length > 15)
      throw AppError.validation("Add a valid customer mobile number.");
    const saved = await this.repository.create(id, recipient, message, requestId);
    if (saved.enquiry_id !== id || saved.message !== message || saved.recipient !== recipient)
      throw AppError.conflict("This WhatsApp retry key was already used.");
    return { id: saved.id, url: `https://wa.me/${recipient}?text=${encodeURIComponent(message)}` };
  }
}
