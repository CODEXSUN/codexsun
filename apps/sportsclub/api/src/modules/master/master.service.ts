import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import { masterPayloadSchema } from "./master.schema.js";
import type { MasterRepository } from "./master.repository.js";
import type { MasterRecord, PublicMaster } from "./master.types.js";

export class MasterService {
  constructor(
    private readonly repository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async listPublic(): Promise<PublicMaster[]> {
    return this.repository.listApprovedPublic();
  }

  async list(): Promise<MasterRecord[]> {
    this.assertAdmin();
    return this.repository.list();
  }

  async get(uuid: string): Promise<MasterRecord> {
    const master = await this.repository.find(uuid);
    if (!master) {
      throw AppError.notFound("Master not found.");
    }
    const isSelf =
      this.context.actorEmail &&
      master.email.toLowerCase() === this.context.actorEmail.toLowerCase();

    if (!isSelf && !this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Access denied to private master profile.");
    }

    return master;
  }

  async create(input: unknown): Promise<MasterRecord> {
    this.assertAdmin();
    const payload = masterPayloadSchema.parse(input);
    const existing = await this.repository.byEmail(payload.email);
    if (existing) {
      throw AppError.conflict("A master with this email already exists.");
    }
    return this.repository.save(null, payload);
  }

  async update(uuid: string, input: unknown): Promise<MasterRecord> {
    this.assertAdmin();
    const payload = masterPayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Master not found.");
    }
    const duplicate = await this.repository.byEmail(payload.email);
    if (duplicate && duplicate.uuid !== uuid) {
      throw AppError.conflict("A master with this email already exists.");
    }
    return this.repository.save(uuid, payload);
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Master not found.");
    }
    await this.repository.forceDelete(uuid);
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }
}
