import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { MemberRepository } from "./member.repository.js";
import type { MemberPayload } from "./member.types.js";

export const initialSportsclubMembers: (MemberPayload & { uuid: string })[] = [
  {
    uuid: "d0010001",
    email: "kabilan@tenkasisports.test",
    name: "S. Kabilan",
    phone: "+91 94431 11111",
    dateOfBirth: "2010-05-15",
    gender: "male",
    guardianName: "S. Murugan",
    guardianPhone: "+91 94431 11112",
    emergencyContact: "+91 94431 11112",
    medicalNotes: "No known conditions.",
    address: "Tenkasi Main Road, Tenkasi",
    programUuid: "a0010001",
    masterUuid: "b0010001",
    role: "student",
    status: "active",
    progressNote: "Mastered fundamental stances (Kaalvari) and single stick rotation.",
    revision: 0
  }
];

export async function seedMemberModule(db: Kysely<SportsclubDatabase>) {
  const repository = new MemberRepository(db);
  for (const item of initialSportsclubMembers) {
    const existing = await repository.byEmail(item.email);
    if (!existing) {
      await repository.save(item.uuid, item, "system", "seed", "Initial seed member");
    }
  }
}
