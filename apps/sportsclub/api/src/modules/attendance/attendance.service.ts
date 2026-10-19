import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { MemberRepository } from "../member/member.repository.js";
import type { SessionRepository } from "../session/session.repository.js";
import { attendancePayloadSchema } from "./attendance.schema.js";
import type { AttendanceRepository } from "./attendance.repository.js";
import type { AttendanceListQuery, AttendanceRecord } from "./attendance.types.js";
import type { ListResponse } from "../../sportsclub.pagination.js";

export class AttendanceService {
  constructor(
    private readonly repository: AttendanceRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly memberRepository: MemberRepository,
    private readonly masterRepository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async list(query?: AttendanceListQuery): Promise<ListResponse<AttendanceRecord>> {
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      return this.repository.list(query);
    }
    if (actorEmail) {
      const master = await this.masterRepository.byEmail(actorEmail);
      if (master) {
        if (master.status === "suspended") {
          throw AppError.forbidden("Your club membership is suspended.");
        }
        if (query?.sessionUuid) {
          const session = await this.sessionRepository.find(query.sessionUuid);
          if (!session || session.masterUuid !== master.uuid) {
            throw AppError.forbidden("Access denied to this session attendance.");
          }
        }
        if (query?.memberUuid) {
          const student = await this.memberRepository.find(query.memberUuid);
          if (!student || student.masterUuid !== master.uuid) {
            throw AppError.forbidden("Access denied to this student attendance.");
          }
        }
        return this.repository.list(query);
      }
    }
    this.assertAdmin();
    return this.repository.list(query);
  }

  async get(uuid: string): Promise<AttendanceRecord> {
    const record = await this.repository.find(uuid);
    if (!record) {
      throw AppError.notFound("Attendance record not found.");
    }

    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      return record;
    }

    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    if (actorEmail) {
      const student = await this.memberRepository.byEmail(actorEmail);
      if (student && student.uuid === record.memberUuid) {
        return record;
      }

      const master = await this.masterRepository.byEmail(actorEmail);
      if (master && master.status === "active") {
        const session = await this.sessionRepository.find(record.sessionUuid);
        const recordStudent = await this.memberRepository.find(record.memberUuid);
        if (
          (session && session.masterUuid === master.uuid) ||
          (recordStudent && recordStudent.masterUuid === master.uuid)
        ) {
          return record;
        }
      }
    }

    throw AppError.forbidden("Access denied to this attendance record.");
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }

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

  async update(uuid: string, input: unknown): Promise<AttendanceRecord> {
    const payload = attendancePayloadSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Attendance record not found.");
    }

    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      const master = await this.masterRepository.byEmail(actorEmail);
      const currentSession = await this.sessionRepository.find(current.sessionUuid);
      const nextSession = await this.sessionRepository.find(payload.sessionUuid);
      const currentStudent = await this.memberRepository.find(current.memberUuid);
      const nextStudent = await this.memberRepository.find(payload.memberUuid);
      if (
        !master || master.status !== "active" ||
        !currentSession || currentSession.masterUuid !== master.uuid ||
        !nextSession || nextSession.masterUuid !== master.uuid ||
        !currentStudent || currentStudent.masterUuid !== master.uuid ||
        !nextStudent || nextStudent.masterUuid !== master.uuid
      ) {
        throw AppError.forbidden("Only an assigned active master can update this attendance.");
      }
    }

    const session = await this.sessionRepository.find(payload.sessionUuid);
    const member = await this.memberRepository.find(payload.memberUuid);
    if (!session || !member || member.status !== "active") {
      throw AppError.validation("Selected session and active member are required.");
    }
    return this.repository.update(uuid, payload, actorEmail || "admin");
  }

  async delete(uuid: string): Promise<void> {
    this.assertAdmin();
    if (!(await this.repository.find(uuid))) {
      throw AppError.notFound("Attendance record not found.");
    }
    await this.repository.forceDelete(uuid);
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
