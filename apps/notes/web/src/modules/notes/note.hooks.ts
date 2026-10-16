import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createNote,
  forceDeleteNote,
  listNotes,
  restoreNote,
  suspendNote,
  updateNote
} from "./note.services";
import type { NoteSavePayload, NoteStatus } from "./note.types";

export const notesQueryKey = ["notes"] as const;

export function useNotesWorkspace(search: string, status: NoteStatus | "all") {
  const client = useQueryClient();
  const invalidate = () => client.invalidateQueries({ queryKey: notesQueryKey });
  return {
    notes: useQuery({
      queryKey: [...notesQueryKey, "list", search, status],
      queryFn: () => listNotes(search, status)
    }),
    create: useMutation({
      mutationFn: (payload: NoteSavePayload) => createNote(payload),
      onSuccess: invalidate
    }),
    update: useMutation({
      mutationFn: ({ id, payload }: { id: string; payload: NoteSavePayload }) =>
        updateNote(id, payload),
      onSuccess: invalidate
    }),
    suspend: useMutation({ mutationFn: (id: string) => suspendNote(id), onSuccess: invalidate }),
    restore: useMutation({ mutationFn: (id: string) => restoreNote(id), onSuccess: invalidate }),
    forceDelete: useMutation({
      mutationFn: (id: string) => forceDeleteNote(id),
      onSuccess: invalidate
    })
  };
}
