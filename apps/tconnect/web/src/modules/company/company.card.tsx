import { ArrowUpRight, MapPin } from "lucide-react";
import type { Company } from "./company.types";
export function CompanyCard({
  company,
  association
}: {
  company: Company;
  association?: string | undefined;
}) {
  return (
    <a className="tc-company" href={`/companies/${company.slug}`}>
      <div className="tc-company-art" style={{ background: company.color }}>
        <span className="tc-art-line" />
        {company.logoDataUrl ? (
          <img className="tc-company-logo" src={company.logoDataUrl} alt={`${company.name} logo`} />
        ) : (
          <span className="tc-monogram">{company.initials}</span>
        )}
        <span className="tc-art-label">{company.industry}</span>
        <ArrowUpRight size={21} />
      </div>
      <div className="tc-company-info">
        <div className="tc-meta">
          <span>{company.role}</span>
          <span>
            <MapPin size={13} />
            {company.city}
          </span>
        </div>
        {company.description.toLowerCase().includes("fictional") ? (
          <span className="tc-sample-label">Sample business</span>
        ) : null}
        <h3>{company.name}</h3>
        <p>{company.tagline}</p>
        <div className="tc-product-tags">
          {company.products
            .split(",")
            .slice(0, 2)
            .map((product) => (
              <span key={product}>{product.trim()}</span>
            ))}
        </div>
        {association ? <div className="tc-member">Member of {association}</div> : null}
        <div className="tc-card-footer">
          <span>Explore company</span>
          <ArrowUpRight size={17} />
        </div>
      </div>
    </a>
  );
}
