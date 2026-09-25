import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, CheckCircle2Icon, EyeIcon, SaveIcon } from "lucide-react";
import { Badge } from "@codexsun/ui/components/badge";
import { Button } from "@codexsun/ui/components/button";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Switch } from "@codexsun/ui/components/switch";
import { WorkspacePageHeader, WorkspacePublishStatus, WorkspaceSectionCard } from "@codexsun/ui/blocks/workspace";
import { useState, type ReactNode } from "react";
import { ClientSitePage } from "../templates/client-site-page";
import { hydrateClientSite, type PublicClientPayload } from "./client-data";

type EditorContent = PublicClientPayload & { hasDraft: boolean; published: boolean; updatedAt: string };
type Revision = { action: "draft" | "publish" | "unpublish"; createdAt: string; id: number; slug: string };

export function ContentEditor({ request, slug }: { request: typeof fetch; slug: string }) {
  const queryClient = useQueryClient();
  const content = useQuery({ queryKey: ["sites", "content", slug], queryFn: () => readContent(request, slug) });
  const revisions = useQuery({ queryKey: ["sites", "content", slug, "revisions"], queryFn: () => readRevisions(request, slug) });
  const [draft, setDraft] = useState<EditorContent | null>(null);
  const value = draft ?? content.data;
  const save = useMutation({
    mutationFn: (next: EditorContent) => writeContent(request, slug, next),
    onSuccess: (next) => { setDraft(next); void queryClient.invalidateQueries({ queryKey: ["sites", "content", slug] }); void queryClient.invalidateQueries({ queryKey: ["sites", "public"] }); },
  });
  const publish = useMutation({
    mutationFn: () => publishContent(request, slug),
    onSuccess: (next) => { setDraft(next); void queryClient.invalidateQueries({ queryKey: ["sites", "content", slug] }); void queryClient.invalidateQueries({ queryKey: ["sites", "public"] }); },
  });
  const restore = useMutation({
    mutationFn: (revisionId: number) => restoreRevision(request, slug, revisionId),
    onSuccess: (next) => { setDraft(next); void queryClient.invalidateQueries({ queryKey: ["sites", "content", slug] }); void queryClient.invalidateQueries({ queryKey: ["sites", "content", slug, "revisions"] }); },
  });

  if (content.isPending || !value) return <main className="min-h-full p-6 text-muted-foreground">Loading client content…</main>;
  if (content.isError) return <main className="min-h-full p-6 text-destructive">Client content could not be loaded.</main>;

  const update = (changes: Partial<EditorContent>) => setDraft({ ...value, ...changes });
  const changedFields = content.data ? [
    value.name !== content.data.name ? "Client name" : null,
    value.description !== content.data.description ? "Description" : null,
    value.statement !== content.data.statement ? "Statement" : null,
    value.about !== content.data.about ? "About" : null,
    value.seo.title !== content.data.seo.title || value.seo.description !== content.data.seo.description ? "SEO metadata" : null,
    value.contact.email !== content.data.contact.email || value.contact.phone !== content.data.contact.phone || value.contact.label !== content.data.contact.label ? "Contact details" : null,
    value.footer.tagline !== content.data.footer.tagline || value.footer.copyright !== content.data.footer.copyright ? "Social and footer" : null,
  ].filter((field): field is string => Boolean(field)) : [];
  return (
    <main className="min-h-full bg-background p-4 pb-12 text-foreground sm:p-6">
      <div className="mx-auto max-w-5xl">
        <WorkspacePageHeader
          eyebrow="Content workflow"
          title={`Edit ${value.name}`}
          description={`Draft content for /clients/${slug}. Changes remain private until published.`}
          actions={<div className="flex items-center gap-2"><WorkspacePublishStatus state={value.published ? "published" : "draft"} /><Button render={<a href="/" />} variant="ghost"><ArrowLeftIcon className="size-4" /> Dashboard</Button></div>}
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <WorkspaceSectionCard title="Core content" description="The content used by the client page composition.">
            <div className="grid gap-4">
              <Field label="Client name"><Input value={value.name} onChange={(event) => update({ name: event.target.value })} /></Field>
              <Field label="Description"><Textarea value={value.description} onChange={(event) => update({ description: event.target.value })} /></Field>
              <Field label="Statement"><Textarea value={value.statement} onChange={(event) => update({ statement: event.target.value })} /></Field>
              <Field label="About"><Textarea className="min-h-32" value={value.about} onChange={(event) => update({ about: event.target.value })} /></Field>
            </div>
          </WorkspaceSectionCard>
          <div className="grid content-start gap-4">
            <WorkspaceSectionCard title="Search metadata" description="Keep titles and descriptions useful for discovery.">
              <div className="grid gap-4">
                <Field label="SEO title"><Input value={value.seo.title} onChange={(event) => update({ seo: { ...value.seo, title: event.target.value } })} /></Field>
                <Field label="SEO description"><Textarea value={value.seo.description} onChange={(event) => update({ seo: { ...value.seo, description: event.target.value } })} /></Field>
              </div>
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title="Contact details" description="Published contact information for this client.">
              <div className="grid gap-4">
                <Field label="Contact label"><Input value={value.contact.label} onChange={(event) => update({ contact: { ...value.contact, label: event.target.value } })} /></Field>
                <Field label="Email"><Input type="email" value={value.contact.email} onChange={(event) => update({ contact: { ...value.contact, email: event.target.value } })} /></Field>
                <Field label="Phone"><Input value={value.contact.phone} onChange={(event) => update({ contact: { ...value.contact, phone: event.target.value } })} /></Field>
              </div>
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title="Social and footer" description="Keep public links and legal footer copy current.">
              <div className="grid gap-4">
                <Field label="Social link label"><Input value={value.socialLinks[0]?.label ?? ""} onChange={(event) => update({ socialLinks: [{ label: event.target.value, href: value.socialLinks[0]?.href ?? "" }, ...value.socialLinks.slice(1)] })} /></Field>
                <Field label="Social link URL"><Input type="url" value={value.socialLinks[0]?.href ?? ""} onChange={(event) => update({ socialLinks: [{ label: value.socialLinks[0]?.label ?? "Website", href: event.target.value }, ...value.socialLinks.slice(1)] })} /></Field>
                <Field label="Footer tagline"><Textarea value={value.footer.tagline} onChange={(event) => update({ footer: { ...value.footer, tagline: event.target.value } })} /></Field>
                <Field label="Copyright"><Input value={value.footer.copyright} onChange={(event) => update({ footer: { ...value.footer, copyright: event.target.value } })} /></Field>
              </div>
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title="Page sections" description="Control order and visibility of reusable public sections.">
              <div className="grid gap-2">
                {[...value.sections].sort((left, right) => (left.order ?? 0) - (right.order ?? 0)).map((section, index, ordered) => <div key={`${section.type}-${index}`} className="flex items-center gap-2 rounded-lg border p-2 text-sm"><span className="flex-1 font-medium capitalize">{section.type}</span><Switch aria-label={`Show ${section.type} section`} checked={section.visible !== false} onCheckedChange={(visible) => update({ sections: ordered.map((item) => item === section ? { ...item, visible } : item) })} /><Button aria-label={`Move ${section.type} up`} disabled={index === 0} onClick={() => update({ sections: moveSection(ordered, index, index - 1) })} size="icon-sm" variant="ghost"><ArrowUpIcon /></Button><Button aria-label={`Move ${section.type} down`} disabled={index === ordered.length - 1} onClick={() => update({ sections: moveSection(ordered, index, index + 1) })} size="icon-sm" variant="ghost"><ArrowDownIcon /></Button></div>)}
              </div>
            </WorkspaceSectionCard>
            <WorkspaceSectionCard title="Revision history" description="Restore a previous content snapshot as a new draft.">
              <div className="grid gap-2">
                {(revisions.data ?? []).slice(0, 5).map((revision) => <div key={revision.id} className="flex items-center gap-2 text-xs"><Badge variant="outline">{revision.action}</Badge><span className="flex-1 text-muted-foreground">{new Date(revision.createdAt).toLocaleString()}</span><Button disabled={restore.isPending} onClick={() => restore.mutate(revision.id)} size="sm" variant="ghost">Restore</Button></div>)}
                {!revisions.data?.length ? <p className="text-sm text-muted-foreground">No revisions yet.</p> : null}
              </div>
            </WorkspaceSectionCard>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button disabled={save.isPending} onClick={() => save.mutate(value)}><SaveIcon className="size-4" /> {save.isPending ? "Saving…" : "Save draft"}</Button>
          <Button disabled={publish.isPending || !value.hasDraft} onClick={() => { if (window.confirm("Publish this draft to the public client site?")) publish.mutate(); }} variant="outline"><CheckCircle2Icon className="size-4" /> Publish draft</Button>
          <Button render={<a href={`/studio/content/${slug}/preview`} />} variant="ghost"><EyeIcon className="size-4" /> Preview draft</Button>
          {value.hasDraft ? <Badge variant="studio-warning">Unpublished changes</Badge> : null}
          {changedFields.length ? <span className="text-sm text-muted-foreground">Changed: {changedFields.join(", ")}</span> : null}
          {save.isError || publish.isError ? <><span className="text-sm text-destructive">The content action failed.</span><Button onClick={() => save.isError ? save.mutate(value) : publish.mutate()} size="sm" variant="outline">Retry</Button></> : null}
        </div>
      </div>
    </main>
  );
}

