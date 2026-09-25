import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "calendy",
  "label": "Calendy",
  "purpose": "Calendar, events, scheduling, availability, reminders, and meeting coordination",
  "areas": [
    "calendar",
    "events",
    "availability"
  ],
  "contracts": [
    "calendy.v1"
  ],
  "publishedEvents": [
    "calendy.event.created",
    "calendy.event.updated"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class CalendyService extends AddonService {
  constructor() {
    super(definition);
  }

  scheduleEvent(input: { organizerId: string; startsAt: string; endsAt: string; title: string }) {
    return { ...this.create({ title: input.title, ownerId: input.organizerId, metadata: { startsAt: input.startsAt, endsAt: input.endsAt } }), startsAt: input.startsAt, endsAt: input.endsAt };
  }
}

export function createCalendyService() {
  return new CalendyService();
}
