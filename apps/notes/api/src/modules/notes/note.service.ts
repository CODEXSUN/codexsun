import { migrateNotesModule } from "./note.migration.js";
import { NotesRepository } from "./note.repository.js";
import { seedNotesModule } from "./note.seed.js";
import type { NoteListFilters, NoteModuleDependencies, NoteSavePayload } from "./note.types.js";

const migratedDatabases = new Set<string>();

export class NotesService {
  private readonly repository = new NotesRepository();

  constructor(private readonly dependencies: NoteModuleDependencies) {}

  async context(request: Parameters<NoteModuleDependencies["resolveContext"]>[0]) {
    const context = await this.dependencies.resolveContext(request);
    if (!migratedDatabases.has(context.tenantDatabase)) {
      await migrateNotesModule(context.database);
      await seedNotesModule(context.database);
      migratedDatabases.add(context.tenantDatabase);
    }
    await context.authorize("notes.manage");
    return context;
  }

  async list(
    request: Parameters<NoteModuleDependencies["resolveContext"]>[0],
    filters: NoteListFilters
  ) {
    return this.repository.list(await this.context(request), filters);
  }

  async get(request: Parameters<NoteModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.requireNote(await this.context(request), id);
  }

  async create(
    request: Parameters<NoteModuleDependencies["resolveContext"]>[0],
    input: NoteSavePayload
  ) {
    return this.repository.create(await this.context(request), input);
  }

  async update(
    request: Parameters<NoteModuleDependencies["resolveContext"]>[0],
    id: string,
    input: NoteSavePayload
  ) {
    return this.repository.update(await this.context(request), id, input);
  }

  async suspend(request: Parameters<NoteModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.suspend(await this.context(request), id);
  }

  async restore(request: Parameters<NoteModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.restore(await this.context(request), id);
  }

  async forceDelete(request: Parameters<NoteModuleDependencies["resolveContext"]>[0], id: string) {
    return this.repository.forceDelete(await this.context(request), id);
  }
}
