import { AppError } from "@codexsun/framework/errors";
import { SopRepository } from "./sop.repository.js";
import type { SopInput, SopRecord } from "./sop.types.js";

export class SopService {
  constructor(private readonly repository: SopRepository) {}

  list(search: string) { return this.repository.list(search); }

  async get(id: number): Promise<SopRecord> {
    const value = await this.repository.get(id);
    if (!value) throw AppError.notFound("SOP was not found.");
    return value;
  }

  async create(input: SopInput, actor: string, ownerUserId: number | null) {
    return saveUnique(() => this.repository.create(validate(input), actor, ownerUserId));
  }

  async update(id: number, input: SopInput, actor: string) {
    await this.get(id);
    return saveUnique(() => this.repository.update(id, validate(input), actor));
  }

  async setActive(id: number, active: boolean, actor: string) {
    await this.get(id);
    return this.repository.setActive(id, active, actor);
  }
}

function validate(input: SopInput): SopInput {
  const value = { code: input.code.trim(), title: input.title.trim(), purpose: input.purpose.trim() };
  if (!value.code || !value.title || !value.purpose)
    throw AppError.validation("SOP code, title, and purpose are required.");
  return value;
}

async function saveUnique<T>(save: () => Promise<T>): Promise<T> {
  try { return await save(); }
  catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ER_DUP_ENTRY")
      throw AppError.conflict("An SOP with this code already exists.");
    throw error;
  }
}
