import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "wikiz",
  "label": "Wikiz",
  "purpose": "Company knowledge base for structured documentation, procedures, guides, and internal knowledge",
  "areas": [
    "knowledge",
    "pages",
    "revisions"
  ],
  "contracts": [
    "wikiz.v1"
  ],
  "publishedEvents": [
    "wikiz.page.created",
    "wikiz.page.updated"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class WikizService extends AddonService {
  constructor() {
    super(definition);
  }

  publishPage(input: { authorId: string; slug: string; title: string; body: string }) {
    return { ...this.create({ title: input.title, ownerId: input.authorId, metadata: { slug: input.slug, body: input.body } }), slug: input.slug, body: input.body };
  }
}

export function createWikizService() {
  return new WikizService();
}
