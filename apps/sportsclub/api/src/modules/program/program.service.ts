import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import { programPayloadSchema } from "./program.schema.js";
import type { ProgramRepository } from "./program.repository.js";
import type { ProgramRecord, PublicProgram } from "./program.types.js";

export class ProgramService {
  constructor(
    private readonly repository: ProgramRepository,
    private readonly context: SportsclubContext
  ) {}

  async listPublic(): Promise<PublicProgram[]> {
    return this.repository.listApprovedPublic();
  }

  async list(): Promise<ProgramRecord[]> {
    this.assertAdmin();
    return this.repository.list();
  }

  async get(uuid: string): Promise<ProgramRecord> {
    const program = await this.repository.find(uuid);
    if (!program) {
      throw AppError.notFound("Program not found.");
    }
    return program;
  }

  async create(input: unknown): Promise<ProgramRecord> {
    this.assertAdmin();
    const payload = programPayloadSchema.parse(input);
    const existing = await this.repository.byCode(payload.code);
    if (existing) {
      throw AppError.conflict("A program with this code already exists.");
    }
    return this.repository.save(null, payload);
  }

  async update(uuid: string, input: unknown): Promise<ProgramRecord> {
    this.assertAdmin();
    const payload = programPayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Program not found.");
    }
    const duplicate = await this.repository.byCode(payload.code);
    if (duplicate && duplicate.uuid !== uuid) {
      throw AppError.conflict("A program with this code already exists.");
    }
    return this.repository.save(uuid, payload);
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Program not found.");
    }
    await this.repository.forceDelete(uuid);
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }
}
