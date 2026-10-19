import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { MasterRepository } from "./master.repository.js";
import type { MasterPayload } from "./master.types.js";

export const initialSportsclubMasters: (MasterPayload & { uuid: string })[] = [
  {
    uuid: "b0010001",
    email: "veerapandian@tenkasisports.test",
    name: "Asan Thiru. Veerapandian",
    phone: "+91 94431 00000",
    title: "Silambam & Varma Asan",
    primaryDiscipline: "Silambam",
    publicBio:
      "Founder of Veerathamilan Traditional Sivakalai Gurukulam. Kalaichudarmani awardee with over 6000 students trained across traditional Silambam, Varma Kalai, and Tamil martial arts heritage.",
    privateNotes: "Head Master & Founder.",
    experienceYears: 30,
    isApprovedPublic: true,
    status: "active",
    sortOrder: 1,
    revision: 0
  }
];

export async function seedMasterModule(db: Kysely<SportsclubDatabase>) {
  const repository = new MasterRepository(db);
  for (const item of initialSportsclubMasters) {
    const existing = await repository.byEmail(item.email);
    if (!existing) {
      await repository.save(item.uuid, item);
    }
  }
}
