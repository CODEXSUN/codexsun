import { DocumentationWorkspace } from "@codexsun/ui";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@codexsun/ui/components/card";
import { RichTextEditor } from "@codexsun/ui/components/rich-text-editor";
import type { MdiNavigationSection } from "@codexsun/ui/layouts/main-workspace";
import {
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  FilePenLine,
  FileText,
  Lightbulb,
  ListTree,
  Package,
  Share2,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  architectureStandards,
  developmentStages,
  portalDocuments,
  type PortalDocument,
} from "./documentation-content.js";

type IdeaPage = "architecture" | "plan" | "shared";
type PortalView = "document" | "editor" | IdeaPage;

const ideaLabels: Record<IdeaPage, string> = {
  architecture: "Architecture standards",
  plan: "Development plan",
  shared: "Shared packages and apps",
};

export function DocxDocumentationPortal({ logout }: { logout: () => void }) {
  const [activeDocumentId, setActiveDocumentId] = useState(portalDocuments[0].id);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [view, setView] = useState<PortalView>("document");
  const activeDocument = portalDocuments.find((document) => document.id === activeDocumentId) ?? portalDocuments[0];
  const visibleDocuments = useMemo(
    () =>
      portalDocuments.filter((document) =>
        `${document.title} ${document.path}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  return (
    <DocumentationWorkspace
      applicationId="docx"
      applicationName="DOCX"
      navigation={createNavigation({ activeDocumentId, setActiveDocumentId, setView, view, visibleDocuments })}
      onSearchChange={setQuery}
      searchPlaceholder="Search titles and paths"
      searchValue={query}
      statusLabel="Documentation ready"
      user={{ initials: "D", name: "DOCX user", onSignOut: logout }}
      workspaceTitle="Documentation portal"
    >
      {view === "editor" ? (
        <PortalEditor
          document={activeDocument}
          initialContent={drafts[activeDocument.id] ?? toHtml(activeDocument)}
          onBack={() => setView("document")}
          onDraftChange={(html) => setDrafts((current) => ({ ...current, [activeDocument.id]: html }))}
        />
      ) : view === "document" ? (
        <DocumentReader document={activeDocument} onEdit={() => setView("editor")} />
      ) : (
        <IdeasPage page={view} />
      )}
    </DocumentationWorkspace>
  );
}

function createNavigation({
  activeDocumentId,
  setActiveDocumentId,
  setView,
  view,
  visibleDocuments,
}: {
  activeDocumentId: string;
  setActiveDocumentId: (id: string) => void;
  setView: (view: PortalView) => void;
  view: PortalView;
  visibleDocuments: PortalDocument[];
}): MdiNavigationSection[] {
  return [
    {
      items: [{ active: view === "document", icon: BookOpen, label: "Overview", onSelect: () => setView("document") }],
    },
    {
      defaultOpen: view !== "document" && view !== "editor",
      icon: Lightbulb,
      label: "Ideas",
      items: (Object.keys(ideaLabels) as IdeaPage[]).map((page) => ({
        active: view === page,
        icon: Lightbulb,
        label: ideaLabels[page],
        onSelect: () => setView(page),
      })),
    },
    {
      defaultOpen: true,
      icon: FileText,
      label: "Assists",
      items: visibleDocuments.map((document) => ({
        active: view === "document" && activeDocumentId === document.id,
        icon: FileText,
        label: document.title,
        onSelect: () => {
          setActiveDocumentId(document.id);
          setView("document");
        },
      })),
    },
    {
      icon: Package,
      label: "Packages",
      items: [
        { icon: Sparkles, label: "Rich-text editor", onSelect: () => setView("editor") },
        { icon: FileText, label: "Documentation workspace", onSelect: () => setView("document") },
      ],
    },
  ];
}

function DocumentReader({ document, onEdit }: { document: PortalDocument; onEdit: () => void }) {
  const [action, setAction] = useState<"copied" | "idle" | "shared">("idle");
  const headings = ["Overview", ...document.body.map((_, index) => `Principle ${index + 1}`)];

  async function copy(value: string, nextAction: "copied" | "shared") {
    await navigator.clipboard?.writeText(value);
    setAction(nextAction);
    window.setTimeout(() => setAction("idle"), 1_800);
  }

  async function share() {
    const shareData = { title: document.title, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setAction("shared");
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copy(shareData.url, "shared");
  }

  return (
    <section className="flex size-full min-h-0 flex-col bg-background">
      <header className="flex h-12 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur lg:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <FileText className="size-3.5 shrink-0 text-muted-foreground" />
          <p className="truncate text-sm font-semibold">{document.title}</p>
        </div>
        <div className="flex min-w-0 items-center gap-1">
          <code className="hidden max-w-[min(42vw,42rem)] truncate rounded-md bg-muted px-2 py-1 text-sm sm:block">
            {document.path}
          </code>
          <Button aria-label="Edit document" size="icon-sm" title="Edit document" variant="ghost" onClick={onEdit}>
            <FilePenLine />
          </Button>
          <Button
            aria-label="Share document link"
            size="icon-sm"
            title="Share document link"
            variant="ghost"
            onClick={() => void share()}
          >
            {action === "shared" ? <Check /> : <Share2 />}
          </Button>
          <Button
            aria-label="Copy file path"
            size="icon-sm"
            title="Copy file path"
            variant="ghost"
            onClick={() => void copy(document.path, "copied")}
          >
            {action === "copied" ? <Check /> : <Copy />}
          </Button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="grid min-h-full gap-10 px-6 py-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:px-10 xl:px-14">
          <article className="min-w-0 max-w-4xl">
            <Badge variant="secondary">DOCX portal</Badge>
            <h1 className="mt-5 text-3xl font-bold tracking-tight">{document.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{document.summary}</p>
            {document.body.map((paragraph, index) => (
              <section className="mt-10" id={`principle-${index + 1}`} key={paragraph}>
                <h2 className="text-xl font-semibold">{headings[index + 1]}</h2>
                <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">{paragraph}</p>
              </section>
            ))}
            <div className="mt-12 border-t pt-7">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <ChevronRight className="size-4" /> Continue writing
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Open this document in the rich-text editor to continue the DOCX authoring workflow.
              </p>
              <Button className="mt-4" size="sm" variant="secondary" onClick={onEdit}>
                <FilePenLine /> Open in editor
              </Button>
            </div>
          </article>
          <aside className="hidden border-l pl-6 lg:block" aria-label="Document helper">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-foreground uppercase">
              <ListTree className="size-3.5" /> Document helper
            </p>
            <p className="mt-3 text-sm text-muted-foreground">On this page</p>
            <nav className="mt-3 flex flex-col gap-1">
              {headings.map((heading, index) => (
                <Button
                  className={index ? "justify-start" : "justify-start font-semibold"}
                  key={heading}
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    index &&
                    window.document.getElementById(`principle-${index}`)?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {heading}
                </Button>
              ))}
            </nav>
            <div className="mt-6 border-t pt-5">
              <p className="text-sm font-medium">Source</p>
              <p className="mt-1 break-all text-xs text-muted-foreground">{document.path}</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

function PortalEditor({
  document,
  initialContent,
  onBack,
  onDraftChange,
}: {
  document: PortalDocument;
  initialContent: string;
  onBack: () => void;
  onDraftChange: (html: string) => void;
}) {
  const [title, setTitle] = useState(document.title);
  return (
    <section className="flex size-full min-h-0 flex-col bg-background">
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b px-4 lg:px-6">
        <Button size="sm" variant="ghost" onClick={onBack}>
          <ChevronRight className="rotate-180" /> Back to document
        </Button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">Edit documentation</p>
        <span className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="size-4 text-emerald-500" /> Draft saved
        </span>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex w-4/5 max-w-[120rem] flex-col gap-6 py-8">
          <div>
            <label className="text-sm font-medium" htmlFor="docx-document-title">
              Title
            </label>
            <input
              className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="docx-document-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <p className="mt-2 text-sm text-muted-foreground">{document.path}</p>
          </div>
          <div>
            <h2 className="text-sm font-medium">Rich text editor</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Write, review Markdown and HTML, or preview the document without leaving DOCX.
            </p>
          </div>
          <RichTextEditor
            autoSave
            content={initialContent}
            fullPreview
            onChange={onDraftChange}
            placeholder="Write documentation..."
          />
        </div>
      </div>
    </section>
  );
}

function IdeasPage({ page }: { page: IdeaPage }) {
  const content =
    page === "plan" ? <DevelopmentPlan /> : page === "architecture" ? <ArchitectureIdeas /> : <SharedOwnershipIdeas />;
  return (
    <section className="min-h-full overflow-y-auto">
      <header className="flex h-12 items-center border-b px-4 text-sm font-semibold lg:px-6">
        <Lightbulb className="mr-2 size-4 text-muted-foreground" /> Ideas / {ideaLabels[page]}
      </header>
      {content}
    </section>
  );
}

function DevelopmentPlan() {
  return (
    <IdeasLayout
      badge="Ideas"
      title="What we are developing"
      summary="DOCX brings documentation reading and authoring into one application workspace. The plan keeps the portal useful without duplicating shared UI behavior."
    >
      <h2 className="text-xl font-semibold">Development flow</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {developmentStages.map(([number, title, detail]) => (
          <Card key={number}>
            <CardHeader>
              <Badge variant="outline">{number}</Badge>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{detail}</CardContent>
          </Card>
        ))}
      </div>
    </IdeasLayout>
  );
}

function ArchitectureIdeas() {
  return (
    <IdeasLayout
      badge="Architecture idea"
      title="Global architecture standards"
      summary="A documentation portal stays maintainable when product routes, document state, and writing workflows have one owner and clear shared-package boundaries."
    >
      <h2 className="text-xl font-semibold">Team standards</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {architectureStandards.map(([title, detail]) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm leading-6 text-muted-foreground">{detail}</CardContent>
          </Card>
        ))}
      </div>
    </IdeasLayout>
  );
}

function SharedOwnershipIdeas() {
  return (
    <IdeasLayout
      badge="Architecture idea"
      title="Shared packages and application ownership"
      summary="DOCX composes the public Documentation Workspace and rich-text editor while keeping its documents, navigation, and authoring workflow application-owned."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Shared UI owns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>Theme tokens, controls, MDI workspace layout, and the rich-text editor.</p>
            <p>These are consumed through public @codexsun/ui exports.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>DOCX owns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm leading-6 text-muted-foreground">
            <p>Portal routes, source paths, document data, Ideas content, and authoring decisions.</p>
            <p>Application-specific behavior remains inside the DOCX web module.</p>
          </CardContent>
        </Card>
      </div>
    </IdeasLayout>
  );
}

function IdeasLayout({
  badge,
  children,
  summary,
  title,
}: {
  badge: string;
  children: ReactNode;
  summary: string;
  title: string;
}) {
  return (
    <div className="mx-auto w-4/5 max-w-[120rem] px-6 py-10 lg:px-10">
      <div className="max-w-4xl">
        <Badge variant="secondary">{badge}</Badge>
        <h1 className="mt-5 text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">{summary}</p>
      </div>
      <div className="mt-10">{children}</div>
    </div>
  );
}

function toHtml(document: PortalDocument): string {
  return [
    `<h1>${document.title}</h1>`,
    `<p>${document.summary}</p>`,
    ...document.body.map((paragraph) => `<p>${paragraph}</p>`),
  ].join("");
}
