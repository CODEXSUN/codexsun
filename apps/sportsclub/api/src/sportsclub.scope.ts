import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "./sportsclub.types.js";
import { MemberRepository } from "./modules/member/member.repository.js";
import { MasterRepository } from "./modules/master/master.repository.js";

export type SportsclubStudentScope = {
  admissionNo: string;
  batchIds: number[];
  status: string;
  studentName: string;
  studentUuid: string;
};

export type SportsclubMasterScope = {
  assignedBatches: number[];
  masterName: string;
  masterUuid: string;
  specialization?: string;
  status: string;
};

export async function resolveStudentScope(
  database: unknown,
  userUuid: string,
  email?: string
): Promise<SportsclubStudentScope | null> {
  if (!database || !userUuid) return null;
  const db = database as unknown as Kysely<SportsclubDatabase>;
  const memberRepo = new MemberRepository(db);

  const member =
    (await memberRepo.find(userUuid)) ??
    (email ? await memberRepo.byEmail(email) : undefined);

  if (!member || member.role !== "student") return null;

  return {
    studentUuid: member.uuid,
    studentName: member.name,
    admissionNo: member.uuid,
    status: member.status,
    batchIds: []
  };
}

export async function resolveMasterScope(
  database: unknown,
  userUuid: string,
  email?: string
): Promise<SportsclubMasterScope | null> {
  if (!database || !userUuid) return null;
  const db = database as unknown as Kysely<SportsclubDatabase>;
  const masterRepo = new MasterRepository(db);

  const master =
    (await masterRepo.find(userUuid)) ??
    (email ? await masterRepo.byEmail(email) : undefined);

  if (!master) return null;

  return {
    masterUuid: master.uuid,
    masterName: master.name,
    specialization: master.primaryDiscipline,
    status: master.status,
    assignedBatches: []
  };
}
