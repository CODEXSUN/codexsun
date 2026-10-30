import { useTextileContent } from "./portal.content";
import { useState, useEffect, useCallback } from "react";
import { ArrowUpRight, Search, SlidersHorizontal } from "lucide-react";
import type { PortalData } from "./portal.data";
import { usePublicFeed } from "./portal.data";
import { FeedFeedback } from "./portal.feedback";
import { CompanyCard } from "./modules/company/company.card";
import { ProductDiscovery } from "./modules/product/product.discovery";
import { searchPublicProducts } from "@codexsun/tconnect-web/public";
import { matchesCategory, textileCategories } from "./portal.categories";
export function PortalDirectory({ data, home = false }: { data: PortalData; home?: boolean }) {
  const content = useTextileContent();
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [city, setCity] = useState(params.get("city") ?? "");
  const [industry, setIndustry] = useState(params.get("industry") ?? "");
  const [role, setRole] = useState(params.get("role") ?? "all");
  const [tab, setTab] = useState(params.get("view") === "products" ? "products" : "businesses");
  const [term, setTerm] = useState(query);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query]);
  const loadProducts = useCallback(() => searchPublicProducts(term), [term]);
  const productResults = usePublicFeed(loadProducts, []);
  useEffect(() => {
    if (home) return;
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({
      q: query,
      category,
      city,
      industry,
      role: role === "all" ? "" : role,
      view: tab === "products" ? "products" : ""
    })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    history.replaceState(null, "", url);
  }, [query, category, city, industry, role, tab, home]);
  const filtered = data.companies.data.filter(
    (company) =>
      (!industry || industry === "All industries" || company.industry === industry) &&
      (!city || company.city === city) &&
      (role === "all" || company.role === role) &&
      matchesCategory(company, category) &&
      `${company.name} ${company.products} ${company.city} ${company.industry} ${company.description}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
  );
  const companies = home
    ? [...filtered]
        .sort(
          (a, b) =>
            Number(matchesCategory(b, "Knitted Fabrics")) -
            Number(matchesCategory(a, "Knitted Fabrics"))
        )
        .slice(0, 4)
    : filtered;
  const products = productResults.data.filter((product) => {
    const words = textileCategories.find((item) => item.name === category)?.words;
    return (
      (!city || product.city === city) &&
      (!industry || industry === "All industries" || product.industry === industry) &&
      (!words ||
        new RegExp(words, "i").test(`${product.name} ${product.category} ${product.description}`))
    );
  });
  function reset() {
    setQuery("");
    setCategory("");
    setCity("");
    setIndustry("");
    setRole("all");
  }
  return (
    <section className="tc-directory" id="businesses" aria-labelledby="directory-title">
      <div className="tc-section-heading">
        <div>
          <span className="tc-eyebrow">{content.directory.label}</span>
          <h2 id="directory-title">
            {home ? (
              <>
                {content.directory.title}
                <br />
                <em>{content.directory.emphasis}</em>
              </>
            ) : (
              "Find the right fit."
            )}
          </h2>
        </div>
        {home ? (
          <a className="tc-text-link" href="/companies">
            Explore all businesses <ArrowUpRight size={18} />
          </a>
        ) : (
          <span>
            {tab === "businesses" ? filtered.length : products.length}{" "}
            {tab === "businesses" ? "businesses" : "products"}
          </span>
        )}
      </div>
      {home ? (
        <p className="tc-section-description">{content.directory.intro}</p>
      ) : (
        <>
          <div className="tc-discovery-tabs" aria-label="Search type">
            {["businesses", "products"].map((value) => (
              <button
                key={value}
                className={tab === value ? "active" : ""}
                aria-pressed={tab === value}
                onClick={() => setTab(value)}
              >
                {value === "businesses" ? "Find businesses" : "Find products"}
              </button>
            ))}
          </div>
          <div className="tc-discovery-filters">
            <label className="tc-search tc-filter-search">
              <Search size={19} />
              <input
                aria-label={tab === "products" ? "Search public products" : "Search directory"}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                maxLength={160}
                placeholder={
                  tab === "products"
                    ? "Product, material, company or city"
                    : "Company, product capability or service"
                }
              />
            </label>
            <label>
              Textile category
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">All textile categories</option>
                {textileCategories.map((item) => (
                  <option key={item.name}>{item.name}</option>
                ))}
              </select>
            </label>
            <label>
              Location
              <select value={city} onChange={(event) => setCity(event.target.value)}>
                <option value="">All locations</option>
                {[
                  ...new Set([
                    ...data.companies.data.map((item) => item.city),
                    ...productResults.data.map((item) => item.city)
                  ])
                ]
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
            <label>
              Industry
              <select value={industry} onChange={(event) => setIndustry(event.target.value)}>
                <option value="">All industries</option>
                {[...new Set(data.companies.data.map((item) => item.industry))]
                  .sort()
                  .map((value) => (
                    <option key={value}>{value}</option>
                  ))}
              </select>
            </label>
            {tab === "businesses" ? (
              <label>
                Business type
                <select value={role} onChange={(event) => setRole(event.target.value)}>
                  {["all", "manufacturer", "supplier", "buyer", "service"].map((value) => (
                    <option value={value} key={value}>
                      {value === "all"
                        ? "All businesses"
                        : value === "service"
                          ? "Service provider"
                          : value}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
          </div>
          {query || category || city || industry || role !== "all" ? (
            <div className="tc-active-filters">
              <SlidersHorizontal size={15} />
              <span>
                {[query, category, city, industry, role !== "all" ? role : ""]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
              <button onClick={reset}>Clear filters</button>
            </div>
          ) : null}
        </>
      )}
      {tab === "products" ? (
        <>
          <FeedFeedback
            loading={productResults.loading}
            error={productResults.error}
            retry={productResults.reload}
            label="Products"
          />
          {!productResults.loading && !productResults.error ? (
            <ProductDiscovery products={products} />
          ) : null}
          <p className="tc-art-credit">
            Up to 100 matching published products. Prices and specifications are supplied by
            sellers.
          </p>
        </>
      ) : (
        <>
          <FeedFeedback
            loading={data.companies.loading}
            error={data.companies.error}
            retry={data.companies.reload}
            label="Businesses"
          />
          <div className="tc-company-grid">
            {companies.map((company) => (
              <CompanyCard
                key={company.uuid}
                company={company}
                association={
                  data.associations.data.find((item) => item.uuid === company.associationUuid)?.name
                }
                products={data.products.data.filter((item) => item.companyUuid === company.uuid)}
                credentials={data.credentials.data.filter(
                  (item) => item.companyUuid === company.uuid
                )}
              />
            ))}
          </div>
          {!companies.length && !data.companies.loading && !data.companies.error ? (
            <div className="tc-empty">
              <h3>No matching businesses yet.</h3>
              <p>Try another search, category or location.</p>
              <button className="tc-button" onClick={reset}>
                Clear filters
              </button>
            </div>
          ) : null}
        </>
      )}
      <p className="tc-art-credit">
        Sample listings are fictional. Sample badges are examples; real credentials show the
        reviewed evidence and validity.
      </p>
    </section>
  );
}
