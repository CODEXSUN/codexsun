import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDownIcon, SearchIcon, TagIcon, XIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@codexsun/ui/components/dropdown-menu";
import { listStorefrontProducts } from "./storefront.services";
import type {
  StorefrontDiscovery,
  StorefrontFilters,
  StorefrontProduct,
  StorefrontSearchScope
} from "./storefront.types";
import type { StorefrontBranding } from "./storefront.types";

const scopes: Array<{
  label: string;
  value: StorefrontSearchScope;
}> = [
  { label: "Everything", value: "all" },
  { label: "Products", value: "products" },
  { label: "Brands", value: "brands" },
  { label: "Categories", value: "categories" }
];

export function StorefrontSearch({
  branding,
  discovery,
  filters
}: {
  branding: StorefrontBranding | null;
  discovery: StorefrontDiscovery;
  filters: StorefrontFilters;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(filters.search);
  const [scope, setScope] = useState(filters.scope);
  const [results, setResults] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      listStorefrontProducts({ ...filters, search: query.trim(), scope })
        .then((items) => setResults(items.slice(0, 8)))
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [filters, open, query, scope]);

  const suggestions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return [
      ...discovery.categories.map((item) => ({ kind: "Category", ...item })),
      ...discovery.brands.map((item) => ({ kind: "Brand", ...item }))
    ]
      .filter((item) => item.name.toLowerCase().includes(normalized))
      .slice(0, 5);
  }, [discovery, query]);

  const submit = () => {
    const value = query.trim();
    if (!value) return;
    window.location.assign(
      `/search?q=${encodeURIComponent(value)}&scope=${encodeURIComponent(scope)}`
    );
  };

  return (
    <>
      <div className="cx-store-search__bar">
        <ScopeMenu scope={scope} onScope={setScope} />
        <button className="cx-store-search__open" onClick={() => setOpen(true)} type="button">
          <span>{query || "Find the right product for you"}</span>
          <kbd>Ctrl K</kbd>
        </button>
      </div>
      {open ? (
        <div
          aria-label="Catalog search"
          aria-modal="true"
          className="cx-store-search"
          role="dialog"
        >
          <div className="cx-store-search__top">
            <a
              className="cx-store-search__wordmark"
              href="/shop"
              aria-label={`${branding?.brandName || "Company"} home`}
            >
              <img alt="" aria-hidden="true" src={branding?.logoUrl ?? "/icons/logo.svg"} />
              {branding?.brandName ? <span>{branding.brandName}</span> : null}
            </a>
            <button aria-label="Close search" onClick={() => setOpen(false)} type="button">
              <XIcon />
            </button>
          </div>
          <div className="cx-store-search__shell">
            <div className="cx-store-search__input-row">
              <SearchIcon aria-hidden="true" />
              <input
                aria-label="Search the full catalog"
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submit()}
                placeholder="What can we help you find?"
                ref={inputRef}
                value={query}
              />
              <ScopeMenu scope={scope} onScope={setScope} />
            </div>
            <div aria-live="polite" className="cx-store-search__results">
              {!query.trim() ? (
                <SearchStart discovery={discovery} setQuery={setQuery} />
              ) : loading ? (
                <p className="cx-store-search__status">Searching the full catalog…</p>
              ) : (
                <>
                  {suggestions.length ? (
                    <section>
                      <h2>Matches</h2>
                      <div className="cx-store-search__suggestions">
                        {suggestions.map((item) => (
                          <button
                            key={`${item.kind}-${item.name}`}
                            onClick={() => setQuery(item.name)}
                          >
                            <TagIcon /> <span>{item.name}</span> <small>{item.kind}</small>
                          </button>
                        ))}
                      </div>
                    </section>
                  ) : null}
                  <section>
                    <h2>Products</h2>
                    {results.length ? (
                      <div className="cx-store-search__products">
                        {results.map((product) => (
                          <a href={`/shop/product/${product.slug}`} key={product.slug}>
                            <img alt="" src={product.imageUrl} />
                            <span>
                              <strong>{product.name}</strong>
                              <small>{product.brand || product.category}</small>
                            </span>
                            <span className="cx-store-search__arrow">↗</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="cx-store-search__status">
                        No catalog matches. Try a product, brand, category, or SKU.
                      </p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ScopeMenu({
  scope,
  onScope
}: {
  scope: StorefrontSearchScope;
  onScope: (scope: StorefrontSearchScope) => void;
}) {
  const active = scopes.find((item) => item.value === scope) ?? scopes[0]!;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cx-store-search__scope">
        <span>{active.label}</span> <ChevronDownIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="cx-store-search__scope-menu" sideOffset={10}>
        {scopes.map((item) => (
          <DropdownMenuItem key={item.value} onSelect={() => onScope(item.value)}>
            <span>{item.label}</span>
            {scope === item.value ? <span className="cx-store-search__selected" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SearchStart({
  discovery,
  setQuery
}: {
  discovery: StorefrontDiscovery;
  setQuery: (query: string) => void;
}) {
  return (
    <section>
      <span className="cx-store-search__eyebrow">Made for your next choice</span>
      <h1>Find exactly what fits your world.</h1>
      <p>Explore products, trusted brands, and precise specifications in one effortless search.</p>
      <div className="cx-store-search__chips">
        {[...discovery.categories.slice(0, 6), ...discovery.brands.slice(0, 4)].map((item) => (
          <button key={item.name} onClick={() => setQuery(item.name)}>
            {item.name}
          </button>
        ))}
      </div>
    </section>
  );
}
