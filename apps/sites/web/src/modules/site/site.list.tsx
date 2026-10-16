import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { ChevronRightIcon, Globe2Icon, PlusIcon, SearchIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { CmsSite } from "./site.types.js";

export function SiteList({
  onCreate,
  onSelect,
  selectedUuid,
  sites
}: {
  onCreate: () => void;
  onSelect: (uuid: string) => void;
  selectedUuid: string;
  sites: CmsSite[];
}) {
  const [search, setSearch] = useState("");
  const visibleSites = useMemo(
    () =>
      sites.filter(
        (site) =>
          site.name.toLowerCase().includes(search.toLowerCase()) ||
          site.slug.toLowerCase().includes(search.toLowerCase()) ||
          site.primaryDomain.toLowerCase().includes(search.toLowerCase())
      ),
    [search, sites]
  );

  return (
    <aside className="rounded-md border bg-card p-5 shadow-sm">
      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-3 size-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search client portfolios"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <Button className="mb-5 w-full" icon={<PlusIcon />} onClick={onCreate}>
        New client portfolio
      </Button>
      <nav className="space-y-1">
        {visibleSites.map((site) => (
          <button
            className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left transition-colors ${
              site.uuid === selectedUuid ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
            }`}
            key={site.uuid}
            onClick={() => onSelect(site.uuid)}
          >
            <span
              className={`size-2.5 rounded-full ${
                site.status === "active" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                <span className="truncate">{site.name}</span>
                {site.port ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    :{site.port}
                  </span>
                ) : null}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {site.primaryDomain}
              </span>
            </span>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
        {!visibleSites.length ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            No portfolios found matching &ldquo;{search}&rdquo;.
          </div>
        ) : null}
      </nav>
      <div className="mt-6 rounded-md border bg-muted/35 p-4 text-xs text-muted-foreground">
        <div className="mb-2 flex items-center gap-2 font-semibold text-foreground">
          <Globe2Icon className="size-4" /> Multi-Client Portfolio CMS
        </div>
        <div>Wix / Shopify style portfolio management</div>
        <div className="mt-1 font-mono text-[11px] text-foreground">
          {sites.length} portfolio workspaces registered
        </div>
      </div>
    </aside>
  );
}
