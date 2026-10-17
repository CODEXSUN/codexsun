import { ArrowUpRight, Users } from "lucide-react";
import type { Association } from "./association.types";
import type { Company } from "../company/company.types";
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
  const selected = slug ? associations.find((item) => item.slug === slug) : undefined;
  if (slug && !selected)
    return (
      <main className="tc-container tc-empty">
        <p className="tc-sample-note">
          Example association profiles and memberships are demonstration content until verified and
          approved.
        </p>
        <h1>Association not found</h1>
        <a href="/associations">Explore associations</a>
      </main>
    );
  const members = companies.filter((company) => company.associationUuid === selected?.uuid);
  return (
    <main className="tc-container">
      <section className="tc-page-intro">
        <span className="tc-eyebrow">GROW TOGETHER</span>
        <h1>
          {selected?.name ?? (
            <>
              A stronger network.
              <br />A shared future.
            </>
          )}
        </h1>
        <p>
          {selected?.description ??
            "Discover industry communities, connect with their members and turn shared knowledge into new possibilities."}
        </p>
      </section>
      {selected ? (
        <>
          <div className="tc-section-heading">
            <h2>Meet the members</h2>
            <span>{members.length} sample businesses</span>
          </div>
          <div className="tc-company-grid">
            {members.map((company) => (
              <CompanyCard key={company.uuid} company={company} association={selected.name} />
            ))}
          </div>
          {!members.length ? <p className="tc-empty">No published members yet.</p> : null}
        </>
      ) : (
        <div className="tc-association-grid">
          {associations.map((item) => (
            <a className="tc-association-card" key={item.uuid} href={`/associations/${item.slug}`}>
              <div className="tc-association-logo" style={{ background: item.color }}>
                {item.initials}
              </div>
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
                  members
                </span>
                <ArrowUpRight size={20} />
              </div>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
