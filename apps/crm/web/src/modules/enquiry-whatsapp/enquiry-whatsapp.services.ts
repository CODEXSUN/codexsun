import { crmRequest } from "../../crm-request";
import type { WhatsAppMessage } from "./enquiry-whatsapp.types";
export const listWhatsAppMessages = (id: number) =>
  crmRequest<WhatsAppMessage[]>(`/crm/enquiries/${id}/whatsapp-messages`);
export const prepareWhatsAppMessage = (id: number, message: string, requestId: string) =>
  crmRequest<{ id: number; url: string }>(`/crm/enquiries/${id}/whatsapp-messages`, {
    method: "POST",
    body: JSON.stringify({ message, requestId })
  });
