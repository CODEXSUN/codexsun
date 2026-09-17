import {
  Badge,
  Button,
  Card,
  ContentSection,
  MdiMain,
  SettingsPage,
  ThemeProvider,
  uiRegistry,
  useTheme,
  type UiRegistryEntry,
  type UiRegistryState,
} from "@codexsun/ui";
import { useEffect, useState } from "react";
import { galleryLayers, getGalleryEntries, getPreviewState, getSelectedEntry, type GalleryLayer } from "./gallery-model.js";
import { RegistryPreview, type PreviewSurface } from "./registry-preview.js";

export function App() {
  return (
    <ThemeProvider>
      <GalleryWorkspace />
    </ThemeProvider>
  );
}

function GalleryWorkspace() {
  const [layer, setLayer] = useState<GalleryLayer>("all");
  const [selectedId, setSelectedId] = useState(uiRegistry[0]?.id ?? "");
  const [requestedState, setRequestedState] = useState<UiRegistryState>("default");
  const [surface, setSurface] = useState<PreviewSurface>("surface");
  const { density, setDensity, setTheme, theme } = useTheme();
  const entries = getGalleryEntries(uiRegistry, layer);
  const selectedEntry = getSelectedEntry(entries, selectedId);

  useEffect(() => {
    if (selectedEntry) setSelectedId(selectedEntry.id);
  }, [selectedEntry]);

  const previewState = selectedEntry ? getPreviewState(selectedEntry, requestedState) : "default";

  return (
    <>
      <MdiMain
        menu={["Registry"]}
        status={`${entries.length} published`}
        title="CODEXSUN UIUX"
        rail={
          <GalleryRail
            entries={entries}
            layer={layer}
            selectedId={selectedEntry?.id ?? ""}
            onLayerChange={setLayer}
            onSelect={setSelectedId}
          />
        }
      >
        {selectedEntry ? (
          <SettingsPage
            description="Live previews use only published @codexsun/ui exports. Controls below are local to this browser session."
            title="Design-system gallery"
          >
            <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
              <ContentSection description={`${selectedEntry.id} · ${selectedEntry.category}`} title={`${selectedEntry.name} preview`}>
                <RegistryPreview entry={selectedEntry} state={previewState} surface={surface} />
              </ContentSection>
              <RegistryDetail entry={selectedEntry} />
            </div>
          </SettingsPage>
        ) : (
          <Card variant="surface">No published UI entries match this layer.</Card>
        )}
      </MdiMain>
      <TweakPanel
        density={density}
        previewState={previewState}
        selectedEntry={selectedEntry}
        surface={surface}
        theme={theme}
        onDensityChange={setDensity}
        onStateChange={setRequestedState}
        onSurfaceChange={setSurface}
        onThemeChange={setTheme}
      />
    </>
  );
}

interface GalleryRailProps {
  readonly entries: readonly UiRegistryEntry[];
  readonly layer: GalleryLayer;
  readonly selectedId: string;
  readonly onLayerChange: (layer: GalleryLayer) => void;
  readonly onSelect: (id: string) => void;
}

