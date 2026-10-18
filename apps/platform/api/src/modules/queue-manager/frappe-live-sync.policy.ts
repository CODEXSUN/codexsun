import type { ExportKind } from "@codexsun/frappe-api";

const approvedAutomaticExports = new Set<ExportKind>(["enquiries"]);

export function approvedFrappeAutomaticExports(configured: readonly ExportKind[]) {
  return configured.filter((kind) => approvedAutomaticExports.has(kind));
}