export function ContentPreview({ request, slug }: { request: typeof fetch; slug: string }) {
  const content = useQuery({ queryKey: ["sites", "content", slug, "preview"], queryFn: () => readContent(request, slug) });
  if (content.isPending) return <main className="min-h-full p-6 text-muted-foreground">Loading draft preview…</main>;
  if (content.isError || !content.data) return <main className="min-h-full p-6 text-destructive">Draft preview could not be loaded.</main>;
  return <><div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-amber-300/30 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100"><span>Draft preview — this content is not public.</span><Button render={<a href={`/studio/content/${slug}`} />} size="sm" variant="outline"><ArrowLeftIcon className="size-4" /> Back to editor</Button></div><div className="min-h-full bg-slate-950"><ClientSitePage client={hydrateClientSite(content.data)} /></div></>;
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return <label className="grid gap-2 text-sm font-medium">{label}{children}</label>;
}

async function readContent(request: typeof fetch, slug: string): Promise<EditorContent> {
  const response = await request(`/api/v1/sites/content/${slug}`);
  if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
  return response.json() as Promise<EditorContent>;
}

async function writeContent(request: typeof fetch, slug: string, value: EditorContent): Promise<EditorContent> {
  const response = await request(`/api/v1/sites/content/${slug}/draft`, { body: JSON.stringify(value), headers: { "Content-Type": "application/json" }, method: "PUT" });
  if (!response.ok) throw new Error(`Draft request failed: ${response.status}`);
  return response.json() as Promise<EditorContent>;
}

async function publishContent(request: typeof fetch, slug: string): Promise<EditorContent> {
  const response = await request(`/api/v1/sites/content/${slug}/publish`, { method: "POST" });
  if (!response.ok) throw new Error(`Publish request failed: ${response.status}`);
  return response.json() as Promise<EditorContent>;
}

async function readRevisions(request: typeof fetch, slug: string): Promise<Revision[]> {
  const response = await request(`/api/v1/sites/content/${slug}/revisions`);
  if (!response.ok) throw new Error(`Revision request failed: ${response.status}`);
  return response.json() as Promise<Revision[]>;
}

async function restoreRevision(request: typeof fetch, slug: string, revisionId: number): Promise<EditorContent> {
  const response = await request(`/api/v1/sites/content/${slug}/revisions/${revisionId}/restore`, { method: "POST" });
  if (!response.ok) throw new Error(`Restore request failed: ${response.status}`);
  return response.json() as Promise<EditorContent>;
}

function moveSection<T>(sections: T[], from: number, to: number): T[] {
  const next = [...sections];
  const [item] = next.splice(from, 1);
  if (item !== undefined) next.splice(to, 0, item);
  return next.map((section, index) => ({ ...(section as object), order: index })) as T[];
}
