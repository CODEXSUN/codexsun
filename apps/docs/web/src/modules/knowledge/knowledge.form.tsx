import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import { Textarea } from "@codexsun/ui/components/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@codexsun/ui/components/dialog";
import { WorkspaceFormField, WorkspaceFormBanner } from "@codexsun/ui/workspace/upsert";
import { knowledgeSchema } from "./knowledge.schema";
import type { KnowledgePage, KnowledgeInput } from "./knowledge.types";
export function KnowledgeForm({
  page,
  busy,
  error,
  onSave,
  onCancel
}: {
  page: KnowledgePage;
  busy: boolean;
  error: string;
  onSave: (input: KnowledgeInput) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(() =>
    page.body
      .replace(/<Callout[^>]*>([\s\S]*?)<\/Callout>/g, "> $1")
      .replace(/<Workflow[^>]*\/>/g, "")
  );
  const [invalid, setInvalid] = useState("");
  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onCancel()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Edit tenant documentation</DialogTitle>
          <DialogDescription>
            Save a Markdown override for this tenant. Repository MDX stays in Git; database text
            does not execute JSX or JavaScript.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = knowledgeSchema.safeParse({ body, expectedRevision: page.revision });
            if (!parsed.success) {
              setInvalid(parsed.error.issues[0]?.message ?? "Check the body");
              return;
            }
            setInvalid("");
            onSave(parsed.data);
          }}
        >
          {(invalid || error) && (
            <WorkspaceFormBanner title="Documentation could not be saved">
              {invalid || error}
            </WorkspaceFormBanner>
          )}
          <WorkspaceFormField label="Markdown body" required>
            <Textarea
              aria-label="Markdown body"
              aria-invalid={!!invalid}
              value={body}
              disabled={busy}
              onChange={(e) => setBody(e.target.value)}
              className="min-h-[45vh] font-mono text-xs"
            />
          </WorkspaceFormField>
          <div className="flex justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={busy || !page.hasOverride}
              onClick={() => onSave({ body: null, expectedRevision: page.revision })}
            >
              Restore repository content
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
                Cancel
              </Button>
              <Button disabled={busy}>{busy ? "Saving…" : "Save Markdown override"}</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
