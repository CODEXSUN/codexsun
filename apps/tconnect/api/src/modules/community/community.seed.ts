import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
const samples = [
  {
    title: "Better cotton sourcing starts with better questions",
    body: "A practical discussion for buying teams: ask about fibre traceability, minimum order quantities, sampling time and wash-test expectations before confirming a production run. Share your own sourcing checklist with the collective.",
    category: "knowledge",
    associationUuid: "a0000001",
    eventDate: null,
    uuid: "c0000001",
    status: "active"
  },
  {
    title: "Tirupur supplier meet: packaging and production",
    body: "Demo event: meet manufacturers, packaging partners and logistics teams to discuss lead times and responsible growth. This is illustrative sample content, not a real scheduled event.",
    category: "event",
    associationUuid: "a0000002",
    eventDate: "2026-11-12",
    uuid: "c0000002",
    status: "active"
  },
  {
    title: "Exploring recycled yarn partnerships",
    body: "A sample opportunity for textile businesses interested in evaluating recycled cotton blends. Connect with the forum to discuss pilot quantities and quality requirements.",
    category: "opportunity",
    associationUuid: "a0000003",
    eventDate: null,
    uuid: "c0000003",
    status: "active"
  }
] as const;
export async function seedCommunitySamples(database: Kysely<TconnectDatabase>) {
  for (const row of samples)
    await sql`INSERT IGNORE INTO tconnect_community
    (uuid, title, body, category, associationUuid, eventDate, status) VALUES
    (${row.uuid}, ${row.title}, ${row.body}, ${row.category}, ${row.associationUuid}, ${row.eventDate}, 'active')`.execute(
      database
    );
}
