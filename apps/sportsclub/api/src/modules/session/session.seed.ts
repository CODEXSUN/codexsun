import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { SessionRepository } from "./session.repository.js";
import type { SessionPayload } from "./session.types.js";

export const initialSportsclubSessions: (SessionPayload & { uuid: string })[] = [
  {
    uuid: "c0010001",
    title: "Silambam Morning Batch",
    programUuid: "a0010001",
    masterUuid: "b0010001",
    daysOfWeek: "Mon, Wed, Fri",
    startTime: "06:00",
    endTime: "07:30",
    venue: "Tenkasi Gurukulam Grounds",
    maxCapacity: 30,
    isApprovedPublic: true,
    status: "active",
    revision: 0
  },
  {
    uuid: "c0010002",
    title: "Silambam Evening Batch",
    programUuid: "a0010001",
    masterUuid: "b0010001",
    daysOfWeek: "Tue, Thu, Sat",
    startTime: "17:30",
    endTime: "19:00",
    venue: "Tenkasi Gurukulam Grounds",
    maxCapacity: 30,
    isApprovedPublic: true,
    status: "active",
    revision: 0
  }
];

export async function seedSessionModule(db: Kysely<SportsclubDatabase>) {
  const repository = new SessionRepository(db);
  for (const item of initialSportsclubSessions) {
    const existing = await repository.find(item.uuid);
    if (!existing) {
      await repository.save(item.uuid, item);
    }
  }
}
