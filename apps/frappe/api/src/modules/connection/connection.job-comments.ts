import { AppError } from "@codexsun/framework/errors";
import { requestFrappe } from "./connection.service.js";
import type { FrappeSettings } from "./connection.types.js";

export type FrappeJobComment = {
  name: string;
  job_type?: string | null;
  job_id?: string | null;
  comment?: string | null;
  mode?: string | null;
  parent_comment?: string | null;
  owner?: string | null;
  creation?: string | null;
  modified?: string | null;
};

export async function listEnquiryJobComments(settings: FrappeSettings, enquiryNames: string[]) {
  const names = [...new Set(enquiryNames.filter(Boolean))];
  if (!names.length) return [];
  return listJobComments(settings, [
    ["job_type", "=", "Enquiry"],
    ["job_id", "in", names]
  ]);
}

export async function listChangedEnquiryJobComments(
  settings: FrappeSettings,
  modifiedAfter: string
) {
  return listJobComments(settings, [
    ["job_type", "=", "Enquiry"],
    ["modified", ">", modifiedAfter]
  ]);
}

export async function createEnquiryJobComment(
  settings: FrappeSettings,
  input: {
    enquiryName: string;
    comment: string;
    mode?: string;
    parentName?: string | null;
    remoteName?: string;
  },
  allowExport = false
) {
  const response = await requestFrappe<{ data?: FrappeJobComment }>(
    "/api/v2/document/Job%20Comments",
    "POST",
    settings,
    {
      ...(input.remoteName ? { name: input.remoteName } : {}),
      job_type: "Enquiry",
      job_id: input.enquiryName,
      comment: input.comment,
      mode: input.mode ?? "Comment",
      ...(input.parentName ? { parent_comment: input.parentName } : {})
    },
    { allowExport }
  );
  if (!response.data?.name)
    throw AppError.conflict("Frappe did not return the new Job Comments identity.");
  return response.data;
}

export async function updateEnquiryJobComment(
  settings: FrappeSettings,
  name: string,
  input: { comment?: string; mode?: string },
  allowExport = false
) {
  const response = await requestFrappe<{ data?: FrappeJobComment }>(
    `/api/v2/document/Job%20Comments/${encodeURIComponent(name)}`,
    "PUT",
    settings,
    input,
    { allowExport }
  );
  return response.data;
}

async function listJobComments(settings: FrappeSettings, filters: unknown[][]) {
  const comments: FrappeJobComment[] = [];
  for (let start = 0; ; start += 500) {
    const response = await requestFrappe<{
      message?: FrappeJobComment[];
      data?: FrappeJobComment[];
    }>("/api/v2/method/frappe.client.get_list", "POST", settings, {
      doctype: "Job Comments",
      fields: ["*"],
      filters,
      order_by: "creation asc",
      limit_start: start,
      limit_page_length: 500
    });
    const page = response.message ?? response.data;
    if (!Array.isArray(page))
      throw AppError.validation("Frappe returned an invalid Job Comments list.");
    comments.push(...page);
    if (page.length < 500) return comments;
  }
}
