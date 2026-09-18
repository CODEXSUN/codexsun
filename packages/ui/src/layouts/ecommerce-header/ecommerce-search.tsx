import { SearchIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "../../components/button";
import { cn } from "../../lib/utils";
import type { EcommerceHeaderActions } from "./ecommerce-header-types";

type EcommerceSearchProps = {
  actions?: EcommerceHeaderActions;
  popularSearches: readonly string[];
};

export function EcommerceSearch({ actions, popularSearches }: EcommerceSearchProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  function search(value = query) {
    actions?.onSearch?.(value);
  }

  return (
    <div className="relative hidden max-w-xl flex-1 md:flex">
      <div
        className={cn(
          "flex w-full items-center rounded-xl border border-input bg-muted/30 px-3 py-1.5 transition-all",
          focused && "border-ring bg-background ring-2 ring-ring/20",
        )}
      >
        <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" />
        <input
          className="w-full bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
          placeholder="Search products, brands, categories..."
          type="search"
          value={query}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter") search();
          }}
        />
        {query ? <ClearSearch onClear={() => setQuery("")} /> : null}
        <Button className="h-7 px-3 text-xs" size="sm" onClick={() => search()}>
          Search
        </Button>
      </div>
      {focused ? (
        <SearchSuggestions
          items={popularSearches}
          onSelect={(item) => {
            setQuery(item);
            search(item);
          }}
        />
      ) : null}
    </div>
  );
}

function ClearSearch({ onClear }: { onClear: () => void }) {
  return (
    <button className="mr-1 text-muted-foreground hover:text-foreground" type="button" onClick={onClear}>
      <XIcon className="size-3.5" />
    </button>
  );
}

function SearchSuggestions({ items, onSelect }: { items: readonly string[]; onSelect: (item: string) => void }) {
  return (
    <div className="animate-in fade-in-0 zoom-in-95 absolute top-full right-0 left-0 z-50 mt-1.5 rounded-xl border border-border/80 bg-popover p-3 shadow-xl">
      <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">Popular searches</p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <button
            key={item}
            className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            type="button"
            onClick={() => onSelect(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}
