import { AppError } from "@codexsun/framework/errors";
import { DutyReportRepository } from "./duty-report.repository.js";
import type { DutyReportInput } from "./duty-report.types.js";
export class DutyReportService {
  constructor(private readonly repository: DutyReportRepository) {}
  list(filters: Parameters<DutyReportRepository["list"]>[0] = {}) {
    return this.repository.list(filters);
  }
  async update(
    id: number,
    input: Pick<DutyReportInput, "performedDate" | "actions">,
    userId: number | null,
    actor: string
  ) {
    if (!userId) throw AppError.forbidden("An active CRM user is required.");
    const report = await this.repository.get(id);
    if (!report) throw AppError.notFound("Duty report was not found.");
    if (report.assigneeUserId !== userId)
      throw AppError.forbidden("Only your own duty reports can be edited.");
    if (!input.actions.trim()) throw AppError.validation("Actions are required.");
    return this.repository.update(
      id,
      { ...input, actions: input.actions.trim() },
      userId,
      actor,
      recurrenceKey(new Date(`${input.performedDate}T00:00:00Z`), report.frequency)
    );
  }
  async create(input: DutyReportInput, userId: number | null, actor: string, frequency: string) {
    const actions = input.actions.trim();
    const issueDetails = input.issueDetails.trim();
    if (!userId) throw AppError.forbidden("An active CRM user is required.");
    if (!actions || (input.result === "blocked" && !issueDetails))
      throw AppError.validation("Actions are required; blocked reports need issue details.");
    const date = new Date(`${input.performedDate}T00:00:00Z`);
    const key = recurrenceKey(date, frequency);
    const saved = await this.repository.create(
      { ...input, actions, issueDetails },
      userId,
      actor,
      key
    );
    if (!saved)
      throw AppError.forbidden(
        "This duty is not active or assigned to your user for the selected date."
      );
    return saved;
  }
}
export function recurrenceKey(date: Date, frequency: string) {
  const day = date.toISOString().slice(0, 10);
  if (frequency === "once") return "once";
  if (frequency === "weekly") {
    const isoDay = date.getUTCDay() || 7;
    const thursday = new Date(date);
    thursday.setUTCDate(date.getUTCDate() + 4 - isoDay);
    const isoYear = thursday.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
    const firstIsoDay = firstThursday.getUTCDay() || 7;
    firstThursday.setUTCDate(firstThursday.getUTCDate() + 4 - firstIsoDay);
    const week = Math.floor((thursday.getTime() - firstThursday.getTime()) / 604800000) + 1;
    return `${isoYear}-W${String(week).padStart(2, "0")}`;
  }
  if (frequency === "monthly") return day.slice(0, 7);
  if (frequency === "quarterly")
    return `${day.slice(0, 4)}-Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
  if (frequency === "annually") return day.slice(0, 4);
  return day;
}
