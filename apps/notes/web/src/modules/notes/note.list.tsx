import { formatDateTime } from "@codexsun/ui/workspace";
import { Archive, ArchiveRestore, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@codexsun/ui/components/button";
import { StatusBadge } from "@codexsun/ui/components/StatusBadge";
import { cn } from "@codexsun/ui/lib/utils";
import type { Note } from "./note.types";

export function NotesList({
  loading,
  notes,
  onEdit,
  onRestore,
  onSelect,
  onDelete,
  onSuspend,
  onView,
  selectedId
}: {
  loading: boolean;
  notes: Note[];
  onEdit: (note: Note) => void;
  onRestore: (note: Note) => void;
  onSelect: (note: Note) => void;
  onDelete: (note: Note) => void;
  onSuspend: (note: Note) => void;
  onView: (note: Note) => void;
  selectedId: string | null;
}) {
  if (loading)
    return (
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div className="h-24 animate-pulse rounded-lg bg-muted" key={index} />
        ))}
      </div>
    );
  if (!notes.length)
    return (
      <div className="flex h-64 items-center justify-center px-8 text-center text-sm text-muted-foreground">
        No notes yet. Create the first team note.
      </div>
    );
  return (
    <div className="space-y-2.5 p-3">
      {notes.map((note) => (
        <button
          key={note.uuid}
          type="button"
          onClick={() => onSelect(note)}
          className={cn(
            "w-full cursor-pointer rounded-lg border bg-card p-3 text-left transition hover:border-primary/35 hover:bg-muted/25",
            selectedId === note.uuid && "border-primary/45 bg-primary/[0.04] shadow-sm"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-semibold text-foreground">{note.title}</p>
                <time className="shrink-0 text-[11px] text-muted-foreground">
                  {formatDateTime(note.updatedAt)}
                </time>
              </div>
              <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                {note.body || "No note preview"}
              </p>
              <div
                className="mt-2 flex items-center gap-1"
                onClick={(event) => event.stopPropagation()}
              >
                <StatusBadge tone={note.status === "active" ? "green" : "amber"}>
                  {note.status === "active" ? "Active" : "Inactive"}
                </StatusBadge>
                <span className="ml-auto flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    title="View note"
                    onClick={() => onView(note)}
                  >
                    <Eye className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Edit note"
                    onClick={() => onEdit(note)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  {note.status === "active" ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Suspend note"
                      onClick={() => onSuspend(note)}
                    >
                      <Archive className="size-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      title="Restore note"
                      onClick={() => onRestore(note)}
                    >
                      <ArchiveRestore className="size-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    title="Delete note"
                    onClick={() => onDelete(note)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </span>
              </div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
