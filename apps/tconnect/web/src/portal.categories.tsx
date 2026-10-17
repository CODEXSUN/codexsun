import { ArrowUpRight } from "lucide-react";
import type { Company } from "./modules/company/company.types";
export const textileCategories = [
  {
    name: "Yarn & Fibre",
    words: "yarn|fibre|fiber|raw cotton",
    copy: "Cotton, blended and recycled yarns. Start with the right fibre.",
    tone: "cotton"
  },
  {
    name: "Knitted Fabrics",
    words: "jersey|knit|fabric|rib|interlock",
    copy: "Jersey, rib, interlock. Possibilities by the metre.",
    tone: "knit"
  },
  {
    name: "Dyeing & Processing",
    words: "dye|dyeing|processing|bleach|finishing",
    copy: "Dyeing, bleaching and finishing partners for your next collection.",
    tone: "dye"
  },
  {
    name: "Garment Manufacturing",
    words: "garment|apparel|t-shirt|kidswear|knitwear",
    copy: "T-shirts, kidswear and everyday knits, from sampling to production.",
    tone: "garment"
  },
  {
    name: "Printing & Embroidery",
    words: "print|embroidery|embroider",
    copy: "Screen printing, digital prints and embroidery with a point of view.",
    tone: "print"
  },
  {
    name: "Accessories & Packaging",
    words: "packaging|label|zipper|button|boxes|bags",
    copy: "Labels, trims and thoughtful packaging. Every detail matters.",
    tone: "pack"
  },
  {
    name: "Textile Machinery",
    words: "machinery|machine|spares|cnc",
    copy: "The engineering behind everyday excellence.",
    tone: "knit"
  },
  {
    name: "Quality Testing",
    words: "testing|quality|inspection",
    copy: "Confidence at every stage.",
    tone: "cotton"
  },
  {
    name: "Sourcing & Merchandising",
    words: "sourcing|merchandising|buying",
    copy: "Partners for your next collection.",
    tone: "garment"
  },
  {
    name: "Logistics & Export Services",
    words: "logistics|freight|export|warehousing",
    copy: "Local expertise. A world of destinations.",
    tone: "pack"
  },
  {
    name: "Sustainable Textiles",
    words: "recycled|reclaimed|organic|recovery|sustainable",
    copy: "New beginnings for fibres and ideas.",
    tone: "knit"
  },
  {
    name: "Textile Business Services",
    words: "services|erp|automation|support|business",
    copy: "Specialists who help you move forward.",
    tone: "print"
  }
];
export function matchesCategory(company: Company, selected: string) {
  const category = textileCategories.find((item) => item.name === selected);
  return category
    ? new RegExp(category.words, "i").test(
        `${company.industry} ${company.products} ${company.tagline}`
      )
    : !selected;
}
export function CategoryDiscovery({ full = false }: { full?: boolean }) {
  return (
    <section className={`tc-container tc-category-section ${full ? "tc-category-full" : ""}`} aria-labelledby="textile-discovery">
      <div className="tc-section-heading">
        <div>
          <span className="tc-eyebrow">EXPLORE TIRUPUR’S TEXTILE ECOSYSTEM</span>
          <h2 id="textile-discovery">
            Different expertise.
            <br />
            <em>Same ambition.</em>
          </h2>
        </div>
        <div className="tc-category-aside">
          <p>
            From the first fibre to the final shipment. Find your place in a connected textile
            community.
          </p>
          <a className="tc-text-link" href="/categories">
            Explore the ecosystem <ArrowUpRight size={18} />
          </a>
        </div>
      </div>
      <div className="tc-category-grid">
        {textileCategories.slice(0, full ? 12 : 6).map((item, index) => (
          <a
            key={item.name}
            className={`tc-category-panel tc-category-${item.tone}`}
            href={`/companies?category=${encodeURIComponent(item.name)}`}
          >
            <div className="tc-category-visual" aria-hidden="true">
              <span className="tc-category-image" style={{backgroundImage: `url(/textiles/${index < 6 ? "textile-collection" : "industry-collection"}.webp)`,backgroundPosition: `${(index % 3) * 50}% ${Math.floor((index % 6) / 3) * 100}%`}} />
              <span className="tc-category-number">{String(index + 1).padStart(2, "0")}</span>
            </div>
            <div className="tc-category-caption">
              <h3>{item.name}</h3>
              <p>{item.copy}</p>
              <ArrowUpRight size={20} />
            </div>
          </a>
        ))}
      </div>
      <p className="tc-art-credit">
        AI-created textile studies for illustration. Images do not depict listed businesses or certify their capabilities.
      </p>
    </section>
  );
}
