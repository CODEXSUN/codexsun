import { AppError } from "@codexsun/framework/errors";

export function assertFrappeQueueWorkerEnabled(enabled: boolean) {
  if (!enabled) {
    throw AppError.conflict(
      "Frappe background sync is unavailable because the queue worker is disabled."
    );
  }
}
