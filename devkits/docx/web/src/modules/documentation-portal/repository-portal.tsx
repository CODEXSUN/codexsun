import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DocumentationWorkspace } from "@codexsun/ui";
import { Button } from "@codexsun/ui/components/button";
import { MarkdownContent } from "@codexsun/ui/components/markdown-content";
import type { MdiNavigationSection } from "@codexsun/ui/layouts/main-workspace";
import { Check, ChevronDown, Code, Copy, Download, Eye, FileText, Folder } from "lucide-react";
import { createDocumentCatalog, resolveDocumentLink, type RepositoryDocument } from "./repository-catalog";

function selectedPath(documents: readonly RepositoryDocument[]) {
  return new URLSearchParams(window.location.search).get("doc") ?? documents[0]?.path ?? "";
}

export function RepositoryDocumentationPortal({ logout, request }: { logout: () => void; request: typeof fetch }) {
  const documents = useQuery({ queryKey: ["docx", "documents"], queryFn: () => readDocuments(request), refetchInterval: 15_000 });
  const repositoryDocuments = useMemo(() => createDocumentCatalog(Object.fromEntries((documents.data ?? []).map((item) => [item.path, item.content]))), [documents.data]);
  const [path, setPath] = useState("");
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<"preview" | "source">("preview");
  const [copied, setCopied] = useState(false);
  const document = repositoryDocuments.find((item) => item.path === path);
  const visible = useMemo(() => repositoryDocuments.filter((item) =>
    `${item.path} ${item.title} ${item.content}`.toLowerCase().includes(query.trim().toLowerCase())), [query, repositoryDocuments]);

  useEffect(() => {
    const update = () => setPath(selectedPath(repositoryDocuments));
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, [repositoryDocuments]);

  useEffect(() => {
    if (!path && repositoryDocuments[0]) setPath(selectedPath(repositoryDocuments));
  }, [path, repositoryDocuments]);

  function select(next: string) {
    const url = new URL(window.location.href);
    url.searchParams.set("doc", next);
    url.hash = "";
    window.history.pushState({}, "", url);
    setPath(next);
    setCopied(false);
  }

  const navigation: MdiNavigationSection[] = ["Applications", "Devkits", "Platform", "Packages", "Assist", "Repository"].map((group) => ({
    label: group,
    defaultOpen: true,
    items: [...new Set(visible.filter((item) => item.group === group).map((item) => item.owner))].map((owner) => ({
      label: owner.split("/").at(-1)!.toUpperCase(),
      icon: Folder,
      badge: visible.filter((item) => item.owner === owner).length,
      defaultOpen: Boolean(query) || document?.owner === owner,
      children: visible.filter((item) => item.owner === owner).map((item) => ({
        label: `${item.title} (${item.path.startsWith(`${owner}/`) ? item.path.slice(owner.length + 1) : item.path})`,
        icon: FileText,
        active: item.path === path,
        onSelect: () => select(item.path),
      })),
    })),
  })).filter((section) => section.items.length);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch { setCopied(false); }
  }

  function download() {
    if (!document) return;
    const url = URL.createObjectURL(new Blob([document.content], { type: "text/markdown;charset=utf-8" }));
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = document.path.split("/").at(-1)!;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <DocumentationWorkspace applicationId="docx" applicationName="DOCX" navigation={navigation}
    sidebarContent={<RepositorySidebar documents={visible} activePath={path} onSelect={select} />}
    workspaceTitle="Repository documentation" user={{ initials: "D", name: "DOCX user", onSignOut: logout }}
    searchValue={query} onSearchChange={setQuery} searchPlaceholder="Search documentation"
    statusLabel={documents.isPending ? "Scanning repository" : `${visible.length} / ${repositoryDocuments.length} documents`}>
    <section className="flex h-full min-h-0 min-w-0 flex-col bg-background">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{document?.group} / {document?.owner.split("/").at(-1)?.toUpperCase()}</p>
          <h1 className="mt-1 break-words text-lg font-semibold">{document?.title ?? "Document not found"}</h1>
          <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{path}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex border" role="group" aria-label="Document view">
            <Button size="icon-sm" variant={mode === "preview" ? "secondary" : "ghost"} aria-label="Preview" title="Preview" aria-pressed={mode === "preview"} onClick={() => setMode("preview")}><Eye /></Button>
            <Button size="icon-sm" variant={mode === "source" ? "secondary" : "ghost"} aria-label="Markdown source" title="Markdown source" aria-pressed={mode === "source"} onClick={() => setMode("source")}><Code /></Button>
          </div>
          <Button size="icon-sm" variant="ghost" aria-label="Copy document link" title={copied ? "Copied" : "Copy document link"} onClick={() => void copyLink()}>{copied ? <Check /> : <Copy />}</Button>
          <Button size="icon-sm" variant="ghost" aria-label="Download Markdown" title="Download Markdown" disabled={!document} onClick={download}><Download /></Button>
        </div>
      </header>
      {documents.isError && <p role="alert" className="border-b p-4 text-sm text-destructive">Could not scan repository documentation.</p>}
      {query && !visible.length && <p role="status" className="border-b p-4 text-sm text-muted-foreground">No documents match "{query}".</p>}
      <div key={`${path}:${mode}`} className="min-h-0 flex-1 overflow-auto p-4 sm:p-8">
        {!document ? <p className="text-sm text-muted-foreground">This document is not in the repository library.</p>
          : mode === "source" ? <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-6">{document.content}</pre>
          : <article className="mx-auto max-w-5xl" onClick={(event) => {
            const anchor = (event.target as HTMLElement).closest("a");
            const href = anchor?.getAttribute("href");
            if (!href || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const next = resolveDocumentLink(path, href);
            if (next && repositoryDocuments.some((item) => item.path === next)) { event.preventDefault(); select(next); }
          }}><MarkdownContent content={document.content} /></article>}
      </div>
    </section>
  </DocumentationWorkspace>;
}

function RepositorySidebar({ activePath, documents, onSelect }: { activePath: string; documents: readonly RepositoryDocument[]; onSelect: (path: string) => void }) {
  const active = documents.find((item) => item.path === activePath);
  const [openOwners, setOpenOwners] = useState<Set<string>>(() => new Set(active ? [active.owner] : []));

  useEffect(() => {
    if (!active || openOwners.has(active.owner)) return;
    setOpenOwners((current) => new Set([...current, active.owner]));
  }, [active, openOwners]);

  const groups = ["Applications", "Devkits", "Platform", "Packages", "Assist", "Repository"];
  return <nav aria-label="Repository documentation" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
    {groups.map((group) => {
      const owners = [...new Set(documents.filter((item) => item.group === group).map((item) => item.owner))];
      if (!owners.length) return null;
      return <section key={group} className="space-y-1">
        <p className="px-2 pt-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{group}</p>
        {owners.map((owner) => {
          const items = documents.filter((item) => item.owner === owner);
          const open = openOwners.has(owner);
          return <div key={owner} className="border-l border-sidebar-border">
            <button type="button" className="flex h-8 w-full items-center gap-2 px-2 text-left text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setOpenOwners((current) => {
              const next = new Set(current);
              if (next.has(owner)) next.delete(owner); else next.add(owner);
              return next;
            })}>
              <ChevronDown className={`size-3.5 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} />
              <Folder className="size-3.5 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{owner.split("/").at(-1)?.toUpperCase()}</span>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </button>
            {open && <div className="mb-1 ml-3 border-l border-sidebar-border py-1">
              {items.map((item) => <button type="button" key={item.path} title={item.path} onClick={() => onSelect(item.path)} className={`flex min-h-7 w-full items-center gap-2 px-2 py-1 text-left text-xs hover:bg-sidebar-accent ${item.path === activePath ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground"}`}>
                <FileText className="size-3 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{item.title}</span>
              </button>)}
            </div>}
          </div>;
        })}
      </section>;
    })}
  </nav>;
}

async function readDocuments(request: typeof fetch): Promise<{ content: string; path: string }[]> {
  const response = await request("/api/v1/docx/documents");
  if (!response.ok) throw new Error("Could not scan repository documentation.");
  const body = await response.json() as { items?: unknown };
  if (!Array.isArray(body.items) || !body.items.every((item): item is { content: string; path: string } => typeof item === "object" && item !== null && typeof item.content === "string" && typeof item.path === "string")) throw new Error("Invalid document library response.");
  return body.items;
}
