import { Button } from "@codexsun/ui/components/button";
import type { BlogRecord } from "./blog.types.js";
export function BlogList({
  records,
  busy,
  onEdit,
  onPublish,
  onRemove
}: {
  records: BlogRecord[];
  busy: boolean;
  onEdit: (post: BlogRecord) => void;
  onPublish: (post: BlogRecord, publish: boolean) => void;
  onRemove: (post: BlogRecord) => void;
}) {
  return (
    <div className="grid gap-3">
      {records.length ? (
        records.map((post) => (
          <article key={post.uuid} className="grid gap-3 rounded-md border p-4">
            <div>
              <h3 className="font-semibold">{post.content.title}</h3>
              <p className="text-xs text-muted-foreground">
                /blogs/{post.content.slug} ·{" "}
                {post.publishedRevision
                  ? `Published revision ${post.publishedRevision}`
                  : "Draft only"}{" "}
                · Current revision {post.revision}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">{post.content.summary}</p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => onEdit(post)}>
                Edit draft
              </Button>
              <Button size="sm" disabled={busy} onClick={() => onPublish(post, true)}>
                Publish
              </Button>
              {post.publishedRevision ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onPublish(post, false)}
                >
                  Unpublish
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => onRemove(post)}
                >
                  Delete
                </Button>
              )}
            </div>
          </article>
        ))
      ) : (
        <p className="text-sm text-muted-foreground">No blogs yet. Create a draft to start.</p>
      )}
    </div>
  );
}
