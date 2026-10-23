import type { ExportKind } from "@codexsun/frappe-api";

const approvedAutomaticExports = new Set<ExportKind>(["enquiries"]);

export function approvedFrappeAutomaticExports(
  configured: readonly ExportKind[],
  direction = "bidirectional"
) {
  if (direction === "inbound") return [];
  return configured.filter((kind) => approvedAutomaticExports.has(kind));
}

export function frappeInboundModifiedAfter(
  settings: {
    inboundBaseUrl: string | null;
    inboundCheckpointAt: string | null;
  },
  baseUrl: string
) {
  if (settings.inboundBaseUrl !== baseUrl || !settings.inboundCheckpointAt) return undefined;
  // Replay from successful delivery, including changes during extended outages.
  return new Date(Date.parse(settings.inboundCheckpointAt) - 24 * 60 * 60_000).toISOString();
}
