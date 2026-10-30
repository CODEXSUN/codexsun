import { AppError } from "@codexsun/framework/errors";
import type { DesignationRepository } from "./designation.repository.js";
import type {
  DesignationFilters,
  DesignationInput,
  DesignationStatus
} from "./designation.types.js";

export class DesignationService {
  constructor(private readonly repository: DesignationRepository) {}

  list(filters: DesignationFilters) {
    return this.repository.list(filters);
  }

  async get(id: string) {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("Designation was not found.");
    return record;
  }

  async create(input: DesignationInput, actor: string) {
    const value = this.resolve(input);
    await this.assertUnique(value.name);
    return this.get(await this.save(() => this.repository.create(value, actor)));
  }

  async update(id: string, input: DesignationInput, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt)
      throw AppError.conflict("Restore the deleted designation before editing it.");
    const value = this.resolve(input);
    await this.assertUnique(value.name, id);
    await this.save(() => this.repository.update(id, value, actor));
    return this.get(id);
  }

  async setStatus(id: string, status: DesignationStatus, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt)
      throw AppError.conflict("Restore the deleted designation before changing its status.");
    await this.repository.setStatus(id, status, actor);
    return this.get(id);
  }

  async remove(id: string, actor: string) {
    const current = await this.get(id);
    if (current.deletedAt) throw AppError.conflict("Designation is already deleted.");
    await this.repository.remove(id, actor);
    return this.get(id);
  }

  async restore(id: string, actor: string) {
    const current = await this.get(id);
    if (!current.deletedAt) throw AppError.conflict("Designation is not deleted.");
    await this.repository.restore(id, actor);
    return this.get(id);
  }

  async forceDelete(id: string, actor: string) {
    const current = await this.get(id);
    if (!current.deletedAt)
      throw AppError.conflict(
        "Move the designation to deleted designations before permanent deletion."
      );
    await this.save(() => this.repository.forceDelete(id, actor));
    return current;
  }

  activity(id: string) {
    return this.repository.activity(id);
  }

  private resolve(input: DesignationInput): DesignationInput {
    const value = {
      ...input,
      name: input.name.trim(),
      description: input.description.trim()
    };
    if (!value.name) throw AppError.validation("Designation name is required.");
    return value;
  }

  private async assertUnique(name: string, excluding?: string) {
    if (await this.repository.duplicate(name, excluding))
      throw AppError.conflict("Designation name already exists, including deleted designations.");
  }

  private async save<T>(work: () => Promise<T>) {
    try {
      return await work();
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error ? error.code : null;
      if (code === "ER_DUP_ENTRY") throw AppError.conflict("Designation name is already in use.");
      if (code === "ER_ROW_IS_REFERENCED_2")
        throw AppError.conflict(
          "Designation cannot be permanently deleted while employee records use it."
        );
      throw error;
    }
  }
}
