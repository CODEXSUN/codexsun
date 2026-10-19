import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { ProgramRepository } from "../program/program.repository.js";
import { sessionPayloadSchema } from "./session.schema.js";
import type { SessionRepository } from "./session.repository.js";
import type { PublicSession, SessionRecord } from "./session.types.js";

export class SessionService {
  constructor(
    private readonly repository: SessionRepository,
    private readonly programRepository: ProgramRepository,
    private readonly masterRepository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async listPublic(): Promise<PublicSession[]> {
    return this.repository.listApprovedPublic();
  }

  async list(): Promise<SessionRecord[]> {
    this.assertAdmin();
    return this.repository.list();
  }

  async get(uuid: string): Promise<SessionRecord> {
    const session = await this.repository.find(uuid);
    if (!session) {
      throw AppError.notFound("Session not found.");
    }
    return session;
  }

  async create(input: unknown): Promise<SessionRecord> {
    this.assertAdmin();
    const payload = sessionPayloadSchema.parse(input);
    await this.validateRelations(payload.programUuid, payload.masterUuid);
    return this.repository.save(null, payload);
  }

  async update(uuid: string, input: unknown): Promise<SessionRecord> {
    this.assertAdmin();
    const payload = sessionPayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Session not found.");
    }
    await this.validateRelations(payload.programUuid, payload.masterUuid);
    return this.repository.save(uuid, payload);
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Session not found.");
    }
    await this.repository.forceDelete(uuid);
  }

  private async validateRelations(
    programUuid: string,
    masterUuid: string | null
  ): Promise<void> {
    const program = await this.programRepository.find(programUuid);
    if (!program) {
      throw AppError.validation("Selected program was not found.");
    }
    if (masterUuid) {
      const master = await this.masterRepository.find(masterUuid);
      if (!master || master.status !== "active") {
        throw AppError.validation("Selected master must be active.");
      }
    }
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }
}
