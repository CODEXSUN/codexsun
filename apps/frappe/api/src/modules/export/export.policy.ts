import { AppError } from "@codexsun/framework/errors";
import type { ExportKind, ExportMode } from "./export.types.js";

export function assertFrappeExportAllowed(kind: ExportKind, mode: ExportMode) {
  if (mode === "export" && kind !== "enquiries" && kind !== "contacts") {
    throw AppError.forbidden(
      `CRM-to-Frappe export is not approved for ${kind}. Only enquiries and contact mobiles can be exported.`
    );
  }
}
