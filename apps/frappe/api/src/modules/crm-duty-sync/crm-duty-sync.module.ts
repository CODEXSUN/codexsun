import { processCrmDutySync } from "./crm-duty-sync.worker.js";

// The CRM owner supplies the outbox/schema. Platform supplies tenant and credential resolution.
// This headless worker has no HTTP routes, seeds, event publication, or offline synchronization.
export const frappeCrmDutySyncModule = {
  key: "frappe.crm-duty-sync",
  register(registerProcessor: (jobName: string, processor: typeof processCrmDutySync) => void) {
    registerProcessor("crm.sop.frappe-sync", processCrmDutySync);
  }
};
