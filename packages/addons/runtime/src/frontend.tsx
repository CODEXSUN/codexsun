import { useState } from "react";
import type { AddonDefinition } from "./index.js";

export interface AddonWorkspaceProps {
  readonly definition: AddonDefinition;
}

export function AddonWorkspace({ definition }: AddonWorkspaceProps) {
  const [density, setDensity] = useState<"compact" | "relaxed">("relaxed");
  const [surface, setSurface] = useState<"flush" | "panel">("flush");

  return (
    <main data-addon={definition.id} data-density={density} data-surface={surface} className="min-h-full bg-background p-6 text-foreground">
      <header className="mx-auto flex max-w-5xl flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Business add-on</p>
        <h1 className="text-3xl font-semibold tracking-tight">{definition.label}</h1>
        <p className="max-w-2xl text-muted-foreground">{definition.purpose}</p>
      </header>
      <section className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-[1fr_280px]">
        <div className="rounded-xl border border-border/70 bg-card p-5">
          <h2 className="text-sm font-semibold">Workspace foundation</h2>
          <p className="mt-2 text-sm text-muted-foreground">The backend provider, public contracts, and frontend entry point are ready for the owning application.</p>
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Capability areas">
            {definition.areas.map((area) => <span className="rounded-full bg-muted px-3 py-1 text-xs" key={area}>{area}</span>)}
          </div>
        </div>
        <aside className="rounded-xl border border-border/70 bg-card p-5" aria-label="View settings">
          <h2 className="text-sm font-semibold">View settings</h2>
          <label className="mt-4 flex items-center justify-between gap-3 text-sm">
            Density
            <select className="rounded-md border border-border bg-background px-2 py-1" value={density} onChange={(event) => setDensity(event.target.value as typeof density)}>
              <option value="relaxed">Relaxed</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="mt-3 flex items-center justify-between gap-3 text-sm">
            Surface
            <select className="rounded-md border border-border bg-background px-2 py-1" value={surface} onChange={(event) => setSurface(event.target.value as typeof surface)}>
              <option value="flush">Flush</option>
              <option value="panel">Panel</option>
            </select>
          </label>
        </aside>
      </section>
    </main>
  );
}
