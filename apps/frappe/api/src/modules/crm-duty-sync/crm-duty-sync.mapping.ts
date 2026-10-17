import { AppError } from "@codexsun/framework/errors";
import { requestFrappe, type FrappeSettings } from "../connection/index.js";

const frequencies = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  annually: "Yearly"
} as const;

export function frappeDutyFrequency(value: string) {
  if (!Object.hasOwn(frequencies, value))
    throw AppError.conflict(`LogicX SOP Item does not support the CRM frequency '${value}'.`);
  return frequencies[value as keyof typeof frequencies];
}

export function crmDutyFrequency(value: string) {
  const match = Object.entries(frequencies).find(([, remote]) => remote === value);
  if (!match) throw AppError.conflict(`LogicX SOP Item has an unsupported frequency '${value}'.`);
  return match[0];
}

export async function resolveDutyDepartment(value: string, settings: FrappeSettings) {
  const department = value.trim();
  if (!department) throw AppError.conflict("Choose a Department before syncing the SOP Item.");
  const exact = await departmentMatches("name", department, settings);
  if (exact.length === 1) return exact[0]!.name;
  const labels = await departmentMatches("department_name", department, settings);
  if (labels.length !== 1)
    throw AppError.conflict(
      "The SOP Department must match one active Frappe Department. Use its full document name when labels are ambiguous."
    );
  return labels[0]!.name;
}

async function departmentMatches(
  field: "name" | "department_name",
  value: string,
  settings: FrappeSettings
) {
  const query = new URLSearchParams({
    fields: JSON.stringify(["name"]),
    filters: JSON.stringify([
      [field, "=", value],
      ["disabled", "=", 0]
    ]),
    limit_page_length: "2"
  });
  const response = await requestFrappe<{ data?: Array<{ name: string }> }>(
    `/api/resource/Department?${query}`,
    "GET",
    settings
  );
  if (
    !Array.isArray(response.data) ||
    response.data.some((row) => !row || typeof row.name !== "string" || !row.name)
  )
    throw AppError.conflict("Frappe returned an invalid Department lookup response.");
  return response.data;
}

export function dutyReportActions(
  actions: string,
  result: string,
  issueDetails: string,
  context?: { revisionId: number; instructions: string; evidenceGuidance: string }
) {
  // LogicX has no outcome or immutable revision fields. Keep that evidence in actions.
  const revision = context
    ? `<p>CRM revision: ${context.revisionId}</p><p>Assigned instructions: ${escapeText(context.instructions)}</p><p>Evidence guidance: ${escapeText(context.evidenceGuidance)}</p>`
    : "";
  return `<p>Result: ${escapeText(result)}</p><p>${escapeText(actions)}</p>${issueDetails ? `<p>Issue: ${escapeText(issueDetails)}</p>` : ""}${revision}`;
}

export function dutyItemSteps(instructions: string, evidenceGuidance: string) {
  return `<p>${escapeText(instructions)}</p>${evidenceGuidance ? `<p>Evidence guidance: ${escapeText(evidenceGuidance)}</p>` : ""}`;
}

function escapeText(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]!
  );
}

export function dutyReportDate(value: string | Date) {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
}

export function dutyItemName(sopTitle: string, itemTitle: string) {
  return sopTitle.trim() === itemTitle.trim() ? itemTitle.trim() : `${sopTitle}: ${itemTitle}`;
}
