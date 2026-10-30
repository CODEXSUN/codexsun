import { sql, type Kysely } from "kysely";
import type { TconnectDatabase } from "../../context.js";
const samples = [
  {
    name: "Noyyal Knitworks",
    slug: "noyyal-knitworks",
    tagline: "Organic cotton, everyday essentials",
    description:
      "Noyyal Knitworks is a fictional Tirupur-based manufacturer profile created to demonstrate TConnect. Explore organic t-shirts, kidswear, cotton knits and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Textiles & Apparel",
    city: "Tirupur",
    color: "#40644e",
    initials: "NK",
    role: "manufacturer",
    products: "Organic T-shirts, Kidswear, Cotton knits",
    capacity: "40,000 pieces / month",
    established: 2008,
    associationUuid: "a0000001",
    website: "",
    uuid: "b0000001",
    status: "active"
  },
  {
    name: "Kongu Precision Works",
    slug: "kongu-precision-works",
    tagline: "Small parts. Exceptional precision.",
    description:
      "Kongu Precision Works is a fictional Tirupur-based manufacturer profile created to demonstrate TConnect. Explore cnc components, textile machinery spares and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Engineering",
    city: "Tirupur",
    color: "#6c7183",
    initials: "KP",
    role: "manufacturer",
    products: "CNC components, Textile machinery spares",
    capacity: "Custom batch manufacturing",
    established: 2012,
    associationUuid: "a0000002",
    website: "",
    uuid: "b0000002",
    status: "active"
  },
  {
    name: "Avinashi Eco Packs",
    slug: "avinashi-eco-packs",
    tagline: "Packaging with a lighter footprint",
    description:
      "Avinashi Eco Packs is a fictional Tirupur-based supplier profile created to demonstrate TConnect. Explore kraft boxes, paper bags, garment packaging and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Packaging",
    city: "Tirupur",
    color: "#b78150",
    initials: "AE",
    role: "supplier",
    products: "Kraft boxes, Paper bags, Garment packaging",
    capacity: "100,000 units / month",
    established: 2016,
    associationUuid: "a0000002",
    website: "",
    uuid: "b0000003",
    status: "active"
  },
  {
    name: "Palladam Fabric House",
    slug: "palladam-fabric-house",
    tagline: "From the first swatch to the final roll",
    description:
      "Palladam Fabric House is a fictional Tirupur-based supplier profile created to demonstrate TConnect. Explore cotton jersey, rib fabric, interlock fabric and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Textiles & Apparel",
    city: "Tirupur",
    color: "#94745f",
    initials: "PF",
    role: "supplier",
    products: "Cotton jersey, Rib fabric, Interlock fabric",
    capacity: "25 tonnes / month",
    established: 2003,
    associationUuid: "a0000001",
    website: "",
    uuid: "b0000004",
    status: "active"
  },
  {
    name: "Noyyal Circular Textiles",
    slug: "noyyal-circular-textiles",
    tagline: "Giving good fibres a second chapter",
    description:
      "Noyyal Circular Textiles is a fictional Tirupur-based manufacturer profile created to demonstrate TConnect. Explore recycled yarn, reclaimed cotton, fabric recovery and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Sustainability",
    city: "Tirupur",
    color: "#63816b",
    initials: "NC",
    role: "manufacturer",
    products: "Recycled yarn, Reclaimed cotton, Fabric recovery",
    capacity: "15 tonnes / month",
    established: 2019,
    associationUuid: "a0000003",
    website: "",
    uuid: "b0000005",
    status: "active"
  },
  {
    name: "Kongu Freight Partners",
    slug: "kongu-freight-partners",
    tagline: "Your next shipment, closer to its destination",
    description:
      "Kongu Freight Partners is a fictional Tirupur-based service profile created to demonstrate TConnect. Explore domestic freight, export documentation, warehousing and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Logistics",
    city: "Tirupur",
    color: "#416676",
    initials: "KF",
    role: "service",
    products: "Domestic freight, Export documentation, Warehousing",
    capacity: "South India coverage",
    established: 2014,
    associationUuid: "a0000002",
    website: "",
    uuid: "b0000006",
    status: "active"
  },
  {
    name: "Tirupur Sourcing Studio",
    slug: "tirupur-sourcing-studio",
    tagline: "Thoughtful sourcing for growing brands",
    description:
      "Tirupur Sourcing Studio is a fictional Tirupur-based buyer profile created to demonstrate TConnect. Explore apparel sourcing, quality inspection, buying services and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Textiles & Apparel",
    city: "Tirupur",
    color: "#866c88",
    initials: "TS",
    role: "buyer",
    products: "Apparel sourcing, Quality inspection, Buying services",
    capacity: "Seasonal sourcing programmes",
    established: 2017,
    associationUuid: "a0000001",
    website: "",
    uuid: "b0000007",
    status: "active"
  },
  {
    name: "Velan Digital Systems",
    slug: "velan-digital-systems",
    tagline: "Practical technology for local business",
    description:
      "Velan Digital Systems is a fictional Tirupur-based service profile created to demonstrate TConnect. Explore erp implementation, it support, business automation and connect with the team through a buyer enquiry. This sample profile does not represent a verified business or an actual commercial offer.",
    industry: "Business Services",
    city: "Tirupur",
    color: "#555f8c",
    initials: "VD",
    role: "service",
    products: "ERP implementation, IT support, Business automation",
    capacity: "On-site and remote support",
    established: 2011,
    associationUuid: "a0000002",
    website: "",
    uuid: "b0000008",
    status: "active"
  }
] as const;
export async function seedCompanySamples(database: Kysely<TconnectDatabase>) {
  for (const row of samples)
    await sql`INSERT IGNORE INTO tconnect_companies
    (uuid, name, slug, tagline, description, industry, city, color, initials, role, products, capacity, established, associationUuid, website, status) VALUES
    (${row.uuid}, ${row.name}, ${row.slug}, ${row.tagline}, ${row.description}, ${row.industry}, ${row.city}, ${row.color}, ${row.initials}, ${row.role}, ${row.products}, ${row.capacity}, ${row.established}, ${row.associationUuid}, ${row.website}, 'active')`.execute(
      database
    );
}
