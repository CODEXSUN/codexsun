import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
const samples = [
  {
    name: "Tirupur Knitwear Collective",
    slug: "tirupur-knitwear-collective",
    tagline: "Stronger threads. Shared growth.",
    description:
      "A demonstration association for knitwear manufacturers, sourcing teams and textile specialists. Members share production knowledge, discover local partners and build better supply chains together.",
    industry: "Textiles & Apparel",
    city: "Tirupur",
    color: "#17675b",
    initials: "TK",
    uuid: "a0000001",
    status: "active"
  },
  {
    name: "Kongu Industry Network",
    slug: "kongu-industry-network",
    tagline: "Local expertise. Wider possibilities.",
    description:
      "An illustrative multi-industry association connecting engineering, packaging, logistics and business services across the Kongu region.",
    industry: "Multi-industry",
    city: "Tirupur",
    color: "#8e5836",
    initials: "KI",
    uuid: "a0000002",
    status: "active"
  },
  {
    name: "Green Textile Forum",
    slug: "green-textile-forum",
    tagline: "A more responsible way to make.",
    description:
      "A sample community for circular textiles, resource efficiency and practical sustainability knowledge. Membership is illustrative and carries no certification claim.",
    industry: "Sustainability",
    city: "Tirupur",
    color: "#657644",
    initials: "GT",
    uuid: "a0000003",
    status: "active"
  }
] as const;
export async function seedAssociationSamples(database: Kysely<TconnectDatabase>) {
  for (const row of samples)
    await sql`INSERT IGNORE INTO tconnect_associations
    (uuid, name, slug, tagline, description, industry, city, color, initials, status) VALUES
    (${row.uuid}, ${row.name}, ${row.slug}, ${row.tagline}, ${row.description}, ${row.industry}, ${row.city}, ${row.color}, ${row.initials}, 'active')`.execute(
      database
    );
}
