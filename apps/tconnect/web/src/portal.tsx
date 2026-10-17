import { PortalBrand, PortalFooter } from "./portal.brand";
import { CategoryDiscovery, matchesCategory, textileCategories } from "./portal.categories";
import { PortalInformation } from "./portal.information";
import { BuyerRegistration } from "./modules/buyer/buyer.registration";
import { MemberRegistration } from "./modules/member/member.registration";
import { memberLoginUrl, registrationContext } from "./modules/member/member.services";
import { PortalHero } from "./portal.hero";
import { useEffect, useState } from "react";
import { ArrowUpRight, Search, Layers3, Users, Globe2, Menu, X } from "lucide-react";
import { getCompany } from "./modules/company/company.services";
import { getAssociation } from "./modules/association/association.services";
import { getCommunity } from "./modules/community/community.services";
import type { Company } from "./modules/company/company.types";
import type { Association } from "./modules/association/association.types";
import type { CommunityPost } from "./modules/community/community.types";
import { CompanyCard } from "./modules/company/company.card";
import { CompanyProfile } from "./modules/company/company.profile";
import { AssociationsPage } from "./modules/association/association.page";
import { CommunityPage } from "./modules/community/community.page";
import "./portal.css";
import "./portal.editorial.css";
export function TconnectPortal() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [error, setError] = useState("");
  const [corporateId, setCorporateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState(false);
  const [dense, setDense] = useState(false);
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [industry, setIndustry] = useState(params.get("industry") ?? "All industries");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [role, setRole] = useState(params.get("role") ?? "all");
  const path = location.pathname.split("/").filter(Boolean);
  const directory = path[0] === "companies" && !path[1];
  const home = !path[0];
  useEffect(() => {
    Promise.all([getCompany(), getAssociation(), getCommunity(), registrationContext()])
      .then(([a, b, c, registration]) => {
        setCorporateId(registration.corporateId);
        setCompanies(a);
        setAssociations(b);
        setPosts(c);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const title = path[0]
      ? path[0].charAt(0).toUpperCase() + path[0].slice(1)
      : "Textile Business Network";
    document.title = `${title} | Tirupur Connect`;
  }, [path[0]]);
  const industries = [...new Set(companies.map((company) => company.industry))];
  const filtered = companies.filter(
    (company) =>
      (industry === "All industries" || company.industry === industry) &&
      (role === "all" || company.role === role) &&
      (!city || company.city === city) &&
      matchesCategory(company, category) &&
      `${company.name} ${company.products} ${company.city} ${company.industry} ${company.description} ${company.tagline}`
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const displayedCompanies = home
    ? [...filtered]
        .sort(
          (a, b) =>
            Number(matchesCategory(b, "Knitted Fabrics") || matchesCategory(b, "Yarn & Fibre")) -
            Number(matchesCategory(a, "Knitted Fabrics") || matchesCategory(a, "Yarn & Fibre"))
        )
        .slice(0, 4)
    : filtered;
  function filterIndustry(value: string) {
    setIndustry(value);
    const url = new URL(location.href);
    url.searchParams.set("industry", value);
    history.replaceState(null, "", url);
  }
  const selectedCompany = companies.find((company) => company.slug === path[1]);
  return (
    <div className={`tc-root ${dense ? "tc-compact" : ""}`}>
      <a className="tc-skip" href="#tc-content">
        Skip to content
      </a>
      <header className="tc-nav">
        <PortalBrand />
        <button
          className="tc-mobile-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menu}
          aria-controls="tc-navigation"
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav
          className={menu ? "tc-nav-links tc-open" : "tc-nav-links"}
          aria-label="Main navigation"
          id="tc-navigation"
        >
          <a className={directory ? "active" : ""} href="/companies">
            Find businesses
          </a>
          <a href="/categories">Categories</a>
          <a className={path[0] === "associations" ? "active" : ""} href="/associations">
            Associations
          </a>
          <a className={path[0] === "community" ? "active" : ""} href="/community">
            Community
          </a>
          <a href="/login">Login</a>
          <a className="tc-login-mobile" href={memberLoginUrl(corporateId)}>
            Seller / Member login
          </a>
        </nav>
        <a className="tc-login-link" href={memberLoginUrl(corporateId)}>
          Seller / Member login
        </a>
        <a className="tc-nav-cta" href="/register">
          Join Tirupur Connect <ArrowUpRight size={17} />
        </a>
      </header>
      <div id="tc-content" tabIndex={-1} />
      {path[0] === "categories" ? (
        <main>
          <CategoryDiscovery full />
        </main>
      ) : ["contact", "privacy", "terms", "login"].includes(path[0] ?? "") ? (
        <PortalInformation page={path[0] ?? "contact"} corporateId={corporateId} />
      ) : error ? (
        <main className="tc-container tc-empty" role="alert">
          <h1>We couldn’t load the network.</h1>
          <p>{error}</p>
          <button className="tc-button" onClick={() => location.reload()}>
            Try again
          </button>
        </main>
      ) : loading ? (
        <main className="tc-container tc-empty" role="status">
          <span className="tc-eyebrow">TIRUPUR CONNECT</span>
          <h1>Opening your next connection…</h1>
          <p>Loading companies and communities.</p>
        </main>
      ) : path[0] === "register" ? (
        path[1] === "buyer" ? (
          <BuyerRegistration corporateId={corporateId} />
        ) : (
          <MemberRegistration associations={associations} corporateId={corporateId} />
        )
      ) : home || directory ? (
        <>
          {home ? (
            <PortalHero />
          ) : (
            <section className="tc-container tc-page-intro">
              <span className="tc-eyebrow">YOUR NEXT BUSINESS PARTNER</span>
              <h1>
                A world of expertise.
                <br />
                Closer than you think.
              </h1>
              <p>
                Find textile manufacturers, suppliers, buyers and specialist services. Search
                published capabilities and explore Tirupur’s wider business network.
              </p>
            </section>
          )}
          {home ? (
            <div className="tc-proof">
              <span>
                <Layers3 size={20} />
                <strong>From yarn to garment.</strong> A connected textile ecosystem.
              </span>
              <span>
                <Users size={20} />
                <strong>Shared knowledge.</strong> A stronger business community.
              </span>
              <span>
                <Globe2 size={20} />
                <strong>Built for local.</strong> Ready for more.
              </span>
            </div>
          ) : null}
          {home ? <CategoryDiscovery /> : null}
          <main className="tc-container">
            <section className="tc-directory">
              <div className="tc-section-heading">
                <div>
                  <span className="tc-eyebrow">DISCOVER YOUR NEXT PARTNER</span>
                  <h2>{home ? "People who make possibilities." : "Find the right fit."}</h2>
                </div>
                {home ? (
                  <a className="tc-text-link" href="/companies">
                    Explore all businesses <ArrowUpRight size={18} />
                  </a>
                ) : (
                  <span>{filtered.length} businesses</span>
                )}
              </div>
              <p className="tc-sample-note">
                Demonstration profiles are fictional and marked as sample content. Published
                capabilities and memberships are supplied by profile owners; no independent
                verification is implied.
              </p>
              <div className="tc-industry-tabs" aria-label="Filter by industry">
                {["All industries", ...industries].map((item) => (
                  <button
                    key={item}
                    className={industry === item ? "active" : ""}
                    onClick={() => filterIndustry(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              {directory ? (
                <div className="tc-directory-controls">
                  <div className="tc-select-filters">
                    <label>
                      Textile category
                      <select
                        value={category}
                        onChange={(event) => {
                          setCategory(event.target.value);
                          const url = new URL(location.href);
                          url.searchParams.set("category", event.target.value);
                          history.replaceState(null, "", url);
                        }}
                      >
                        <option value="">All textile categories</option>
                        {textileCategories.map((item) => (
                          <option key={item.name}>{item.name}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Location
                      <select
                        value={city}
                        onChange={(event) => {
                          setCity(event.target.value);
                          const url = new URL(location.href);
                          url.searchParams.set("city", event.target.value);
                          history.replaceState(null, "", url);
                        }}
                      >
                        <option value="">All locations</option>
                        {[...new Set(companies.map((item) => item.city))].sort().map((item) => (
                          <option key={item}>{item}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="tc-search tc-filter-search">
                    <Search size={18} />
                    <input
                      aria-label="Search directory"
                      value={query}
                      onChange={(event) => {
                        setQuery(event.target.value);
                        const url = new URL(location.href);
                        url.searchParams.set("q", event.target.value);
                        history.replaceState(null, "", url);
                      }}
                      placeholder="Company, product, city or service"
                    />
                  </div>
                  <div className="tc-role-filter">
                    {["all", "manufacturer", "supplier", "buyer", "service"].map((item) => (
                      <button
                        key={item}
                        className={role === item ? "active" : ""}
                        onClick={() => {
                          setRole(item);
                          const url = new URL(location.href);
                          url.searchParams.set("role", item);
                          history.replaceState(null, "", url);
                        }}
                      >
                        {item === "all" ? "All businesses" : item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="tc-company-grid">
                {displayedCompanies.map((company) => (
                  <CompanyCard
                    key={company.uuid}
                    company={company}
                    association={
                      associations.find((item) => item.uuid === company.associationUuid)?.name
                    }
                  />
                ))}
              </div>
              {!filtered.length ? (
                <div className="tc-empty">
                  <h3>No matching businesses yet.</h3>
                  <p>Try another search or industry.</p>
                  <button
                    className="tc-button"
                    onClick={() => {
                      setQuery("");
                      setIndustry("All industries");
                      setRole("all");
                      setCategory("");
                      setCity("");
                      history.replaceState(null, "", location.pathname);
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : null}
            </section>
            {home ? (
              <>
                <section className="tc-association-feature">
                  <div>
                    <span className="tc-eyebrow">BUSINESS IS BETTER TOGETHER</span>
                    <h2>
                      Associations.
                      <br />
                      Community.
                      <br />
                      <em>Greater opportunities.</em>
                    </h2>
                    <p>
                      A home for your community. A spotlight for every member. Discover the people
                      shaping your industry.
                    </p>
                    <a className="tc-button" href="/associations">
                      Meet the associations <ArrowUpRight size={18} />
                    </a>
                  </div>
                  <div className="tc-association-stack">
                    {associations.map((item) => (
                      <a key={item.uuid} href={`/associations/${item.slug}`}>
                        <span className="tc-association-logo" style={{ background: item.color }}>
                          {item.initials}
                        </span>
                        <span>
                          <strong>{item.name}</strong>
                          <small>
                            {
                              companies.filter((company) => company.associationUuid === item.uuid)
                                .length
                            }{" "}
                            members · {item.city}
                          </small>
                        </span>
                        <ArrowUpRight size={20} />
                      </a>
                    ))}
                  </div>
                </section>
                <section className="tc-community-home">
                  <div className="tc-section-heading">
                    <div>
                      <span className="tc-eyebrow">FROM THE COMMUNITY</span>
                      <h2>Stay in the conversation.</h2>
                    </div>
                    <a className="tc-text-link" href="/community">
                      Visit community <ArrowUpRight size={18} />
                    </a>
                  </div>
                  <CommunityPage compact posts={posts} associations={associations} />
                </section>
                <section className="tc-bottom-cta">
                  <span className="tc-eyebrow">THE NEXT CHAPTER STARTS HERE</span>
                  <h2>
                    One connection can
                    <br />
                    <em>change what comes next.</em>
                  </h2>
                  <a className="tc-button tc-button-light" href="/register">
                    Join Tirupur Connect <ArrowUpRight size={18} />
                  </a>
                </section>
              </>
            ) : null}
          </main>
        </>
      ) : path[0] === "companies" ? (
        selectedCompany ? (
          <CompanyProfile
            company={selectedCompany}
            association={associations.find((item) => item.uuid === selectedCompany.associationUuid)}
          />
        ) : (
          <main className="tc-container tc-empty">
            <h1>Company not found</h1>
            <a href="/companies">Explore businesses</a>
          </main>
        )
      ) : path[0] === "associations" ? (
        <AssociationsPage associations={associations} companies={companies} slug={path[1]} />
      ) : path[0] === "community" ? (
        <CommunityPage posts={posts} associations={associations} />
      ) : (
        <main className="tc-container tc-empty">
          <h1>Page not found</h1>
          <a href="/">Back to Tirupur Connect</a>
        </main>
      )}
      <PortalFooter />
      <details className="tc-tweaks">
        <summary>Display</summary>
        <label>
          <input
            type="checkbox"
            checked={dense}
            onChange={(event) => setDense(event.target.checked)}
          />
          Compact business cards
        </label>
      </details>
    </div>
  );
}
