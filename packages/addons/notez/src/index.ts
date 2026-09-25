import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "notez",
  "label": "Notez",
  "purpose": "Fast personal and team notes with rich text, organization, search, and linking",
  "areas": [
    "notes",
    "rich text",
    "links"
  ],
  "contracts": [
    "notez.v1"
  ],
  "publishedEvents": [
    "notez.note.created",
    "notez.note.updated"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class NotezService extends AddonService {
  constructor() {
    super(definition);
  }

  createNote(input: { authorId: string; title: string; body: string }) {
    return { ...this.create({ title: input.title, ownerId: input.authorId, metadata: { body: input.body } }), body: input.body };
  }
}

export function createNotezService() {
  return new NotezService();
}
