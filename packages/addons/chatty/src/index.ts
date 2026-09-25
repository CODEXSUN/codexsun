import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "chatty",
  "label": "Chatty",
  "purpose": "Real-time team communication with channels, direct messages, groups, mentions, and message history",
  "areas": [
    "channels",
    "messages",
    "mentions"
  ],
  "contracts": [
    "chatty.v1"
  ],
  "publishedEvents": [
    "chatty.message.created",
    "chatty.channel.created"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class ChattyService extends AddonService {
  constructor() {
    super(definition);
  }

  createMessage(input: { channelId: string; senderId: string; text: string }) {
    return { ...this.create({ title: input.text, ownerId: input.senderId, metadata: { channelId: input.channelId } }), channelId: input.channelId, senderId: input.senderId, text: input.text };
  }
}

export function createChattyService() {
  return new ChattyService();
}
