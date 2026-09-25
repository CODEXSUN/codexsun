import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "notifyz",
  "label": "Notifyz",
  "purpose": "Central notification engine for in-app, email, push, task, system, and workflow notifications",
  "areas": [
    "notifications",
    "preferences",
    "delivery"
  ],
  "contracts": [
    "notifyz.v1"
  ],
  "publishedEvents": [
    "notifyz.notification.created",
    "notifyz.notification.sent"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class NotifyzService extends AddonService {
  constructor() {
    super(definition);
  }

  createNotification(input: { recipientId: string; message: string }) {
    return { ...this.create({ title: input.message, ownerId: input.recipientId, metadata: { recipientId: input.recipientId } }), recipientId: input.recipientId, message: input.message };
  }
}

export function createNotifyzService() {
  return new NotifyzService();
}
