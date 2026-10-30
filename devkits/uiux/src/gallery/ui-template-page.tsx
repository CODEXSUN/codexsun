import { useState, type ReactNode } from "react";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, CopyIcon } from "lucide-react";

type NavigationItem = { href: string; name: string };

type UiTemplatePageProps = {
  code: string;
  codeCopyLabel?: string;
  importPath: string;
  kind: "Block" | "Layout" | "Component" | "Page" | "Static Page" | "Template";
  name: string;
  navigation?: { next?: NavigationItem; previous?: NavigationItem };
  preview: ReactNode;
  previewClassName?: string;
  showCode?: boolean;
  topology?: unknown;
  topologyIds?: { page: string; preview: string; usage: string };
  usageDescription: ReactNode;
  usageTitle?: string;
};

function galleryHref(href: string) {
  const target = new URL(href, window.location.origin);
  const block = target.searchParams.get("block");
  const layout = target.searchParams.get("layout");
  return block ? `/uiux/blocks/${block}` : layout ? `/uiux/layouts/${layout}` : href;
}

/** Common presentation for the imported live examples. */
export function UiTemplatePage({
  code,
  codeCopyLabel = "Copy code",
  importPath,
  kind,
  name,
  navigation,
  preview,
  previewClassName,
  showCode = true,
  usageDescription,
  usageTitle
}: UiTemplatePageProps) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded-full bg-muted px-3 py-1 text-xs">{kind}</span>
          <span className="text-muted-foreground">›</span>
          <h1 className="font-semibold">{name}</h1>
        </div>
        <code className="max-w-full truncate rounded-md bg-muted px-3 py-2 text-xs">{importPath}</code>
      </header>
      <section aria-label={`${name} live preview`} className="overflow-hidden rounded-md border bg-background shadow-sm">
        <div className="flex h-9 items-center gap-1 border-b px-4">
          <span className="size-2 rounded-full bg-rose-400" />
          <span className="size-2 rounded-full bg-amber-400" />
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{name}</span>
        </div>
        <div className={`min-w-0 overflow-auto p-6 ${previewClassName ?? ""}`}>{preview}</div>
      </section>
      <section className="grid gap-4 border-t pt-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{usageTitle ?? `${name} usage`}</h2>
          <div className="max-w-3xl text-sm leading-6 text-muted-foreground">{usageDescription}</div>
        </div>
        {showCode ? (
          <div className="overflow-hidden rounded-md border bg-muted/20">
            <div className="flex justify-end border-b p-2">
              <button className="inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs hover:bg-muted" onClick={copyCode} type="button">
                {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
                {copied ? "Copied" : codeCopyLabel}
              </button>
            </div>
            <pre className="overflow-auto p-4 text-xs"><code>{code}</code></pre>
          </div>
        ) : null}
        {navigation ? (
          <nav aria-label="Block pages" className="grid gap-3 sm:grid-cols-2">
            {navigation.previous ? <a className="flex items-center gap-3 rounded-md border bg-card p-4 hover:bg-muted" href={galleryHref(navigation.previous.href)}><ArrowLeftIcon className="size-4" /> Previous: {navigation.previous.name}</a> : <span />}
            {navigation.next ? <a className="flex items-center justify-end gap-3 rounded-md border bg-card p-4 hover:bg-muted" href={galleryHref(navigation.next.href)}>Next: {navigation.next.name} <ArrowRightIcon className="size-4" /></a> : null}
          </nav>
        ) : null}
      </section>
    </div>
  );
}
