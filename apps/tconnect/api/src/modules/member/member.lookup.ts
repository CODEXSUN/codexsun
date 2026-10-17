import type { Kysely } from "kysely";
import { AppError } from "@codexsun/framework/errors";
import type { TconnectDatabase } from "../../context.js";
import { MemberRepository } from "./member.repository.js";
export async function resolveMemberScope(database: Kysely<TconnectDatabase>, userUuid: string) {
  const member = await new MemberRepository(database).findForUser(userUuid);
  if (member?.status === "inactive")
    throw AppError.forbidden("Your TConnect account is suspended. Contact the portal team.");
  return member
    ? {
        uuid: member.uuid,
        companyUuid: member.companyUuid,
        associationUuid:
          member.membershipStatus === "approved" ? member.requestedAssociationUuid : null,
        membershipStatus: member.membershipStatus
      }
    : null;
}

export async function lockMemberScope(database: Kysely<TconnectDatabase>, userUuid: string) {
  if (!userUuid) throw AppError.forbidden("A verified member identity is required.");
  const member = await new MemberRepository(database).findForUser(userUuid, true);
  if (!member || member.status !== "active")
    throw AppError.forbidden("Your TConnect account is unavailable.");
  return {
    uuid: member.uuid,
    companyUuid: member.companyUuid,
    associationUuid:
      member.membershipStatus === "approved" ? member.requestedAssociationUuid : null,
    membershipStatus: member.membershipStatus
  };
}
