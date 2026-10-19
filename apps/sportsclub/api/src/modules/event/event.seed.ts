import type { Kysely } from "kysely";
import type { SportsclubDatabase } from "../../sportsclub.types.js";
import { EventRepository } from "./event.repository.js";
import type { EventPayload } from "./event.types.js";

export const initialSportsclubEvents: (EventPayload & { uuid: string })[] = [
  {
    uuid: "e0010001",
    title: "Annual Gurukulam Silambam Demonstration & Gathering",
    eventType: "demonstration",
    description:
      "Public traditional martial arts demonstration by students and masters of Veerathamilan Traditional Sivakalai Gurukulam.",
    eventDate: "2026-12-25 09:00",
    endDate: "2026-12-25 13:00",
    location: "Tenkasi Sports Ground, Tenkasi",
    isApprovedPublic: false,
    status: "upcoming",
    revision: 0
  }
];

export async function seedEventModule(db: Kysely<SportsclubDatabase>) {
  const repository = new EventRepository(db);
  for (const item of initialSportsclubEvents) {
    const existing = await repository.find(item.uuid);
    if (!existing) {
      await repository.save(item.uuid, item);
    }
  }
}
