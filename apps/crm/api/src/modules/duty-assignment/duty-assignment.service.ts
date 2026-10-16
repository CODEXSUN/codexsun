import { AppError } from "@codexsun/framework/errors";
import { DutyAssignmentRepository } from "./duty-assignment.repository.js";
import type { DutyAssignmentInput } from "./duty-assignment.types.js";

export class DutyAssignmentService {
  constructor(private readonly repository: DutyAssignmentRepository) {}
  listOwn(userId: number | null) { if (!userId) throw AppError.forbidden("An active CRM user is required."); return this.repository.listForUser(userId); }
  listAll() { return this.repository.listAll(); }
  async create(input: DutyAssignmentInput, actor: string) {
    if (input.endDate && input.endDate < input.startDate) throw AppError.validation("End date must be on or after start date.");
    const value = await this.repository.create(input, actor);
    if (!value) throw AppError.validation("Choose an active user and a published revision for an active SOP Item.");
    return value;
  }
  async deactivate(id: number) { await this.repository.deactivate(id); }
}
