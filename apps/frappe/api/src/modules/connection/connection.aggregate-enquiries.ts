import { AppError } from "@codexsun/framework/errors";
import type { FrappeSettings } from "./connection.types.js";
import { requestFrappe } from "./connection.service.js";

type AggregateRow = Record<string, string | number | null> & { count: number | string };
type Filter = [string, string, string];

export async function aggregateFrappeEnquiries(
  settings: FrappeSettings,
  fields: string[],
  filters: Filter[],
  employeeCode: string | null,
  canViewAll: boolean,
  orFilters?: Filter[]
): Promise<Array<Record<string, string | number | null> & { count: number }>> {
  const params = new URLSearchParams({
    fields: JSON.stringify([...fields, { COUNT: "name", as: "count" }]),
    filters: JSON.stringify(filters),
    group_by: fields.join(", "),
    order_by: fields.map((field) => `${field} asc`).join(", "),
    limit_page_length: "501"
  });
  if (orFilters?.length) params.set("or_filters", JSON.stringify(orFilters));
  else if (!canViewAll) {
    if (!employeeCode)
      throw AppError.forbidden("Map this CRM user to a Frappe employee to view live enquiries.");
    params.set(
      "or_filters",
      JSON.stringify([
        ["assigned_to_employee", "=", employeeCode],
        ["user_employee", "=", employeeCode]
      ])
    );
  }
  const result = await requestFrappe<{ data?: AggregateRow[] }>(
    `/api/resource/Enquiry?${params}`,
    "GET",
    settings
  );
  if (!Array.isArray(result.data))
    throw new AppError({
      code: "FRAPPE_RESPONSE_INVALID",
      message: "Frappe did not return enquiry totals.",
      statusCode: 502
    });
  if (result.data.length > 500)
    throw new AppError({
      code: "FRAPPE_REPORT_TOO_LARGE",
      message: "This live report has too many groups. Narrow the date range.",
      statusCode: 422
    });
  return result.data.map((row) => {
    const count = Number(row.count);
    if (!Number.isSafeInteger(count) || count < 0)
      throw new AppError({
        code: "FRAPPE_RESPONSE_INVALID",
        message: "Frappe returned an invalid enquiry count.",
        statusCode: 502
      });
    return { ...row, count };
  });
}
