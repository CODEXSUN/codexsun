import { useState } from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
  Code2Icon,
  CopyIcon
} from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { Toaster as SonnerToaster } from "@codexsun/ui/components/sonner";
import { Toaster } from "@codexsun/ui/components/toaster";
import {
  setDesignSystemComponentDefault,
  useDesignSystemComponentDefault
} from "@codexsun/ui/design-system";
import { catalogItems, type CatalogItem, type CatalogVariant } from "./component-catalog";
import { componentPage, componentPages, type ComponentPageId } from "./component-pages";
import { componentImportPath } from "./component-metadata";
import { galleryPageUrl } from "./gallery-routes";

const componentSources = {
  ...import.meta.glob<string>("../../../../packages/ui/src/components/*.tsx", {
    import: "default",
    query: "?raw"
  }),
  ...import.meta.glob<string>("../../../../packages/ui/src/components/*.ts", {
    import: "default",
    query: "?raw"
  })
};

export function ComponentPage({
  componentId,
  componentCatalogHref,
  onNavigate
}: {
  componentId: ComponentPageId;
  componentCatalogHref?: string;
  onNavigate: (page: ReturnType<typeof componentPage>) => void;
}) {
  const item = catalogItems.find((entry) => entry.id === componentId);
  const selectedDefault = useDesignSystemComponentDefault(
    componentId,
    item?.defaultVariantId ?? "default"
  );
  const index = componentPages.findIndex((entry) => entry.id === componentId);
  const previous = componentPages[(index - 1 + componentPages.length) % componentPages.length];
  const next = componentPages[(index + 1) % componentPages.length];
  if (!item || !previous || !next) return null;

  return (
    <div className="grid gap-8">
      <ComponentHeader item={item} />
      {componentId === "toaster" || componentId === "use-toast" ? <Toaster /> : null}
      {componentId === "sonner" ? <SonnerToaster /> : null}
      <section
        aria-label={`${item.name} live variants`}
        className="overflow-hidden rounded-md border bg-background shadow-sm"
      >
        <div className="flex h-9 items-center gap-1 border-b px-4">
          <span className="size-2 rounded-full bg-rose-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {item.name}
          </span>
        </div>
        <div className="divide-y">
          {item.variants.map((variant, variantIndex) => (
            <VariantPreview
              item={item}
              key={`${item.id}-${variant.id}`}
              index={variantIndex}
              selectedDefault={selectedDefault}
              variant={variant}
            />
          ))}
        </div>
      </section>
      <section className="grid gap-3 border-t pt-6">
        <h2 className="text-lg font-semibold">{item.name} usage</h2>
        <p className="text-sm text-muted-foreground">
          V01, V02, and later labels identify gallery previews. The flavor ID stays stable for saved preferences.
          Use the import path above for the shared component. Each code button shows a flavor example when available, or the component implementation.
        </p>
        <nav aria-label="Component pages" className="grid gap-3 sm:grid-cols-2">
          <PageLink
            direction="previous"
            id={previous.id}
            name={previous.name}
            onNavigate={onNavigate}
          />
          <PageLink direction="next" id={next.id} name={next.name} onNavigate={onNavigate} />
        </nav>
        {componentCatalogHref ? (
          <a className="w-fit text-sm text-primary hover:underline" href={componentCatalogHref}>
            Open the existing component catalog
          </a>
        ) : null}
      </section>
    </div>
  );
}
function ComponentHeader({ item }: { item: CatalogItem }) {
  const [copied, setCopied] = useState(false);
  const importPath = componentImportPath(item.id);

  async function copyPath() {
    await navigator.clipboard.writeText(importPath);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="rounded-full bg-muted px-3 py-1 text-xs">Component</span>
        <ChevronRightIcon className="size-4 text-muted-foreground" />
        <h1 className="font-semibold">{item.name}</h1>
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{item.category}</span>
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <code className="max-w-[70vw] truncate rounded-md bg-muted px-3 py-2 text-xs">
          {importPath}
        </code>
        <Button
          aria-label="Copy import path"
          onClick={() => void copyPath()}
          size="icon"
          type="button"
          variant="ghost"
        >
          {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
        </Button>
      </div>
      <p className="w-full text-sm text-muted-foreground">{item.description} · {item.variants.length} live {item.variants.length === 1 ? "flavor" : "flavors"}</p>
    </header>
  );
}

function VariantPreview({
  item,
  index,
  selectedDefault,
  variant
}: {
  item: CatalogItem;
  index: number;
  selectedDefault: string;
  variant: CatalogVariant;
}) {
  const [showCode, setShowCode] = useState(false);
  const [source, setSource] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isDefault = selectedDefault === variant.id;
  const changesComponentDefault = item.id === "button";
  const importPath = componentImportPath(item.id);

  async function copySource() {
    await navigator.clipboard.writeText(variant.exampleCode ?? await readSource());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function readSource() {
    if (source !== null) return source;
    const file = importPath.slice(importPath.lastIndexOf("/") + 1);
    const loader =
      componentSources[`../../../../packages/ui/src/components/${file}.tsx`] ??
      componentSources[`../../../../packages/ui/src/components/${file}.ts`];
    const text = loader ? await loader() : "Source file unavailable.";
    setSource(text);
    return text;
  }

  async function toggleCode() {
    setShowCode((value) => !value);
    if (!variant.exampleCode && source === null) await readSource();
  }

  return (
    <article>
      <header className="flex min-h-12 flex-wrap items-center gap-2 border-b px-4 py-2 text-sm">
        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
          V{String(index + 1).padStart(2, "0")}
        </span>
        <span className="font-semibold">{variant.name}</span>
        <code className="text-xs text-muted-foreground">{item.id}/{variant.id}</code>
        {isDefault ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
            {changesComponentDefault ? "Default" : "Preferred preview"}
          </span>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          {!isDefault ? (
            <Button
              onClick={() => setDesignSystemComponentDefault(item.id, variant.id)}
              size="sm"
              type="button"
              variant="ghost"
            >
              {changesComponentDefault ? "Set default" : "Prefer preview"}
            </Button>
          ) : null}
          <Button
            aria-label={`Copy ${variant.name} ${variant.exampleCode ? "usage example" : "component source"}`}
            onClick={() => void copySource()}
            size="icon"
            type="button"
            variant="ghost"
          >
            {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
          </Button>
          <Button
            aria-label={`${showCode ? "Hide" : "Show"} ${variant.name} ${variant.exampleCode ? "usage example" : "component source"}`}
            aria-expanded={showCode}
            onClick={() => void toggleCode()}
            size="icon"
            type="button"
            variant="ghost"
          >
            <Code2Icon className="size-4" />
          </Button>
        </div>
      </header>
      {variant.description ? <p className="px-4 pt-3 text-xs text-muted-foreground">{variant.description}</p> : null}
      <div className="grid min-h-52 place-items-center px-6 py-12">
        <div className="w-full max-w-[34rem]">{variant.preview}</div>
      </div>
      {showCode ? (
        <div className="border-t bg-muted/20 px-5 py-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {variant.exampleCode ? "Flavor usage example" : "Shared component source"} · {importPath}
          </p>
          <pre className="max-h-[28rem] overflow-auto text-xs leading-6">
            <code>{variant.exampleCode ?? source ?? "Loading source…"}</code>
          </pre>
        </div>
      ) : null}
    </article>
  );
}

function PageLink({
  direction,
  id,
  name,
  onNavigate
}: {
  direction: "previous" | "next";
  id: ComponentPageId;
  name: string;
  onNavigate: (page: ReturnType<typeof componentPage>) => void;
}) {
  const page = componentPage(id);
  return (
    <a
      className={`flex items-center gap-3 rounded-md border bg-card px-4 py-4 text-sm shadow-sm hover:border-primary/40 hover:bg-muted/30 ${direction === "next" ? "justify-end text-right" : ""}`}
      href={galleryPageUrl(page)}
      onClick={(event) => {
        if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        onNavigate(page);
      }}
    >
      {direction === "previous" ? <ArrowLeftIcon className="size-4 shrink-0" /> : null}
      <span>
        <span className="block text-xs uppercase text-muted-foreground">{direction}</span>
        <span className="font-medium">{name}</span>
      </span>
      {direction === "next" ? <ArrowRightIcon className="size-4 shrink-0" /> : null}
    </a>
  );
}
