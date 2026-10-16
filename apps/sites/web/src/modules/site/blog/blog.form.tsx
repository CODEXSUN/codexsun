import { blogContentSchema } from "@codexsun/sites-api/blog-contract";
import { useState } from "react";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { Button } from "@codexsun/ui/components/button";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { validateBlog } from "./blog.schema.js";
import type { BlogContent, BlogRecord } from "./blog.types.js";
export function BlogForm({
  post,
  onSave,
  onCancel
}: {
  post: BlogRecord | null;
  onSave: (uuid: string | null, content: BlogContent, revision: number) => Promise<BlogRecord>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<BlogContent>(
    post?.content ?? { title: "", slug: "", summary: "", body: "" }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const validation = blogContentSchema.safeParse(draft);
  const fieldError = (key: keyof BlogContent) =>
    error && !validation.success
      ? validation.error.issues.find((issue) => issue.path[0] === key)?.message
      : undefined;
  async function save() {
    const invalid = validateBlog(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(post?.uuid ?? null, draft, post?.revision ?? 0);
      onCancel();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Blog could not be saved.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <fieldset disabled={busy} className="grid gap-4 rounded-md border p-5">
      <legend className="px-2 font-semibold">{post ? "Edit blog draft" : "New blog post"}</legend>
      {error ? (
        <WorkspaceFormBanner title="Blog could not be saved">
          <pre className="whitespace-pre-wrap font-sans text-sm">{error}</pre>
        </WorkspaceFormBanner>
      ) : null}
      <label className="grid gap-2 text-sm">
        Title *
        <Input
          aria-invalid={Boolean(fieldError("title"))}
          className={fieldError("title") ? "border-destructive" : ""}
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
        {fieldError("title") ? (
          <span className="text-xs text-destructive">{fieldError("title")}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm">
        URL slug *
        <Input
          aria-invalid={Boolean(fieldError("slug"))}
          className={fieldError("slug") ? "border-destructive" : ""}
          value={draft.slug}
          placeholder="fabric-processing-insights"
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
        />
        {fieldError("slug") ? (
          <span className="text-xs text-destructive">{fieldError("slug")}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm">
        Summary *
        <Textarea
          aria-invalid={Boolean(fieldError("summary"))}
          className={fieldError("summary") ? "border-destructive" : ""}
          value={draft.summary}
          onChange={(e) => setDraft({ ...draft, summary: e.target.value })}
        />
        {fieldError("summary") ? (
          <span className="text-xs text-destructive">{fieldError("summary")}</span>
        ) : null}
      </label>
      <label className="grid gap-2 text-sm">
        Body (plain text, paragraphs separated by blank lines) *
        <Textarea
          rows={12}
          aria-invalid={Boolean(fieldError("body"))}
          className={fieldError("body") ? "border-destructive" : ""}
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
        {fieldError("body") ? (
          <span className="text-xs text-destructive">{fieldError("body")}</span>
        ) : null}
      </label>
      <div className="flex gap-2">
        <Button onClick={() => void save()}>Save draft</Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </fieldset>
  );
}
