import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { ProgramRepository } from "./program.repository.js";
import type { ProgramPayload } from "./program.types.js";

export const initialSportsclubPrograms: (ProgramPayload & { uuid: string })[] = [
  {
    uuid: "a0010001",
    code: "SILAMBAM",
    name: "Veerathamilan Traditional Silambam",
    discipline: "Silambam",
    description:
      "Traditional martial art and self-defense curriculum of Tamil Nadu, covering fundamental footwork, single stick rotations (Nedunkambu), sparring techniques, and discipline.",
    level: "all_levels",
    ageGroup: "Age 6+",
    isApprovedPublic: true,
    status: "active",
    sortOrder: 1,
    revision: 0
  },
  {
    uuid: "a0010002",
    code: "VARMA",
    name: "Traditional Varma Kalai & Defensive Art",
    discipline: "Varma Kalai",
    description:
      "Ancient vital pressure point principles, structural balance, traditional conditioning, and ethical self-defense under experienced master supervision.",
    level: "intermediate",
    ageGroup: "Teens & Adults",
    isApprovedPublic: true,
    status: "active",
    sortOrder: 2,
    revision: 0
  },
  {
    uuid: "a0010003",
    code: "WEAPONS",
    name: "Traditional Tamil Weaponry",
    discipline: "Weaponry",
    description:
      "Advanced traditional weapons training including Surul Vaal (flexible sword), Vaal Veechu (single/double sword), Maduvu (deer horn), and traditional forms.",
    level: "advanced",
    ageGroup: "Teens & Adults",
    isApprovedPublic: true,
    status: "active",
    sortOrder: 3,
    revision: 0
  }
];

export async function seedProgramModule(db: Kysely<SportsclubDatabase>) {
  const repository = new ProgramRepository(db);
  for (const item of initialSportsclubPrograms) {
    const existing = await repository.byCode(item.code);
    if (!existing) {
      await repository.save(item.uuid, item);
    }
  }
}
