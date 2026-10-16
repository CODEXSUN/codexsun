import { useState } from "react";
import { NotebookPen, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@codexsun/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@codexsun/ui/components/dialog";
import { Input } from "@codexsun/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@codexsun/ui/components/select";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { formatDateTime } from "@codexsun/ui/workspace";
import { NoteUpsertForm } from "./note.form";
import { NotesList } from "./note.list";
import { useNotesWorkspace } from "./note.hooks";
import type { Note, NoteSavePayload, NoteStatus } from "./note.types";

export function NotesWorkspace() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<NoteStatus | "all">("all");
  const [selected, setSelected] = useState<Note | null>(null);
  const [viewing, setViewing] = useState<Note | null>(null);
  const [editing, setEditing] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Note | null>(null);
  const notes = useNotesWorkspace(search, status);
  const records = notes.notes.data ?? [];

  async function save(payload: NoteSavePayload) {
    try {
      if (editing) {
        const updated = await notes.update.mutateAsync({ id: editing.uuid, payload });
        setSelected(updated);
        setEditing(null);
        toast.success("Note updated");
      } else {
        await notes.create.mutateAsync(payload);
        setCreating(false);
        toast.success("Note created");
      }
    } catch (error) {
      toast.error(errorMessage(error));
      throw error;
    }
  }

  async function suspend(note: Note) {
    try {
      const updated = await notes.suspend.mutateAsync(note.uuid);
      setSelected(updated);
      toast.success("Note suspended");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function restore(note: Note) {
    try {
      const updated = await notes.restore.mutateAsync(note.uuid);
      setSelected(updated);
      toast.success("Note restored");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function forceDelete(note: Note) {
    try {
      await notes.forceDelete.mutateAsync(note.uuid);
      setDeleting(null);
      setSelected((current) => (current?.uuid === note.uuid ? null : current));
      toast.success("Note deleted");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <div className="relative grid min-h-[calc(100vh-7.5rem)] overflow-hidden rounded-xl border bg-background shadow-sm lg:grid-cols-[minmax(20rem,28rem)_minmax(0,1fr)]">
      <section className="min-w-0 border-r">
        <div className="flex h-14 items-center gap-2 border-b px-3">
          <h2 className="text-lg font-semibold">Notes</h2>
          <div className="ml-auto flex items-center gap-1">
            <Button size="sm" type="button" onClick={() => setCreating(true)}>
              <Plus className="size-4" />
              New note
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="h-8"
          />
          <Select value={status} onValueChange={(value) => setStatus(value as NoteStatus | "all")}>
            <SelectTrigger aria-label="Note status" className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <NotesList
          loading={notes.notes.isPending}
          notes={records}
          onSelect={setSelected}
          selectedId={selected?.uuid ?? null}
          onView={setViewing}
          onEdit={setEditing}
          onSuspend={(note) => void suspend(note)}
          onRestore={(note) => void restore(note)}
          onDelete={setDeleting}
        />
      </section>
      <section className="hidden min-w-0 p-6 lg:block">
        {selected ? (
          <article className="mx-auto max-w-2xl">
            <div className="flex items-center gap-2">
              <StatusBadge tone={selected.status === "active" ? "green" : "amber"}>
                {selected.status === "active" ? "Active" : "Inactive"}
              </StatusBadge>
              <time className="text-xs text-muted-foreground">
                Updated {formatDateTime(selected.updatedAt)}
              </time>
            </div>
            <h3 className="mt-3 text-xl font-semibold tracking-tight">{selected.title}</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">
              {selected.body}
            </p>
          </article>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
            <NotebookPen className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">Select a note to read it here.</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Search, filter by status, create, edit, suspend, restore, or permanently delete team
              notes.
            </p>
          </div>
        )}
      </section>

      <NoteUpsertForm
        key={editing?.uuid ?? "new"}
        busy={notes.create.isPending || notes.update.isPending}
        note={editing}
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSubmit={save}
      />

      <Dialog open={viewing !== null} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
            <DialogDescription>
              {viewing ? `Updated ${formatDateTime(viewing.updatedAt)}` : ""}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-wrap text-sm leading-6">{viewing?.body}</p>
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete note permanently?</DialogTitle>
            <DialogDescription>
              “{deleting?.title}” will be removed and cannot be restored.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => deleting && void forceDelete(deleting)}
            >
              Delete permanently
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Notes request failed.";
}
