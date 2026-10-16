import { AppError } from "@codexsun/framework/errors";
import type { Kysely } from "kysely";
import { ListInRepository } from "./list-in.repository.js";
import type { ListInDatabase, ListInInput, ListInRecord } from "./list-in.types.js";

export class ListInService {
  constructor(private readonly repository: ListInRepository) {}

  list() {
    return this.repository.list();
  }

  async get(id: number): Promise<ListInRecord> {
    const record = await this.repository.get(id);
    if (!record) throw AppError.notFound("List In was not found.");
    return record;
  }

  async create(input: ListInInput, actor: string) {
    const value = validate(input);
    return unique(() => this.repository.create(value, actor));
  }

  async update(id: number, input: ListInInput, actor: string) {
    await this.get(id);
    return unique(() => this.repository.update(id, validate(input), actor));
  }

  async setActive(id: number, active: boolean, actor: string) {
    await this.get(id);

    if (!active && (await this.repository.usageCount(id)))
      throw AppError.conflict("List In is used by an enquiry.");
    return this.repository.setActive(id, active, actor);
  }

  async forceDelete(id: number) {
    const record = await this.get(id);

    if (await this.repository.usageCount(id))
      throw AppError.conflict("List In is used by an enquiry.");
    await this.repository.forceDelete(id);
    return record;
  }
}

export async function getActiveListInForDatabase(database: Kysely<ListInDatabase>, id: number) {
  const record = await new ListInRepository(database).get(id);
  return record?.status === "active" ? record : null;
}

export async function listActiveListInsForDatabase(database: Kysely<ListInDatabase>) {
  return (await new ListInRepository(database).list()).filter(
    (record) => record.status === "active"
  );
}

export async function resolveListInForImport(database: Kysely<ListInDatabase>, name: string) {
  const normalized = name.trim();
  if (!normalized) return null;
  const repository = new ListInRepository(database);
  const match = (await repository.list()).find(
    (record) => record.name.toLowerCase() === normalized.toLowerCase()
  );
  if (match) {
    if (match.status !== "active")
      throw AppError.conflict(`List In ${normalized} is inactive in local CRM.`);
    return match.id;
  }
  try {
    return (
      await new ListInService(repository).create(
        { name: normalized, sortOrder: 1000 },
        "system:frappe-import"
      )
    ).id;
  } catch (error) {
    if (error instanceof AppError && error.code === "CONFLICT") {
      const retry = (await repository.list()).find(
        (record) =>
          record.name.toLowerCase() === normalized.toLowerCase() && record.status === "active"
      );
      if (retry) return retry.id;
    }
    throw error;
  }
}

function validate(input: ListInInput): ListInInput {
  const name = input.name.trim();
  if (!name) throw AppError.validation("List In name is required.");
  return { name, sortOrder: input.sortOrder };
}

async function unique<T>(save: () => Promise<T>): Promise<T> {
  try {
    return await save();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    )
      throw AppError.conflict("List In already exists.");
    throw error;
  }
}
