import { AppError } from "@codexsun/framework/errors";
import type { EmployeeRepository } from "./employee.repository.js";
import type {
  EmployeeContext,
  EmployeeFilters,
  EmployeeInput,
  EmployeeStatus
} from "./employee.types.js";

export class EmployeeService {
  constructor(
    private readonly repository: EmployeeRepository,
    private readonly users: EmployeeContext["users"]
  ) {}
  async list(filters: EmployeeFilters) {
    const users = await this.users.list();
    return (await this.repository.list(filters)).map((record) =>
      this.withUser(
        record,
        users.find((user) => user.id === record.userId)
      )
    );
  }
  async get(id: string) {
    const record = await this.current(id);
    return this.withUser(
      record,
      record.userId === null ? undefined : ((await this.users.find(record.userId)) ?? undefined)
    );
  }
  userOptions() {
    return this.users.list();
  }
  async create(input: EmployeeInput, actor: string) {
    const value = await this.resolve(input);
    return this.get(await this.save(() => this.repository.create(value, actor)));
  }
  async update(id: string, input: EmployeeInput, actor: string) {
    const current = await this.current(id, false);
    const value = await this.resolve(input, id, current.userId);
    await this.save(() => this.repository.update(id, value, actor));
    return this.get(id);
  }
  async setStatus(id: string, status: EmployeeStatus, actor: string) {
    await this.current(id, false);
    await this.repository.setStatus(id, status, actor);
    return this.get(id);
  }
  async remove(id: string, actor: string) {
    await this.current(id, false);
    await this.repository.remove(id, actor);
    return this.get(id);
  }
  async restore(id: string, actor: string) {
    const record = await this.current(id);
    if (!record.deletedAt) throw AppError.conflict("Employee is not deleted.");
    await this.repository.restore(id, actor);
    return this.get(id);
  }
  async forceDelete(id: string, actor: string) {
    const record = await this.get(id);
    if (!record.deletedAt)
      throw AppError.conflict("Move the employee to deleted employees before permanent deletion.");
    // No dependent employment modules exist yet. Database constraints remain the race-safe guard.
    await this.save(() => this.repository.forceDelete(id, actor));
    return record;
  }
  activity(id: string) {
    return this.repository.activity(id);
  }
  private async current(id: string, allowDeleted = true) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Employee was not found.");
    if (!allowDeleted && record.deletedAt)
      throw AppError.conflict("Restore the deleted employee before modifying it.");
    return record;
  }
  private async resolve(input: EmployeeInput, id?: string, currentUser?: number | null) {
    const value = {
      ...input,
      employeeCode: input.employeeCode.trim().toUpperCase(),
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      department: input.department.trim(),
      designation: input.designation.trim(),
      notes: input.notes.trim()
    };
    if (!value.name || !/^[A-Z0-9][A-Z0-9_-]{0,39}$/.test(value.employeeCode))
      throw AppError.validation("Employee name and a valid employee code are required.");
    if (value.userId !== null) {
      const user = await this.users.find(value.userId);
      if (!user) throw AppError.validation("Select a user account from this tenant.");
      if (user.status !== "active" && value.userId !== currentUser)
        throw AppError.validation("Select an active user account.");
    }
    const duplicate = await this.repository.duplicate(value.employeeCode, value.userId, id);
    if (duplicate)
      throw AppError.conflict(
        duplicate.employee_code.toUpperCase() === value.employeeCode
          ? "Employee code already exists, including deleted employees."
          : "User account is already mapped to another employee, including deleted employees."
      );
    return value;
  }
  private withUser(
    record: NonNullable<Awaited<ReturnType<EmployeeRepository["get"]>>>,
    user?: Awaited<ReturnType<EmployeeContext["users"]["find"]>>
  ) {
    return { ...record, userName: user?.name ?? null, userEmail: user?.email ?? null };
  }
  private async save<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : null;
      if (code === "ER_DUP_ENTRY")
        throw AppError.conflict("Employee code or user account is already in use.");
      if (code === "ER_NO_REFERENCED_ROW_2")
        throw AppError.validation("The selected user account no longer exists.");
      if (code === "ER_ROW_IS_REFERENCED_2")
        throw AppError.conflict(
          "Employee cannot be permanently deleted while business records reference it."
        );
      throw error;
    }
  }
}
