import { AppError } from "@codexsun/framework/errors";
import type { SportsclubContext } from "../../sportsclub.types.js";
import type { MasterRepository } from "../master/master.repository.js";
import type { ListResponse } from "../../sportsclub.pagination.js";
import {
  memberPhotoUploadSchema,
  parseMemberPayload,
  studentEnrollmentSchema
} from "./member.schema.js";
import type { MemberRepository } from "./member.repository.js";
import type {
  MemberActivity,
  MemberListQuery,
  MemberPayload,
  MemberPhoto,
  MemberPortal,
  MemberRecord
} from "./member.types.js";

export class MemberService {
  constructor(
    private readonly repository: MemberRepository,
    private readonly masterRepository: MasterRepository,
    private readonly context: SportsclubContext
  ) {}

  async list(query?: MemberListQuery): Promise<ListResponse<MemberRecord>> {
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
        return this.repository.list({ ...query, masterUuid: master.uuid, role: "student" });
      }
    }

    throw AppError.forbidden("Club administrator or assigned master access required.");
  }

  async get(uuid: string): Promise<MemberRecord> {
    const member = await this.repository.find(uuid);
    if (!member) throw AppError.notFound("Member not found.");
    if (this.context.isSuperAdmin || this.context.isClubAdmin) return member;
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    const master = actorEmail ? await this.masterRepository.byEmail(actorEmail) : null;
    if (master?.status === "suspended")
      throw AppError.forbidden("Your club membership is suspended.");
    if (master && member.masterUuid === master.uuid && member.role === "student") return member;
    throw AppError.forbidden("Club administrator or assigned master access required.");
  }

  async readPhoto(uuid: string): Promise<MemberPhoto> {
    const member = await this.repository.find(uuid);
    if (!member || member.role !== "student") throw AppError.notFound("Student not found.");
    await this.assertPhotoReadAccess(member);
    const photo = await this.repository.readPhoto(uuid);
    if (!photo) throw AppError.notFound("Student photo not found.");
    return photo;
  }

  async uploadPhoto(uuid: string, input: unknown): Promise<Omit<MemberPhoto, "contentBase64">> {
    this.assertAdmin();
    const member = await this.repository.find(uuid);
    if (!member || member.role !== "student") throw AppError.notFound("Student not found.");
    const payload = memberPhotoUploadSchema.parse(input);
    const bytes = decodeMemberPhoto(payload.mimeType, payload.contentBase64);
    return this.repository.savePhoto(
      uuid,
      payload.mimeType,
      bytes,
      this.context.actorEmail ?? "admin"
    );
  }

  private async assertPhotoReadAccess(member: MemberRecord): Promise<void> {
    if (this.context.isSuperAdmin || this.context.isClubAdmin) return;
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    if (actorEmail && member.email.toLowerCase() === actorEmail) return;
    const master = actorEmail ? await this.masterRepository.byEmail(actorEmail) : undefined;
    if (master?.status === "active" && member.masterUuid === master.uuid) return;
    throw AppError.forbidden("Access denied to this student photo.");
  }

  async portal(): Promise<MemberPortal> {
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();

    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      const allMembers = await this.repository.listAll();
      const self = actorEmail ? await this.repository.byEmail(actorEmail) : null;
      return {
        actorEmail,
        role: this.context.isSuperAdmin ? "super_admin" : "club_admin",
        self: self ?? null,
        members: allMembers
      };
    }

    if (!actorEmail) {
      return {
        actorEmail: "",
        role: "unregistered",
        self: null,
        members: []
      };
    }

    const self = await this.repository.byEmail(actorEmail);
    if (!self) {
      const master = await this.masterRepository.byEmail(actorEmail);
      if (master) {
        if (master.status === "suspended") {
          throw AppError.forbidden("Your club membership is suspended.");
        }
        const assigned = await this.repository.studentsByMaster(master.uuid);
        const masterRecord: MemberRecord = {
          uuid: master.uuid,
          email: master.email,
          name: master.name,
          phone: master.phone,
          dateOfBirth: null,
          gender: null,
          guardianName: null,
          guardianPhone: null,
          emergencyContact: null,
          medicalNotes: "",
          address: "",
          programUuid: null,
          masterUuid: null,
          role: "master",
          status: master.status,
          progressNote: master.publicBio,
          revision: master.revision,
          createdAt: master.createdAt,
          updatedAt: master.updatedAt
        };
        return {
          actorEmail,
          role: "master",
          self: masterRecord,
          members: [masterRecord, ...assigned]
        };
      }
      return {
        actorEmail,
        role: "unregistered",
        self: null,
        members: []
      };
    }

    if (self.status === "suspended") {
      throw AppError.forbidden("Your club membership is suspended.");
    }

    if (self.role === "master") {
      const assigned = await this.repository.studentsByMaster(self.uuid);
      return {
        actorEmail,
        role: "master",
        self,
        members: [self, ...assigned]
      };
    }

    return {
      actorEmail,
      role: "student",
      self,
      members: [self]
    };
  }

  async enroll(input: unknown): Promise<MemberRecord> {
    const data = studentEnrollmentSchema.parse(input);
    const email = data.email.toLowerCase();

    const existing = await this.repository.byEmail(email);
    if (existing) {
      throw AppError.conflict("You already have a club membership.");
    }

    const payload: MemberPayload = {
      email,
      name: data.name,
      phone: data.phone ?? "",
      dateOfBirth: data.dateOfBirth ?? null,
      gender: data.gender ?? null,
      guardianName: data.guardianName ?? null,
      guardianPhone: data.guardianPhone ?? null,
      emergencyContact: data.emergencyContact ?? null,
      medicalNotes: data.medicalNotes ?? "",
      address: data.address ?? "",
      programUuid: data.programUuid ?? null,
      masterUuid: null,
      role: "student",
      status: "pending",
      progressNote: "",
      revision: 0
    };

    return this.repository.save(
      null,
      payload,
      this.context.actorEmail ?? email,
      "enroll",
      `Student enrollment application submitted for ${payload.name}`
    );
  }

  async save(uuid: string | null, input: unknown): Promise<MemberRecord> {
    this.assertAdmin();
    const payload = parseMemberPayload(input);
    const current = uuid ? await this.repository.find(uuid) : undefined;

    if (uuid && !current) {
      throw AppError.notFound("Member not found.");
    }

    if (!uuid && payload.revision !== 0) {
      throw AppError.conflict("A new member must use revision zero.");
    }

    const duplicate = await this.repository.byEmail(payload.email);
    if (duplicate && duplicate.uuid !== uuid) {
      throw AppError.conflict("This email already belongs to a club member.");
    }

    if (current?.role === "master" && (payload.role !== "master" || payload.status !== "active")) {
      const assignedStudents = await this.repository.studentsByMaster(current.uuid);
      if (assignedStudents.length > 0) {
        throw AppError.conflict(
          "Reassign this master's students before changing their role or status."
        );
      }
    }

    if (payload.masterUuid) {
      if (payload.role !== "student") {
        throw AppError.validation("Only students can be assigned to a master.");
      }
      const master = await this.masterRepository.find(payload.masterUuid);
      if (!master || master.status !== "active" || master.uuid === uuid) {
        throw AppError.validation("Choose an active master from this club for a student.");
      }
    }

    const actor = this.context.actorEmail ?? "admin";
    const action = uuid ? "update" : "create";
    return this.repository.save(uuid, payload, actor, action);
  }

  async progress(uuid: string, progressNote: string, revision: number): Promise<MemberRecord> {
    const actorEmail = (this.context.actorEmail ?? "").toLowerCase();
    const student = await this.repository.find(uuid);

    if (!student || student.role !== "student") {
      throw AppError.notFound("Student not found.");
    }

    if (this.context.isSuperAdmin || this.context.isClubAdmin) {
      return this.repository.save(
        uuid,
        { ...student, progressNote: progressNote.trim(), revision },
        actorEmail,
        "progress",
        `Progress note updated by administrator: ${progressNote.trim()}`
      );
    }

    const master = await this.masterRepository.byEmail(actorEmail);
    if (
      !master ||
      master.status !== "active" ||
      student.status !== "active" ||
      student.masterUuid !== master.uuid
    ) {
      throw AppError.forbidden("Only the student's assigned active master can update progress.");
    }

    return this.repository.save(
      uuid,
      { ...student, progressNote: progressNote.trim(), revision },
      actorEmail,
      "progress",
      `Progress note updated by Master ${master.name}: ${progressNote.trim()}`
    );
  }

  async activity(memberUuid: string): Promise<MemberActivity[]> {
    const portal = await this.portal();
    const isMemberInPortal = portal.members.some((m) => m.uuid === memberUuid);

    if (!isMemberInPortal && !this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.notFound("Member not found.");
    }

    return this.repository.activity(memberUuid);
  }

  private assertAdmin(): void {
    if (!this.context.isClubAdmin && !this.context.isSuperAdmin) {
      throw AppError.forbidden("Club super admin access is required.");
    }
  }
}

function decodeMemberPhoto(mimeType: MemberPhoto["mimeType"], contentBase64: string): Uint8Array {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(contentBase64)) {
    throw AppError.validation("Photo content must be valid base64.");
  }
  const bytes = Buffer.from(contentBase64, "base64");
  if (bytes.byteLength === 0 || bytes.byteLength > 2 * 1024 * 1024) {
    throw AppError.validation("Student photo must be 2 MiB or smaller.");
  }
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png =
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp =
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (!(
    (mimeType === "image/jpeg" && jpeg) ||
    (mimeType === "image/png" && png) ||
    (mimeType === "image/webp" && webp)
  )) {
    throw AppError.validation("Photo bytes must match the selected JPEG, PNG, or WebP format.");
  }
  return bytes;
}
