import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "meety",
  "label": "Meety",
  "purpose": "Meetings, agendas, participants, notes, decisions, action items, and meeting history",
  "areas": [
    "meetings",
    "agendas",
    "decisions"
  ],
  "contracts": [
    "meety.v1"
  ],
  "publishedEvents": [
    "meety.meeting.created",
    "meety.meeting.completed"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class MeetyService extends AddonService {
  constructor() {
    super(definition);
  }

  createMeeting(input: { organizerId: string; title: string; startsAt: string; participantIds: readonly string[] }) {
    return { ...this.create({ title: input.title, ownerId: input.organizerId, metadata: { startsAt: input.startsAt, participants: input.participantIds.join(",") } }), startsAt: input.startsAt, participantIds: input.participantIds };
  }
}

export function createMeetyService() {
  return new MeetyService();
}
