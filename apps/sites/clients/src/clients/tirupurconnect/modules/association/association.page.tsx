import { useTextileContent } from "../../portal.content";
import { useState } from "react";
import { ArrowUpRight, Users, Search, ArrowLeft } from "lucide-react";
import type { Association } from "@codexsun/tconnect-web/public";
import type { Company } from "@codexsun/tconnect-web/public";
import { CompanyCard } from "../company/company.card";
export function AssociationsPage({
  associations,
  companies,
  slug
}: {
  associations: Association[];
  companies: Company[];
  slug: string | undefined;
}) {
  const { associations: copy } = useTextileContent();
  const [search, setSearch] = useState("");
  const selected = associations.find((item) => item.slug === slug);
  if (slug && !selected)
    return (
      <main className="tc-container tc-empty">
        <h1>Association not found</h1>
        <a href="/associations">Explore associations</a>
      </main>
    );
  const members = companies.filter(
    (company) =>
      company.associationUuid === selected?.uuid &&
      `${company.name} ${company.products} ${company.city}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );
  const filtered = associations.filter((item) =>
    `${item.name} ${item.city} ${item.industry}`.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <main className="tc-container tc-associations-page">
      {selected ? (
        <>
          <a href="/associations" className="tc-back">
            <ArrowLeft size={16} />
            All associations
          </a>
          <section className="tc-association-profile" style={{ borderColor: selected.color }}>
            <span className="tc-association-logo" style={{ background: selected.color }}>
              {selected.initials}
            </span>
            <span className="tc-eyebrow">
              {selected.city} · {selected.industry}
            </span>
            <h1>{selected.name}</h1>
            <p>{selected.description}</p>
            <a className="tc-button" href={`/register?association=${selected.uuid}`}>
              Request membership <ArrowUpRight size={17} />
            </a>
            <small>
              Membership requests require staff approval. Example organizations are sample profiles.
            </small>
          </section>
          <div className="tc-section-heading">
            <h2>Meet the members</h2>
            <span>{members.length} published businesses</span>
          </div>
        </>
      ) : (
        <section className="tc-page-intro">
          <span className="tc-eyebrow">{copy.label}</span>
          <h1>
            {copy.title}
            <br />
            <em>{copy.emphasis}</em>
          </h1>
          <p>{copy.intro}</p>
        </section>
      )}
      <label className="tc-search tc-association-search">
        <Search size={18} />
        <input
          aria-label={selected ? "Search association members" : "Search associations"}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            selected
              ? "Search members by name, product or location"
              : "Association, industry or location"
          }
        />
      </label>
      {selected ? (
        <div className="tc-company-grid">
          {members.map((company) => (
            <CompanyCard key={company.uuid} company={company} association={selected.name} />
          ))}
        </div>
      ) : (
        <div className="tc-association-grid">
          {filtered.map((item) => (
            <a className="tc-association-card" key={item.uuid} href={`/associations/${item.slug}`}>
              <span className="tc-association-logo" style={{ background: item.color }}>
                {item.initials}
              </span>
              <span className="tc-eyebrow">
                {item.city} · {item.industry}
              </span>
              <h2>{item.name}</h2>
              <p>{item.tagline}</p>
              <p>{item.description}</p>
              <div className="tc-card-footer">
                <span>
                  <Users size={16} />
                  {companies.filter((company) => company.associationUuid === item.uuid).length}{" "}
                  published members
                </span>
                <ArrowUpRight size={19} />
              </div>
            </a>
          ))}
        </div>
      )}
      {(selected ? !members.length : !filtered.length) ? (
        <div className="tc-empty">
          <h3>No matching {selected ? "members" : "associations"} yet.</h3>
          <button className="tc-button" onClick={() => setSearch("")}>
            Clear search
          </button>
        </div>
      ) : null}
      <p className="tc-art-credit">
        Example organizations and affiliations are demonstration content. Membership does not imply
        certification.
      </p>
    </main>
  );
}
