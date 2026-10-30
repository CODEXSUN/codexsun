import { AppError } from "@codexsun/framework/errors";
import type { AttendanceRepository } from "./attendance.repository.js";
import type { AttendanceInput } from "./attendance.types.js";

export class AttendanceService {
  constructor(private readonly repository: AttendanceRepository) {}

  list(filters: Parameters<AttendanceRepository["list"]>[0]) {
    return this.repository.list(filters);
  }

  async get(id: string) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Attendance record was not found.");
    return record;
  }

  employees() {
    return this.repository.employeeOptions();
  }

  async create(input: AttendanceInput, actor: string) {
    const value = await this.resolve(input);
    const duplicate = await this.repository.duplicate(value.employeeId, value.workDate);
    if (duplicate)
      throw AppError.conflict("Attendance is already recorded for this employee and date.");
    return this.get(await this.save(() => this.repository.create(value, actor)));
  }

  async update(id: string, input: AttendanceInput, actor: string) {
    await this.get(id);
    const value = await this.resolve(input);
    const duplicate = await this.repository.duplicate(value.employeeId, value.workDate, id);
    if (duplicate)
      throw AppError.conflict("Attendance is already recorded for this employee and date.");
    await this.save(() => this.repository.update(id, value, actor));
    return this.get(id);
  }

  async remove(id: string, actor: string) {
    await this.get(id);
    await this.repository.remove(id, actor);
    return this.getIncludingDeleted(id);
  }

  async restore(id: string, actor: string) {
    const record = await this.getIncludingDeleted(id);
    if (!record.deletedAt) throw AppError.conflict("Attendance record is not deleted.");
    await this.repository.restore(id, actor);
    return this.get(id);
  }

  async overview(today?: string) {
    if (!today) return this.repository.overviewToday();
    return this.repository.overview(today, addDays(today, -6));
  }

  private async resolve(input: AttendanceInput) {
    const today = await this.repository.today();
    if (input.workDate > today)
      throw AppError.validation("Attendance date cannot be in the future.");
    const employee = await this.repository.employee(input.employeeId);
    if (!employee || employee.deletedAt || employee.status !== "active")
      throw AppError.validation("Select an active employee.");
    if (input.status === "present" && Boolean(input.checkIn) !== Boolean(input.checkOut))
      throw AppError.validation("Enter both check-in and check-out times, or leave both blank.");
    if (input.checkIn && input.checkOut && input.checkOut <= input.checkIn)
      throw AppError.validation("Check-out must be later than check-in.");
    if (input.status !== "present" && (input.checkIn || input.checkOut))
      throw AppError.validation(
        "Check-in and check-out times are only available for present records."
      );
    return { ...input, notes: input.notes.trim() };
  }

  private async getIncludingDeleted(id: string) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Attendance record was not found.");
    return record;
  }

  private async save<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : null;
      if (code === "ER_DUP_ENTRY")
        throw AppError.conflict("Attendance is already recorded for this employee and date.");
      if (code === "ER_NO_REFERENCED_ROW_2")
        throw AppError.validation("Select an active employee.");
      throw error;
    }
  }
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
