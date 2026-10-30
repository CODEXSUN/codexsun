import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import { programPayloadSchema } from "./program.schema.js";
import type { ProgramRepository } from "./program.repository.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { MemberRepository } from "../member/member.repository.js";
import type { SessionRepository } from "../session/session.repository.js";
import type { ProgramListQuery, ProgramRecord, PublicProgram } from "./program.types.js";
import type { ListResponse } from "../../sportsclub.pagination.js";

export class ProgramService {
  constructor(
    private readonly repository: ProgramRepository,
    private readonly context: SportsclubContext,
    private readonly masterRepository?: MasterRepository,
    private readonly memberRepository?: MemberRepository,
    private readonly sessionRepository?: SessionRepository
  ) {}

  async listPublic(): Promise<PublicProgram[]> {
    return this.repository.listApprovedPublic();
  }

  async list(query?: ProgramListQuery): Promise<ListResponse<ProgramRecord>> {
    this.assertAdmin();
    return this.repository.list(query);
  }

  async listLookups(query?: ProgramListQuery): Promise<ListResponse<ProgramRecord>> {
    if (this.context.isClubAdmin || this.context.isSuperAdmin) return this.repository.list(query);
    const assignedUuids = await this.assignedProgramUuids();
    return this.repository.list(query, assignedUuids);
  }

  async get(uuid: string): Promise<ProgramRecord> {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      const assignedUuids = await this.assignedProgramUuids();
      if (!assignedUuids.includes(uuid)) throw AppError.forbidden("Program is not assigned to this master.");
    }
    const program = await this.repository.find(uuid);
    if (!program) {
      throw AppError.notFound("Program not found.");
    }
    return program;
  }

  private async assignedProgramUuids(): Promise<string[]> {
    const actorEmail = this.context.actorEmail?.toLowerCase();
    if (this.context.actorRole !== "master" || !actorEmail || !this.masterRepository || !this.memberRepository || !this.sessionRepository) {
      throw AppError.forbidden("Assigned master access required.");
    }
    const master = await this.masterRepository.byEmail(actorEmail);
    if (!master || master.status !== "active") throw AppError.forbidden("Active master access required.");
    const [memberPrograms, sessionPrograms] = await Promise.all([
      this.memberRepository.programUuidsForMaster(master.uuid),
      this.sessionRepository.programUuidsForMaster(master.uuid)
    ]);
    return [...new Set([...memberPrograms, ...sessionPrograms])];
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
