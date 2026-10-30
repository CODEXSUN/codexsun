import { useState } from "react";
import { ArrowRightIcon, SearchIcon } from "lucide-react";
import { Input } from "@codexsun/ui/components/input";
import { catalogItems, categoryOrder } from "./component-catalog";
import { componentImportPath } from "./component-metadata";
import { componentPage, componentPages, type ComponentPage } from "./component-pages";
import { galleryPageUrl } from "./gallery-routes";

export function ComponentIndexPage({
  onNavigate
}: {
  onNavigate: (page: ComponentPage) => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const orderedItems = componentPages.flatMap((page) => {
    const item = catalogItems.find((entry) => entry.id === page.id);
    return item ? [item] : [];
  });
  const visibleItems = orderedItems.filter((item) =>
    [item.name, item.description, item.category, componentImportPath(item.id),
      ...item.variants.map((variant) => variant.name)]
      .some((value) => value.toLowerCase().includes(normalizedQuery))
  );
  const flavorCount = orderedItems.reduce((count, item) => count + item.variants.length, 0);

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-5 border-b pb-5">
        <div className="grid gap-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">UIUX / Components</p>
          <h1 className="text-2xl font-semibold">Component gallery</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {orderedItems.length} shared components · {flavorCount} live flavors. Open a component to compare its previews and inspect its source.
          </p>
        </div>
        <label className="relative w-full max-w-sm">
          <SearchIcon aria-hidden="true" className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search components and flavors</span>
          <Input
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search components or flavors"
            type="search"
            value={query}
          />
        </label>
      </header>
      {categoryOrder.map((category) => {
        const items = visibleItems.filter((item) => item.category === category);
        if (items.length === 0) return null;
        return (
          <section className="grid gap-3" key={category}>
            <h2 className="text-sm font-semibold">{category} <span className="font-normal text-muted-foreground">({items.length})</span></h2>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const page = componentPage(item.id as (typeof componentPages)[number]["id"]);
                return (
                  <a
                    className="group grid gap-3 rounded-lg border bg-card p-4 shadow-sm transition-colors hover:border-primary/50 hover:bg-muted/30"
                    href={galleryPageUrl(page)}
                    key={item.id}
                    onClick={(event) => {
                      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                      event.preventDefault();
                      onNavigate(page);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ArrowRightIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.variants.map((variant, index) => (
                        <span className="rounded border bg-background px-2 py-0.5 text-[11px]" key={variant.id}>
                          <span className="font-mono text-muted-foreground">V{String(index + 1).padStart(2, "0")}</span> {variant.name}
                        </span>
                      ))}
                    </div>
                    <code className="truncate border-t pt-3 text-[11px] text-muted-foreground">{componentImportPath(item.id)}</code>
                  </a>
                );
              })}
            </div>
          </section>
        );
      })}
      {visibleItems.length === 0 ? <p className="text-sm text-muted-foreground">No components match “{query}”.</p> : null}
    </div>
  );
}
