import { crmRequest } from "../../crm-request";
import type { LeadRecord } from "./lead.types";
export const listLeads = () => crmRequest<LeadRecord[]>("/crm/leads");
export const getLead = (uuid: string) => crmRequest<LeadRecord>("/crm/leads/" + uuid);
