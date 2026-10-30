import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
const samples = [
  [
    "d0000001",
    "b0000001",
    "Organic cotton T-shirt",
    "Knitwear",
    "Illustrative 180 GSM organic cotton crew neck T-shirt for bulk sourcing.",
    "piece",
    "500 pieces"
  ],
  [
    "d0000002",
    "b0000002",
    "Textile machinery spare parts",
    "Engineering",
    "Illustrative precision components and replacement spares for textile machinery.",
    "piece",
    "50 pieces"
  ],
  [
    "d0000003",
    "b0000003",
    "Corrugated shipping cartons",
    "Packaging",
    "Illustrative recyclable corrugated cartons for garment and industrial shipments.",
    "carton",
    "1,000 cartons"
  ],
  [
    "d0000004",
    "b0000004",
    "Cotton jersey fabric",
    "Fabric",
    "Illustrative cotton jersey fabric for knitwear production and bulk garment sourcing.",
    "kg",
    "500 kg"
  ],
  [
    "d0000005",
    "b0000005",
    "Recycled cotton yarn",
    "Sustainability",
    "Illustrative recycled cotton yarn and reclaimed fibre for sustainable textile sourcing.",
    "kg",
    "500 kg"
  ],
  [
    "d0000006",
    "b0000006",
    "Export freight coordination",
    "Logistics",
    "Illustrative freight forwarding and shipment coordination service for export businesses.",
    "shipment",
    "1 shipment"
  ],
  [
    "d0000007",
    "b0000007",
    "Apparel sourcing and quality inspection",
    "Sourcing",
    "Illustrative apparel sourcing, buying coordination and quality inspection service.",
    "project",
    "1 project"
  ],
  [
    "d0000008",
    "b0000008",
    "ERP implementation and IT support",
    "Business services",
    "Illustrative business automation, ERP implementation and IT support for growing companies.",
    "project",
    "1 project"
  ]
] as const;
export async function seedProductSamples(database: Kysely<TconnectDatabase>) {
  for (const [uuid, companyUuid, name, category, description, unit, minimumOrder] of samples) {
    await sql`INSERT IGNORE INTO tconnect_products(uuid,company_uuid,name,category,description,price,unit,minimum_order,image_data_url,status) SELECT ${uuid},uuid,${name},${category},${description},NULL,${unit},${minimumOrder},'','active' FROM tconnect_companies WHERE uuid=${companyUuid}`.execute(
      database
    );
  }
}
