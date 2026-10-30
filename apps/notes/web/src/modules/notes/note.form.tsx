import { useState } from "react";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import { Textarea } from "@codexsun/ui/components/textarea";
import { noteSaveSchema } from "./note.schema";
import type { Note, NoteSavePayload } from "./note.types";

export function NoteUpsertForm({
  busy,
  note,
  onOpenChange,
  onSubmit,
  open
}: {
  busy: boolean;
  note: Note | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: NoteSavePayload) => Promise<void>;
  open: boolean;
}) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [body, setBody] = useState(note?.body ?? "");
  const [error, setError] = useState("");

  async function submit() {
    const parsed = noteSaveSchema.safeParse({ body, title });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the note fields.");
      return;
    }
    setError("");
    await onSubmit(parsed.data);
    if (!note) {
      setTitle("");
      setBody("");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-4">
          <DialogTitle>{note ? "Edit note" : "New note"}</DialogTitle>
          <DialogDescription>
            {note ? "Update the team note." : "Capture a fast team note."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 overflow-y-auto p-5">
          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <label className="grid gap-1 text-sm font-medium">
            Title <span className="text-red-600">*</span>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Note title"
              aria-label="Title"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Body <span className="text-red-600">*</span>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the note…"
              aria-label="Body"
              rows={8}
            />
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Saving…" : note ? "Save changes" : "Create note"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
