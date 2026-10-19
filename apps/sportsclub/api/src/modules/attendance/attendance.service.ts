import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { MemberRepository } from "../member/member.repository.js";
import type { SessionRepository } from "../session/session.repository.js";
import { attendancePayloadSchema } from "./attendance.schema.js";
import type { AttendanceRepository } from "./attendance.repository.js";
import type { AttendanceRecord } from "./attendance.types.js";

export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly memberRepository: MemberRepository,
    private readonly masterRepository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async record(input: unknown): Promise<AttendanceRecord> {
    const payload = attendancePayloadSchema.parse(input);
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();

    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      const master = await this.masterRepository.byEmail(actorEmail);
      if (!master || master.status !== "active") {
        throw AppError.forbidden("Only active masters or club administrators can record attendance.");
      }
      const student = await this.memberRepository.find(payload.memberUuid);
      const session = await this.sessionRepository.find(payload.sessionUuid);
      if (
        (!student || student.masterUuid !== master.uuid) &&
        (!session || session.masterUuid !== master.uuid)
      ) {
        throw AppError.forbidden("You can only record attendance for your assigned students or sessions.");
      }
    }

    const session = await this.sessionRepository.find(payload.sessionUuid);
    if (!session) {
      throw AppError.validation("Selected session was not found.");
    }

    const student = await this.memberRepository.find(payload.memberUuid);
    if (!student || student.status !== "active") {
      throw AppError.validation("Selected member must be active.");
    }

    return this.repository.record(payload, actorEmail || "admin");
  }

  async listMyAttendance(): Promise<AttendanceRecord[]> {
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    if (!actorEmail) {
      throw AppError.unauthorized("Authentication required.");
    }
    const member = await this.memberRepository.byEmail(actorEmail);
    if (!member) {
      return [];
    }
    return this.repository.byMember(member.uuid);
  }

  async listForSession(sessionUuid: string, date?: string): Promise<AttendanceRecord[]> {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
      const master = await this.masterRepository.byEmail(actorEmail);
      const session = await this.sessionRepository.find(sessionUuid);
      if (!master || !session || session.masterUuid !== master.uuid) {
        throw AppError.forbidden("Access denied to this session attendance.");
      }
    }
    return this.repository.bySession(sessionUuid, date);
  }
}
