import { Button } from "@codexsun/ui/components/button";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import {
  ExternalLinkIcon,
  Globe2Icon,
  Layers3Icon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  TerminalIcon,
  Trash2Icon
} from "lucide-react";
import { useState } from "react";
import { emptySitePayload, SiteForm } from "./site.form.js";
import type { SitesController } from "./site.hooks.js";
import { SiteList } from "./site.list.js";
import type { CmsSite, SitePayload } from "./site.types.js";

export function SiteWorkspace({ sites }: { sites: SitesController }) {
  const [showForm, setShowForm] = useState(false);
  const [editingSite, setEditingSite] = useState<CmsSite | null>(null);
  const [draft, setDraft] = useState<SitePayload>(emptySitePayload);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; tone: "error" | "success" } | null>(null);

  function startCreate() {
    setEditingSite(null);
    setDraft(emptySitePayload);
    setShowForm(true);
    setFeedback(null);
  }

  function startEdit(site: CmsSite) {
    setEditingSite(site);
    setDraft({
      description: site.description,
      name: site.name,
      port: site.port,
      primaryDomain: site.primaryDomain,
      slug: site.slug,
      themeKey: site.themeKey
    });
    setShowForm(true);
    setFeedback(null);
  }

  async function handleSave() {
    setSaving(true);
    setFeedback(null);
    try {
      if (editingSite) {
        await sites.update(editingSite.uuid, draft);
        setFeedback({ message: `Portfolio site "${draft.name}" updated successfully.`, tone: "success" });
      } else {
        await sites.create(draft);
        setFeedback({ message: `Portfolio site "${draft.name}" created with default workspace.`, tone: "success" });
      }
      setShowForm(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save portfolio site.";
      setFeedback({ message: msg, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus() {
    if (!sites.selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await sites.toggleStatus(sites.selected);
      setFeedback({
        message: updated.status === "active" ? "Portfolio restored to active status." : "Portfolio suspended safely.",
        tone: "success"
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update status.";
      setFeedback({ message: msg, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!sites.selected) return;
    setSaving(true);
    setFeedback(null);
    try {
      await sites.remove(sites.selected.uuid);
      setFeedback({ message: "Portfolio site deleted.", tone: "success" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete site.";
      setFeedback({ message: msg, tone: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {showForm ? (
        <SiteForm
          draft={draft}
          isEdit={Boolean(editingSite)}
          onCancel={() => setShowForm(false)}
          onChange={setDraft}
          onSave={() => void handleSave()}
          saving={saving}
        />
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[320px_1fr]">
        <SiteList
          onCreate={startCreate}
          onSelect={sites.select}
          selectedUuid={sites.selectedUuid}
          sites={sites.records}
        />

        <section className="min-w-0 space-y-4">
          {feedback ? (
            <div
              className={`rounded-md border p-3 text-sm ${
                feedback.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "border-rose-500/30 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              }`}
            >
              {feedback.message}
            </div>
          ) : null}

          {!sites.selected ? (
            <div className="grid min-h-[320px] place-items-center rounded-md border border-dashed bg-card p-8 text-center shadow-sm">
              <div className="max-w-md space-y-3">
                <span className="mx-auto grid size-12 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Globe2Icon className="size-6" />
                </span>
                <h3 className="text-lg font-semibold text-foreground">No portfolio site selected</h3>
                <p className="text-sm text-muted-foreground">
                  Select a client portfolio from the list to manage its publishing settings, dev port, and content, or
                  create a new managed client site.
                </p>
                <Button icon={<PlusIcon />} onClick={startCreate}>
                  Create client portfolio
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="overflow-hidden rounded-md border bg-card p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                        {sites.selected.slug}
                      </span>
                      <StatusBadge tone={sites.selected.status === "active" ? "green" : "amber"}>
                        {sites.selected.status}
                      </StatusBadge>
                      {sites.selected.port ? (
                        <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-foreground">
                          Port {sites.selected.port}
                        </span>
                      ) : null}
                    </div>
                    <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">
                      {sites.selected.name}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Primary domain: <span className="font-mono text-foreground">{sites.selected.primaryDomain}</span>
                      {sites.selected.description ? ` · ${sites.selected.description}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      icon={<PencilIcon />}
                      onClick={() => sites.selected && startEdit(sites.selected)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      disabled={saving}
                      icon={<PowerIcon />}
                      onClick={() => void handleToggleStatus()}
                    >
                      {sites.selected.status === "suspended" ? "Restore" : "Suspend"}
                    </Button>
                    {sites.selected.status === "suspended" ? (
                      <Button
                        variant="destructive"
                        disabled={saving}
                        icon={<Trash2Icon />}
                        onClick={() => void handleDelete()}
                      >
                        Delete
                      </Button>
                    ) : null}
                    {sites.selected.port ? (
                      <Button
                        asChild
                        variant="default"
                        icon={<ExternalLinkIcon />}
                      >
                        <a
                          href={`http://127.0.0.1:${sites.selected.port}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Live Port ({sites.selected.port})
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-md border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Layers3Icon className="size-4" /> Theme Preset
                  </div>
                  <div className="mt-2 font-mono text-base font-semibold text-foreground">
                    {sites.selected.themeKey}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Design tokens & client stylesheet
                  </div>
                </div>

                <div className="rounded-md border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Globe2Icon className="size-4" /> Published Pages
                  </div>
                  <div className="mt-2 text-base font-semibold text-foreground">
                    {sites.selected.publishedPages} active {sites.selected.publishedPages === 1 ? "page" : "pages"}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Home, Insights, Work, Case Studies
                  </div>
                </div>

                <div className="rounded-md border bg-card p-4 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <TerminalIcon className="size-4" /> Dev Command
                  </div>
                  <div className="mt-2 font-mono text-xs font-semibold text-foreground">
                    npm run dev:sites:{sites.selected.slug}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Spawns isolated client server
                  </div>
                </div>
              </div>

              <div className="rounded-md border bg-card p-5 shadow-sm">
                <h3 className="text-base font-semibold text-foreground">Client Portfolio Architecture</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Each client portfolio in Sites Studio owns its public layout, stylesheets, and assets located in
                  <code className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                    apps/sites/clients/src/clients/{sites.selected.slug}
                  </code>
                  . Development runs on dedicated port {sites.selected.port || "custom"}.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                    React 19 & Tailwind CSS v4
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                    Framer Motion Interactions
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                    CODEXSUN Design Primitives
                  </span>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs text-foreground">
                    Isolated Port {sites.selected.port}
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
