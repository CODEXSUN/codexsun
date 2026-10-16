export type NoteStatus = "active" | "inactive";

export type Note = {
  body: string;
  createdAt: string;
  id: number;
  status: NoteStatus;
  title: string;
  updatedAt: string;
  uuid: string;
};

export type NoteSavePayload = {
  body: string;
  title: string;
};

export type NoteListFilters = {
  search?: string;
  status?: NoteStatus | "all";
};
