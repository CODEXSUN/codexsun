import { ArrowUpRight, MapPin, ArrowRight } from "lucide-react";
import type { Company } from "./company.types";
import type { PublicCatalogProduct } from "../product/product.types";
import type { PublicCredential } from "../credential/credential.types";
import { CompanyBadges } from "./company.badges";
export function CompanyCard({
  company,
  association,
  products = [],
  credentials = []
}: {
  company: Company;
  association?: string | undefined;
  products?: PublicCatalogProduct[];
  credentials?: PublicCredential[];
}) {
  const href = `/companies/${company.slug}`;
  const primary = products[0];
  return (
    <article className="tc-company">
      <a
        className="tc-company-art"
        href={href}
        style={{ background: company.color }}
        aria-label={`Explore ${company.name}`}
      >
        <span className="tc-art-line" />
        {company.logoDataUrl ? (
          <img
            className="tc-company-logo"
            src={company.logoDataUrl}
            alt={`${company.name} logo`}
            loading="lazy"
          />
        ) : primary?.imageDataUrl ? (
          <img
            className="tc-company-product-photo"
            src={primary.imageDataUrl}
            alt={primary.name}
            loading="lazy"
          />
        ) : (
          <span className="tc-monogram">{company.initials}</span>
        )}
        <span className="tc-art-label">{company.industry}</span>
        <ArrowUpRight size={21} />
      </a>
      <div className="tc-company-info">
        <div className="tc-meta">
          <span>{company.role === "service" ? "Service provider" : company.role}</span>
          <span>
            <MapPin size={13} />
            {company.city}
          </span>
        </div>
        {company.description.toLowerCase().includes("fictional") ? (
          <span className="tc-sample-label">Sample business</span>
        ) : null}
        <h3>
          <a href={href}>{company.name}</a>
        </h3>
        <CompanyBadges
          sample={company.description.toLowerCase().includes("fictional")}
          credentials={credentials}
          href={`${href}#credentials`}
        />
        <p>{company.tagline}</p>
        <div className="tc-product-tags">
          {company.products
            .split(",")
            .slice(0, 2)
            .map((product) => (
              <span key={product}>{product.trim()}</span>
            ))}
        </div>
        {primary ? (
          <div className="tc-card-buying-info">
            <strong>
              {primary.price === null
                ? "Price on request"
                : `₹${primary.price.toLocaleString("en-IN")} / ${primary.unit}`}
            </strong>
            <span>MOQ: {primary.minimumOrder}</span>
            <small>{primary.name}</small>
          </div>
        ) : (
          <div className="tc-card-buying-info">
            <span>Discuss specifications & availability</span>
          </div>
        )}
        {association ? <div className="tc-member">Member of {association}</div> : null}
        <div className="tc-card-footer">
          <a href={href}>
            View profile <ArrowUpRight size={15} />
          </a>
          <a className="tc-card-enquire" href={`${href}?enquire=1`}>
            Enquire <ArrowRight size={14} />
          </a>
        </div>
      </div>
    </article>
  );
}
