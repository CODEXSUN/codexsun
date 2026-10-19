import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { MemberRepository } from "../member/member.repository.js";
import { progressEvaluationInputSchema } from "./progress.schema.js";
import type { ProgressRepository } from "./progress.repository.js";
import type {
  ProgressListQuery,
  ProgressPayload,
  ProgressRecord,
  StudentProgressView
} from "./progress.types.js";
import type { ListResponse } from "../../sportsclub.pagination.js";

export class ProgressService {
  constructor(
    private readonly repository: ProgressRepository,
    private readonly memberRepository: MemberRepository,
    private readonly masterRepository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async list(query?: ProgressListQuery): Promise<ListResponse<ProgressRecord>> {
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
        return this.repository.list({ ...query, masterUuid: master.uuid });
      }
    }
    this.assertAdmin();
    return this.repository.list(query);
  }

  async get(uuid: string): Promise<ProgressRecord> {
    const record = await this.repository.find(uuid);
    if (!record) {
      throw AppError.notFound("Progress record not found.");
    }
    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      return record;
    }
    const master = await this.masterRepository.byEmail((this.context.actorEmail ?? "").toLowerCase());
    const student = await this.memberRepository.find(record.memberUuid);
    if (master?.status === "active" && record.masterUuid === master.uuid && student?.masterUuid === master.uuid) {
      return record;
    }
    throw AppError.forbidden("Access denied to this progress record.");
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club administrator or super admin access required.");
    }
  }

  async listForMember(memberUuid: string): Promise<ProgressRecord[] | StudentProgressView[]> {
    const student = await this.memberRepository.find(memberUuid);
    if (!student) {
      throw AppError.notFound("Student not found.");
    }

    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();

    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      return this.repository.listByMember(memberUuid);
    }

    if (actorEmail && student.email.toLowerCase() === actorEmail) {
      const records = await this.repository.listByMember(memberUuid);
      return records.map((r) => ({
        uuid: r.uuid,
        memberUuid: r.memberUuid,
        masterUuid: r.masterUuid,
        programUuid: r.programUuid,
        stageLevel: r.stageLevel,
        score: r.score,
        assessment: r.assessment,
        status: r.status,
        gradedAt: r.gradedAt
      }));
    }

    const master = await this.masterRepository.byEmail(actorEmail);
    if (master && master.status === "active" && student.masterUuid === master.uuid) {
      return this.repository.listByMember(memberUuid);
    }

    throw AppError.notFound("Member progress not found.");
  }

  async evaluate(memberUuid: string, input: unknown): Promise<ProgressRecord> {
    const data = progressEvaluationInputSchema.parse(input);
    const student = await this.memberRepository.find(memberUuid);

    if (!student || student.role !== "student" || student.status !== "active") {
      throw AppError.validation("Student must exist and have active membership.");
    }

    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    let masterUuid: string;

    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      masterUuid = student.masterUuid ?? "m0010001";
    } else {
      const master = await this.masterRepository.byEmail(actorEmail);
      if (
        !master ||
        master.status !== "active" ||
        student.masterUuid !== master.uuid
      ) {
        throw AppError.forbidden("Only the student's assigned active master can evaluate progress.");
      }
      masterUuid = master.uuid;
    }

    const payload: ProgressPayload = {
      memberUuid,
      masterUuid,
      programUuid: data.programUuid ?? student.programUuid,
      stageLevel: data.stageLevel,
      score: data.score,
      assessment: data.assessment,
      privateNotes: data.privateNotes,
      status: data.status,
      revision: data.revision
    };

    const saved = await this.repository.save(null, payload, actorEmail || "admin");

    await this.memberRepository.save(
      student.uuid,
      {
        ...student,
        progressNote: `${data.stageLevel}: ${data.assessment}`,
        revision: student.revision
      },
      actorEmail || "admin",
      "progress_summary"
    );

    return saved;
  }

  async update(uuid: string, input: unknown): Promise<ProgressRecord> {
    const data = progressEvaluationInputSchema.parse(input);
    const current = await this.repository.find(uuid);
    if (!current) {
      throw AppError.notFound("Progress record not found.");
    }

    const student = await this.memberRepository.find(current.memberUuid);
    if (!student) {
      throw AppError.notFound("Student not found.");
    }

    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();

    if (!this.context.isSuperAdmin && !this.context.isClubAdmin) {
      const master = await this.masterRepository.byEmail(actorEmail);
      if (
        !master ||
        master.status !== "active" ||
        current.masterUuid !== master.uuid ||
        student.masterUuid !== master.uuid
      ) {
        throw AppError.forbidden("Only the student's assigned active master can update this evaluation.");
      }
    }

    const payload: ProgressPayload = {
      memberUuid: current.memberUuid,
      masterUuid: current.masterUuid,
      programUuid: data.programUuid ?? current.programUuid,
      stageLevel: data.stageLevel,
      score: data.score,
      assessment: data.assessment,
      privateNotes: data.privateNotes,
      status: data.status,
      revision: data.revision
    };

    return this.repository.save(uuid, payload, actorEmail || "admin");
  }
}