function GalleryRail({ entries, layer, selectedId, onLayerChange, onSelect }: GalleryRailProps) {
  return (
    <div className="flex min-h-0 flex-col gap-5">
      <div>
        <p className="text-sm font-semibold">Published registry</p>
        <p className="mt-1 text-sm text-muted-foreground">Filter then inspect a live public export.</p>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="Registry layers">
        {galleryLayers.map((item) => (
          <Button key={item} size="sm" variant={layer === item ? "default" : "outline"} aria-pressed={layer === item} onClick={() => onLayerChange(item)}>
            {item}
          </Button>
        ))}
      </nav>
      <div className="flex max-h-[calc(100vh-19rem)] flex-col gap-2 overflow-y-auto pr-1">
        {entries.map((entry) => {
          const selected = entry.id === selectedId;
          return (
            <Button key={entry.id} className="h-auto justify-start whitespace-normal px-3 py-3 text-left" size="sm" variant={selected ? "secondary" : "ghost"} aria-pressed={selected} onClick={() => onSelect(entry.id)}>
              <span className="min-w-0">
                <span className="block truncate font-semibold">{entry.name}</span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">{entry.id}</span>
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function RegistryDetail({ entry }: { readonly entry: UiRegistryEntry }) {
  return (
    <aside aria-labelledby="registry-detail-title" className="xl:sticky xl:top-6">
      <Card className="xl:max-h-[calc(100vh-12rem)] xl:overflow-y-auto" variant="surface">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Published item</p>
            <h2 id="registry-detail-title" className="mt-1 text-xl font-semibold">{entry.name}</h2>
          </div>
          <Badge variant={entry.status === "active" ? "success" : "warning"}>{entry.status}</Badge>
        </div>
        <p className="mt-3 break-all text-sm text-muted-foreground">{entry.id}</p>
        <p className="mt-2 text-sm text-muted-foreground">Default: {entry.defaultVariant}</p>
        <MetadataGroup title="Variants" values={entry.variants} />
        <MetadataGroup title="States" values={entry.states} />
        <MetadataGroup emptyLabel="No separate size options" title="Sizes" values={entry.sizes} />
        <MetadataGroup emptyLabel="No required props" title="Required props" values={entry.requiredProps} />
        <section className="mt-6">
          <h3 className="text-sm font-semibold">Accessibility</h3>
          <ul className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
            {entry.accessibility.map((note) => <li key={note}>{note}</li>)}
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

function MetadataGroup({ title, values, emptyLabel = "None" }: { readonly title: string; readonly values: readonly string[]; readonly emptyLabel?: string }) {
  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold">{title}</h3>
      {values.length ? <div className="mt-3 flex flex-wrap gap-2">{values.map((value) => <Badge key={value}>{value}</Badge>)}</div> : <p className="mt-2 text-sm text-muted-foreground">{emptyLabel}</p>}
    </section>
  );
}

interface TweakPanelProps {
  readonly density: "compact" | "default" | "relaxed";
  readonly previewState: UiRegistryState;
  readonly selectedEntry: UiRegistryEntry | undefined;
  readonly surface: PreviewSurface;
  readonly theme: "dark" | "light";
  readonly onDensityChange: (density: "compact" | "default" | "relaxed") => void;
  readonly onStateChange: (state: UiRegistryState) => void;
  readonly onSurfaceChange: (surface: PreviewSurface) => void;
  readonly onThemeChange: (theme: "dark" | "light") => void;
}

function TweakPanel({ density, previewState, selectedEntry, surface, theme, onDensityChange, onStateChange, onSurfaceChange, onThemeChange }: TweakPanelProps) {
  const states = selectedEntry?.states ?? [];
  return (
    <Card className="fixed right-4 bottom-4 z-40 w-72 shadow-xl" variant="surface">
      <p className="text-sm font-semibold">Tweak preview</p>
      <p className="mt-1 text-sm text-muted-foreground">Temporary preview settings only.</p>
      <TweakGroup label="Theme" values={["dark", "light"]} value={theme} onChange={onThemeChange} />
      <TweakGroup label="Density" values={["compact", "default", "relaxed"]} value={density} onChange={onDensityChange} />
      <TweakGroup label="Surface" values={["surface", "outlined", "flush"]} value={surface} onChange={onSurfaceChange} />
      {states.length ? <TweakGroup label="State" values={states} value={previewState} onChange={onStateChange} /> : null}
    </Card>
  );
}

function TweakGroup<T extends string>({ label, values, value, onChange }: { readonly label: string; readonly values: readonly T[]; readonly value: T; readonly onChange: (value: T) => void }) {
  return (
    <section className="mt-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</h2>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {values.map((item) => <Button key={item} size="xs" variant={value === item ? "secondary" : "outline"} onClick={() => onChange(item)}>{item}</Button>)}
      </div>
    </section>
  );
}
