import type { Company } from "@codexsun/tconnect-web/public";
import type { Association } from "@codexsun/tconnect-web/public";
import type { CommunityPost } from "@codexsun/tconnect-web/public";
export function portalMetadata(
  pathname: string,
  records: {
    company?: Company | undefined;
    association?: Association | undefined;
    post?: CommunityPost | undefined;
  } = {}
) {
  const path = pathname.split("/").filter(Boolean);
  const names: Record<string, string> = {
    companies: "Find Textile Businesses & Products",
    categories: "Textile Categories",
    associations: "Associations & Industry Networks",
    community: "Textile Insights & Community",
    register: path[1] === "buyer" ? "Buyer Registration" : "Seller & Member Registration",
    join: "Join the Textile Business Network",
    login: "Member & Buyer Login",
    contact: "Contact Tirupur Connect",
    privacy: "Privacy Policy",
    terms: "Terms & Conditions",
    standards: "Textile Certifications & Standards",
    enterprises: "Textile Company Spotlights"
  };
  const record =
    path[0] === "companies"
      ? records.company
      : path[0] === "associations"
        ? records.association
        : undefined;
  const post = path[0] === "community" ? records.post : undefined;
  const title = `${record?.name ?? post?.title ?? names[path[0] ?? ""] ?? "Good Textile Business Starts with a Great Connection"} | Tirupur Connect`;
  const descriptions: Record<string, string> = {
    companies:
      "Search textile businesses and published products. Compare capabilities, locations, minimum orders and prices, then send your sourcing enquiry.",
    categories:
      "Explore Tirupur’s textile value chain, from yarn and knitted fabrics to processing, garment production, packaging and export services.",
    associations:
      "Meet Tirupur’s industry networks, explore published member businesses and request association membership.",
    community:
      "Explore textile sourcing knowledge, association announcements, industry events and opportunities from Tirupur’s business community.",
    register:
      path[1] === "buyer"
        ? "Create a buyer account to post textile requirements, request quotations, compare offers and talk privately with sellers."
        : "Create a seller or association member account. Build your company profile, publish products and respond to buyer enquiries.",
    join: "Find your place in Tirupur’s textile network. Join as a buyer, seller, manufacturer, service provider or association member.",
    login:
      "Sign in to manage your company, products, sourcing requirements, enquiries, quotations and private conversations.",
    contact:
      "Contact Tirupur Connect at info@tirupurconnect.com or 9655227767 for business network and account enquiries.",
    privacy:
      "Learn how Tirupur Connect handles public business profiles, private accounts, enquiries and personal information.",
    terms:
      "Read the terms for business profiles, sourcing enquiries, quotations and community participation on Tirupur Connect.",
    standards:
      "Understand GOTS, GRS, OEKO-TEX STANDARD 100 and ISO 9001 references. Check the scope, issuer and validity of company evidence.",
    enterprises:
      "Discover textile company spotlights and explore the capabilities behind Tirupur’s manufacturers and suppliers."
  };
  const description = (
    record?.description ??
    post?.body ??
    descriptions[path[0] ?? ""] ??
    "Find textile manufacturers, knitted fabrics, yarn, garments and specialist services. Connect with Tirupur’s business community, post requirements and compare seller quotations."
  ).slice(0, 180);
  const image = records.company?.logoDataUrl
    ? `/social/companies/${records.company.slug}.${records.company.logoDataUrl.startsWith("data:image/jpeg") ? "jpg" : records.company.logoDataUrl.startsWith("data:image/png") ? "png" : "webp"}`
    : "/textiles/textile-hero.webp";
  return {
    title,
    description,
    canonical: `https://tirupurconnect.com${pathname.replace(/\/$/, "") || "/"}`,
    image: `https://tirupurconnect.com${image}`,
    type: post ? "article" : "website",
    sample: /fictional|sample|demo|illustrative/i.test(
      `${record?.description ?? post?.body ?? ""} ${post ? (records.association?.description ?? "") : ""}`
    ),
    account: path[0] === "login" || path[0] === "register"
  };
}
