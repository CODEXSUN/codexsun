import { Badge, Button, Card, ThemeProvider, uiRegistry, useTheme, type UiRegistryLayer } from "@codexsun/ui";
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
  const entries = useMemo(() => uiRegistry.filter((entry) => layer === "all" || entry.layer === layer), [layer]);
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
      <section className="mx-auto flex max-w-6xl flex-col gap-6 p-6">
        <nav className="flex flex-wrap gap-2" aria-label="Registry layers">
          {layers.map((item) => (
            <Button
              key={item}
              variant={layer === item ? "default" : "outline"}
              size="sm"
              onClick={() => setLayer(item)}
            >
              {item}
            </Button>
          ))}
        </nav>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((entry) => (
            <Card key={entry.id} variant="surface">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{entry.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entry.id}</p>
                </div>
                <Badge>{entry.layer}</Badge>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">Default: {entry.defaultVariant}</p>
              <p className="mt-2 text-sm text-muted-foreground">Variants: {entry.variants.join(", ")}</p>
            </Card>
          ))}
        </div>
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
