import { AppError } from "@codexsun/framework/errors";
import type { DepartmentRepository } from "./department.repository.js";
import type { DepartmentFilters, DepartmentInput, DepartmentStatus } from "./department.types.js";

export class DepartmentService {
  constructor(private readonly repository: DepartmentRepository) {}

  list(filters: DepartmentFilters) {
    return this.repository.list(filters);
  }

  async get(id: string) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Department was not found.");
    return record;
  }

  async create(input: DepartmentInput, actor: string) {
    const value = this.resolve(input);
    await this.assertUnique(value.name);
    return this.get(await this.save(() => this.repository.create(value, actor)));
  }

  async update(id: string, input: DepartmentInput, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt)
      throw AppError.conflict("Restore the deleted department before editing it.");
    const value = this.resolve(input);
    await this.assertUnique(value.name, id);
    await this.save(() => this.repository.update(id, value, actor));
    return this.get(id);
  }

  async setStatus(id: string, status: DepartmentStatus, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt)
      throw AppError.conflict("Restore the deleted department before changing its status.");
    await this.repository.setStatus(id, status, actor);
    return this.get(id);
  }

  async remove(id: string, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt) throw AppError.conflict("Department is already deleted.");
    await this.repository.remove(id, actor);
    return this.get(id);
  }

  async restore(id: string, actor: string) {
    const current = await this.get(id);
    if (!current.deletedAt) throw AppError.conflict("Department is not deleted.");
    await this.repository.restore(id, actor);
    return this.get(id);
  }

  async forceDelete(id: string, actor: string) {
    const current = await this.get(id);
    if (!current.deletedAt)
      throw AppError.conflict(
        "Move the department to deleted departments before permanent deletion."
      );
    await this.save(() => this.repository.forceDelete(id, actor));
    return current;
  }

  activity(id: string) {
    return this.repository.activity(id);
  }

  private resolve(input: DepartmentInput): DepartmentInput {
    const value = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim()
    };
    if (!value.name) throw AppError.validation("Department name is required.");
    return value;
  }

  private async assertUnique(name: string, excluding?: string) {
    if (await this.repository.duplicate(name, excluding))
      throw AppError.conflict("Department name already exists, including deleted departments.");
  }

  private async save<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : null;
      if (code === "ER_DUP_ENTRY") throw AppError.conflict("Department name is already in use.");
      if (code === "ER_ROW_IS_REFERENCED_2")
        throw AppError.conflict("Department cannot be permanently deleted while employees use it.");
      throw error;
    }
  }
}
