import { GitBranchIcon } from "lucide-react";
import type { AddonCatalogItem, AddonCatalogSnapshot } from "./projex-types";
import { RegistryPage, RegistryRow } from "./projex-list";

export function Addons({ catalog, surface }: { catalog: AddonCatalogSnapshot; surface: "card" | "flush" }) {
  return <RegistryPage count={catalog.summary.addonCount} description="Connected capabilities available to the workspace, with ownership, provider wiring, and lifecycle state." onAdd={() => undefined} surface={surface} title="Add-ons">
    {catalog.addons.map((addon) => <AddonRow addon={addon} key={addon.id} />)}
  </RegistryPage>;
}

function AddonRow({ addon }: { addon: AddonCatalogItem }) {
  return <RegistryRow id={addon.id} progress={addon.enabled ? 100 : 0}>
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="font-semibold">{addon.label}</h2><span className="text-xs text-muted-foreground">{addon.enabled ? "enabled" : "registered"}</span></div>
    <p className="mt-1 text-sm text-muted-foreground">{addon.purpose}</p>
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1.5"><GitBranchIcon aria-hidden="true" className="size-3.5" />{addon.id}</span><span>{addon.providerId}</span><span>{addon.dependencies.length} dependencies</span></div>
  </RegistryRow>;
}
