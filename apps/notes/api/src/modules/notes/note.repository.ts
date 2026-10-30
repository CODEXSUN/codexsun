import { randomBytes } from "node:crypto";
import { AppError } from "@codexsun/framework/errors";
import type {
  Note,
  NoteListFilters,
  NoteRuntimeContext,
  NoteSavePayload,
  NoteStatus
} from "./note.types.js";

export function normalizeNoteSavePayload(input: NoteSavePayload): NoteSavePayload {
  const title = input.title.trim().replace(/\s+/g, " ");
  const body = input.body.trim();
  if (!title) throw AppError.validation("Note title is required.");
  if (!body) throw AppError.validation("Note body is required.");
  if (title.length > 240) throw AppError.validation("Note title must be 240 characters or fewer.");
  return { body, title };
}

export class NotesRepository {
  async list(context: NoteRuntimeContext, filters: NoteListFilters): Promise<Note[]> {
    let query = context.database
      .selectFrom("notes_notes")
      .selectAll()
      .where("company_id", "=", context.companyId);
    if (filters.status) query = query.where("status", "=", filters.status);
    if (filters.search?.trim()) {
      const needle = `%${filters.search.trim()}%`;
      query = query.where((where) =>
        where.or([where("title", "like", needle), where("body", "like", needle)])
      );
    }
    const rows = await query
      .orderBy("updated_at", "desc")
      .limit(filters.limit ?? 100)
      .execute();
    return rows.map(toNote);
  }

  async requireNote(context: NoteRuntimeContext, idOrUuid: string): Promise<Note> {
    const row = await context.database
      .selectFrom("notes_notes")
      .selectAll()
      .where("company_id", "=", context.companyId)
      .where((where) =>
        where.or([where("uuid", "=", idOrUuid), where("id", "=", Number(idOrUuid) || 0)])
      )
      .executeTakeFirst();
    if (!row) throw AppError.notFound("Note was not found.");
    return toNote(row);
  }

  async create(context: NoteRuntimeContext, input: NoteSavePayload): Promise<Note> {
    const normalized = normalizeNoteSavePayload(input);
    const result = await context.database
      .insertInto("notes_notes")
      .values({
        body: normalized.body,
        company_id: context.companyId,
        created_by: context.actorEmail,
        status: "active",
        title: normalized.title,
        updated_by: context.actorEmail,
        uuid: publicUuid()
      })
      .executeTakeFirst();
    return this.requireById(context, Number(result.insertId));
  }

  async update(
    context: NoteRuntimeContext,
    idOrUuid: string,
    input: NoteSavePayload
  ): Promise<Note> {
    const note = await this.requireNote(context, idOrUuid);
    const normalized = normalizeNoteSavePayload(input);
    await context.database
      .updateTable("notes_notes")
      .set({ body: normalized.body, title: normalized.title, updated_by: context.actorEmail })
      .where("id", "=", note.id)
      .execute();
    return this.requireById(context, note.id);
  }

  async suspend(context: NoteRuntimeContext, idOrUuid: string): Promise<Note> {
    return this.setStatus(context, idOrUuid, "inactive");
  }

  async restore(context: NoteRuntimeContext, idOrUuid: string): Promise<Note> {
    return this.setStatus(context, idOrUuid, "active");
  }

  async forceDelete(context: NoteRuntimeContext, idOrUuid: string): Promise<{ uuid: string }> {
    const note = await this.requireNote(context, idOrUuid);
    await context.database.deleteFrom("notes_notes").where("id", "=", note.id).execute();
    return { uuid: note.uuid };
  }

  private async setStatus(
    context: NoteRuntimeContext,
    idOrUuid: string,
    status: NoteStatus
  ): Promise<Note> {
    const note = await this.requireNote(context, idOrUuid);
    await context.database
      .updateTable("notes_notes")
      .set({ status, updated_by: context.actorEmail })
      .where("id", "=", note.id)
      .execute();
    return this.requireById(context, note.id);
  }

  private async requireById(context: NoteRuntimeContext, id: number): Promise<Note> {
    const row = await context.database
      .selectFrom("notes_notes")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirstOrThrow(() => AppError.notFound("Note was not found."));
    return toNote(row);
  }
}

function toNote(row: Record<string, unknown>): Note {
  return {
    body: String(row.body ?? ""),
    createdAt: iso(row.created_at),
    id: Number(row.id),
    status: row.status === "inactive" ? "inactive" : "active",
    title: String(row.title ?? ""),
    updatedAt: iso(row.updated_at),
    uuid: String(row.uuid ?? "")
  };
}

function iso(value: unknown): string {
  return new Date(String(value)).toISOString();
}

function publicUuid(): string {
  return randomBytes(4).toString("hex");
}
