import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerContractRoute } from "@codexsun/framework/http";
import { NotesService } from "./note.service.js";
import type { NoteListFilters, NoteModuleDependencies } from "./note.types.js";

const saveSchema = z
  .object({
    body: z.string().trim().min(1, "Note body is required."),
    title: z.string().trim().min(1, "Note title is required.").max(240)
  })
  .strict();
const idSchema = z.object({ id: z.string().min(1).max(80) }).strict();
const noteSchema = z
  .object({
    body: z.string(),
    createdAt: z.string(),
    id: z.number(),
    status: z.enum(["active", "inactive"]),
    title: z.string(),
    updatedAt: z.string(),
    uuid: z.string()
  })
  .strict();

export function registerNotesRoutes(app: FastifyInstance, dependencies: NoteModuleDependencies) {
  const service = new NotesService(dependencies);
  registerContractRoute(app, {
    method: "GET",
    url: "/notes/notes",
    schemas: {
      querystring: z
        .object({
          limit: z.coerce.number().int().positive().max(200).optional(),
          search: z.string().optional(),
          status: z.enum(["active", "inactive"]).optional()
        })
        .strict(),
      response: z.array(noteSchema)
    },
    handler: ({ query, request }) => service.list(request, listFilters(query))
  });
  registerContractRoute(app, {
    method: "GET",
    url: "/notes/notes/:id",
    schemas: { params: idSchema, response: noteSchema },
    handler: ({ params, request }) => service.get(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/notes/notes",
    schemas: { body: saveSchema, response: noteSchema },
    handler: ({ body, request }) => service.create(request, body)
  });
  registerContractRoute(app, {
    method: "PUT",
    url: "/notes/notes/:id",
    schemas: { body: saveSchema, params: idSchema, response: noteSchema },
    handler: ({ body, params, request }) => service.update(request, params.id, body)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/notes/notes/:id/suspend",
    schemas: { params: idSchema, response: noteSchema },
    handler: ({ params, request }) => service.suspend(request, params.id)
  });
  registerContractRoute(app, {
    method: "POST",
    url: "/notes/notes/:id/restore",
    schemas: { params: idSchema, response: noteSchema },
    handler: ({ params, request }) => service.restore(request, params.id)
  });
  registerContractRoute(app, {
    method: "DELETE",
    url: "/notes/notes/:id",
    schemas: {
      params: idSchema,
      response: z.object({ uuid: z.string() }).strict()
    },
    handler: ({ params, request }) => service.forceDelete(request, params.id)
  });
}

function listFilters(
  input:
    | {
        limit?: number | undefined;
        search?: string | undefined;
        status?: "active" | "inactive" | undefined;
      }
    | undefined
): NoteListFilters {
  return {
    ...(input?.limit !== undefined ? { limit: input.limit } : {}),
    ...(input?.search !== undefined ? { search: input.search } : {}),
    ...(input?.status !== undefined ? { status: input.status } : {})
  };
}
