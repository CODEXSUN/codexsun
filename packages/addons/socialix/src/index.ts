import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "socialix",
  "label": "Socialix",
  "purpose": "Social media management for content creation, scheduling, publishing, campaigns, and analytics",
  "areas": [
    "content",
    "campaigns",
    "publishing"
  ],
  "contracts": [
    "socialix.v1"
  ],
  "publishedEvents": [
    "socialix.post.created",
    "socialix.post.published"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class SocialixService extends AddonService {
  constructor() {
    super(definition);
  }

  schedulePost(input: { authorId: string; channelId: string; content: string; scheduledFor: string }) {
    return { ...this.create({ title: input.content, ownerId: input.authorId, metadata: { channelId: input.channelId, scheduledFor: input.scheduledFor } }), channelId: input.channelId, scheduledFor: input.scheduledFor };
  }
}

export function createSocialixService() {
  return new SocialixService();
}
