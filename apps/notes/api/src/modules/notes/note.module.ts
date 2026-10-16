import type { FastifyInstance } from "fastify";
import { defineModule } from "@codexsun/framework/modules";
import { registerNotesRoutes } from "./note.routes.js";
import type { NoteModuleDependencies } from "./note.types.js";

export function createNotesModule(dependencies: NoteModuleDependencies) {
  return defineModule<{ app: FastifyInstance }>({
    key: "notes",
    label: "Notes",
    register: ({ app }) => registerNotesRoutes(app, dependencies)
  });
}
