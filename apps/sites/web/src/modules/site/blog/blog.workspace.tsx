import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Card } from "@codexsun/ui/components/card";
import { WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { useBlogEditor } from "./blog.hooks.js";
import { BlogForm } from "./blog.form.js";
import { BlogList } from "./blog.list.js";
import type { BlogGateway, BlogRecord } from "./blog.types.js";
export function BlogWorkspace({
  uuid,
  gateway
}: {
  uuid: string;
  gateway: BlogGateway | undefined;
}) {
  const editor = useBlogEditor(uuid, gateway);
  const [selected, setSelected] = useState<BlogRecord | null | undefined>(undefined);
  return (
    <Card className="grid gap-5 p-5">
      <div className="flex justify-between gap-3">
        <h2 className="font-semibold">Ramu Tex blogs</h2>
        <Button disabled={editor.busy || selected !== undefined} onClick={() => setSelected(null)}>
          New blog
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Draft changes stay private. Publish adds a post to the website. Unpublish removes its public
        version.
      </p>
      {editor.error ? (
        <WorkspaceFormBanner title="Blog request failed">
          {editor.error}
          <Button variant="outline" onClick={() => void editor.load()}>
            Retry
          </Button>
        </WorkspaceFormBanner>
      ) : null}
      {editor.message ? (
        <p role="status" className="text-sm">
          {editor.message}
        </p>
      ) : null}
      {selected !== undefined ? (
        <BlogForm
          key={selected?.uuid ?? "new"}
          post={selected}
          onSave={editor.save}
          onCancel={() => setSelected(undefined)}
        />
      ) : editor.busy ? (
        <p>Loading blogs…</p>
      ) : (
        <BlogList
          records={editor.records}
          busy={editor.busy}
          onEdit={setSelected}
          onPublish={(post, publish) => void editor.publication(post, publish)}
          onRemove={(post) => void editor.remove(post)}
        />
      )}
    </Card>
  );
}
