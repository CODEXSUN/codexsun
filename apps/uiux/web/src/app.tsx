import {
  Badge,
  Button,
  Card,
  EmptyState,
  ThemeProvider,
  uiRegistry,
  useTheme,
  type UiRegistryEntry,
  type UiRegistryLayer,
} from "@codexsun/ui";
import { useMemo, useState } from "react";

const layers: readonly ("all" | UiRegistryLayer)[] = ["all", "component", "block", "page", "template"];

export function App() {
  return (
    <ThemeProvider>
      <Gallery />
    </ThemeProvider>
  );
}

function Gallery() {
  const [layer, setLayer] = useState<(typeof layers)[number]>("all");
  const [selectedId, setSelectedId] = useState(uiRegistry[0]?.id ?? "");
  const entries = useMemo(() => uiRegistry.filter((entry) => layer === "all" || entry.layer === layer), [layer]);
  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? entries[0];
  const { theme, density, setTheme, setDensity } = useTheme();

  return (
    <main className="min-h-screen bg-canvas text-foreground">
      <header className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">CODEXSUN UIUX</p>
            <h1 className="mt-1 text-2xl font-semibold">Public design-system gallery</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Published package metadata only. No application imports this gallery.
            </p>
          </div>
          <Badge variant="info">{entries.length} items</Badge>
        </div>
      </header>
      <section className="mx-auto flex max-w-7xl flex-col gap-6 p-6 pb-36">
        <nav className="flex flex-wrap gap-2" aria-label="Registry layers">
          {layers.map((item) => (
            <Button
              key={item}
              variant={layer === item ? "default" : "outline"}
              size="sm"
              aria-pressed={layer === item}
              onClick={() => setLayer(item)}
            >
              {item}
            </Button>
          ))}
        </nav>
        {selectedEntry ? (
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <RegistryList entries={entries} selectedId={selectedEntry.id} onSelect={setSelectedId} />
            <RegistryDetail entry={selectedEntry} />
          </div>
        ) : (
          <EmptyState title="No published UI items" description="Choose another registry layer to inspect its published metadata." />
        )}
      </section>
      <aside className="fixed right-4 bottom-4 w-72 rounded-lg border border-border bg-surface p-4 shadow-2xl">
        <h2 className="text-sm font-semibold">Tweak preview</h2>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button size="sm" variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")}>
            Dark
          </Button>
          <Button size="sm" variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")}>
            Light
          </Button>
          <Button
            size="sm"
            variant={density === "compact" ? "default" : "outline"}
            onClick={() => setDensity("compact")}
          >
            Compact
          </Button>
          <Button
            size="sm"
            variant={density === "relaxed" ? "default" : "outline"}
            onClick={() => setDensity("relaxed")}
          >
            Relaxed
          </Button>
        </div>
      </aside>
    </main>
  );
}

interface RegistryListProps {
  readonly entries: readonly UiRegistryEntry[];
  readonly selectedId: string;
  readonly onSelect: (id: string) => void;
}

function RegistryList({ entries, selectedId, onSelect }: RegistryListProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {entries.map((entry) => {
        const selected = entry.id === selectedId;
        return (
          <Button
            key={entry.id}
            variant="outline"
            className={`h-auto min-h-36 justify-start whitespace-normal p-4 text-left ${
              selected ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "bg-surface hover:bg-surface-raised"
            }`}
            aria-pressed={selected}
            onClick={() => onSelect(entry.id)}
          >
            <span className="block w-full">
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block text-base font-semibold">{entry.name}</span>
                  <span className="mt-1 block break-all text-sm text-muted-foreground">{entry.id}</span>
                </span>
                <Badge variant={selected ? "info" : "neutral"}>{entry.layer}</Badge>
              </span>
              <span className="mt-5 block text-sm text-muted-foreground">Default: {entry.defaultVariant}</span>
              <span className="mt-2 block text-sm text-muted-foreground">{entry.variants.length} supported variants</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}

interface RegistryDetailProps {
  readonly entry: UiRegistryEntry;
}

function RegistryDetail({ entry }: RegistryDetailProps) {
  return (
    <aside aria-labelledby="registry-detail-title" className="xl:sticky xl:top-6">
      <Card variant="surface" className="p-5 xl:max-h-[calc(100vh-21rem)] xl:overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Published item</p>
            <h2 id="registry-detail-title" className="mt-1 text-xl font-semibold">
              {entry.name}
            </h2>
          </div>
          <Badge variant={entry.status === "active" ? "success" : "warning"}>{entry.status}</Badge>
        </div>
        <p className="mt-3 break-all text-sm text-muted-foreground">{entry.id}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {entry.category} · Default: {entry.defaultVariant}
        </p>
        <MetadataGroup title="Variants" values={entry.variants} />
        <MetadataGroup title="States" values={entry.states} />
        <MetadataGroup title="Sizes" values={entry.sizes} emptyLabel="No separate size options" />
        <MetadataGroup title="Required props" values={entry.requiredProps} emptyLabel="No required props" />
        <section className="mt-6">
          <h3 className="text-sm font-semibold">Accessibility</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
            {entry.accessibility.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
        <section className="mt-6 border-t border-border pt-5">
          <h3 className="text-sm font-semibold">Example data</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{entry.exampleData}</p>
        </section>
      </Card>
    </aside>
  );
}

interface MetadataGroupProps {
  readonly title: string;
  readonly values: readonly string[];
  readonly emptyLabel?: string;
}

function MetadataGroup({ title, values, emptyLabel = "None" }: MetadataGroupProps) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <Badge key={value}>{value}</Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>
      )}
    </section>
  );
}
