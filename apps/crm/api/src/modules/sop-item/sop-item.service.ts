import { AppError } from "@codexsun/framework/errors";
import { SopItemRepository } from "./sop-item.repository.js";
import { sopFrequencies, type SopItemInput, type SopItemRecord, type SopRevisionInput } from "./sop-item.types.js";

export class SopItemService {
  constructor(private readonly repository: SopItemRepository) {}
  list(search: string) { return this.repository.list(search); }

  async get(id: number): Promise<SopItemRecord> {
    const item = await this.repository.get(id);
    if (!item) throw AppError.notFound("SOP Item was not found.");
    return item;
  }

  async create(input: SopItemInput, revision: SopRevisionInput, actor: string) {
    return unique(() => this.repository.create(validateItem(input), actor, validateRevision(revision)));
  }

  async update(id: number, input: SopItemInput, actor: string) {
    await this.get(id);
    return unique(() => this.repository.update(id, validateItem(input), actor));
  }

  async createRevision(id: number, input: SopRevisionInput, actor: string) {
    await this.get(id);
    return this.repository.createRevision(id, validateRevision(input), actor);
  }

  async updateRevision(id: number, revisionId: number, input: SopRevisionInput) {
    await this.get(id);
    const updated = await this.repository.updateRevision(id, revisionId, validateRevision(input));
    if (!updated) throw AppError.conflict("Only a draft SOP Item revision can be changed.");
    return updated;
  }

  async publish(id: number, revisionId: number, actor: string) {
    await this.get(id);
    const revision = await this.repository.publish(id, revisionId, actor);
    if (!revision) throw AppError.conflict("Only a draft SOP Item revision can be published.");
    return revision;
  }
}

function validateItem(input: SopItemInput): SopItemInput {
  const item = { ...input, code: input.code.trim(), title: input.title.trim(), department: input.department.trim() };
  if (!item.code || !item.title || !Number.isInteger(item.sopId) || item.sopId < 1)
    throw AppError.validation("SOP, item code, and title are required.");
  if (!sopFrequencies.includes(item.frequency)) throw AppError.validation("Choose a supported SOP frequency.");
  if (!Number.isInteger(item.sortOrder) || item.sortOrder < 0) throw AppError.validation("Item order must be zero or greater.");
  return item;
}

function validateRevision(input: SopRevisionInput): SopRevisionInput {
  const value = { instructions: input.instructions.trim(), evidenceGuidance: input.evidenceGuidance.trim() };
  if (!value.instructions) throw AppError.validation("SOP instructions are required.");
  return value;
}

async function unique<T>(save: () => Promise<T>): Promise<T> {
  try { return await save(); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY")
      throw AppError.conflict("An SOP Item with this code already exists in the selected SOP.");
    throw error;
  }
}
