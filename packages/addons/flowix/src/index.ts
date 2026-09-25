import { AddonService, createAddonProvider as createProvider, type AddonDefinition } from "@codexsun/addon-runtime";
export { routes } from "./api.js";

export const definition: AddonDefinition = {
  "id": "flowix",
  "label": "Flowix",
  "purpose": "Workflow automation engine connecting add-ons, events, actions, conditions, triggers, and automated processes",
  "areas": [
    "workflows",
    "triggers",
    "actions"
  ],
  "contracts": [
    "flowix.v1"
  ],
  "publishedEvents": [
    "flowix.workflow.started",
    "flowix.workflow.completed"
  ]
};

export function createAddonProvider() {
  return createProvider(definition);
}

export class FlowixService extends AddonService {
  constructor() {
    super(definition);
  }

  createWorkflow(input: { ownerId: string; name: string; trigger: string }) {
    return { ...this.create({ title: input.name, ownerId: input.ownerId, metadata: { trigger: input.trigger } }), trigger: input.trigger };
  }
}

export function createFlowixService() {
  return new FlowixService();
}
