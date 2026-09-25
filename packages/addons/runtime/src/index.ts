import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import { InMemoryAddonRepository, type AddonRepository } from "./persistence.js";

export interface AddonDefinition {
  readonly id: string;
  readonly label: string;
  readonly purpose: string;
  readonly areas: readonly string[];
  readonly contracts: readonly string[];
  readonly publishedEvents: readonly string[];
}

export interface AddonRecord {
  readonly id: string;
  readonly title: string;
  readonly status: "draft" | "active" | "completed" | "archived";
  readonly ownerId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly metadata: Readonly<Record<string, string>>;
}

export interface AddonCreateInput {
  readonly title: string;
  readonly ownerId: string;
  readonly metadata?: Readonly<Record<string, string>>;
}

export class AddonService {
  constructor(readonly definition: AddonDefinition, private readonly repository: AddonRepository = new InMemoryAddonRepository()) {}

  create(input: AddonCreateInput): AddonRecord {
    const now = new Date().toISOString();
    const record: AddonRecord = {
      id: `${this.definition.id}-${crypto.randomUUID()}`,
      title: input.title.trim(),
      status: "draft",
      ownerId: input.ownerId,
      createdAt: now,
      updatedAt: now,
      metadata: { ...input.metadata },
    };
    if (!record.title) throw new Error(`${this.definition.label} records require a title.`);
    return this.repository.create(record);
  }

  list(): readonly AddonRecord[] {
    return [...this.repository.list()].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  get(id: string): AddonRecord | undefined {
    return this.repository.get(id);
  }

  updateStatus(id: string, status: AddonRecord["status"]): AddonRecord {
    const record = this.repository.get(id);
    if (!record) throw new Error(`${this.definition.label} record ${id} was not found.`);
    const updated = { ...record, status, updatedAt: new Date().toISOString() };
    return this.repository.update(updated);
  }
}

export type { AddonRepository } from "./persistence.js";
export { InMemoryAddonRepository } from "./persistence.js";
export type { AddonApiRoute, AddonHttpMethod } from "./api.js";
export { defineAddonRoutes } from "./api.js";

export function createAddonService(definition: AddonDefinition): AddonService {
  return new AddonService(definition);
}

export function createAddonProvider(definition: AddonDefinition): ModuleProvider {
  return {
    manifest: {
      id: `${definition.id}.provider`,
      owner: `packages/addons/${definition.id}`,
      version: "1.0.0",
      dependencies: ["platform.core"],
      contracts: [...definition.contracts],
      events: { published: [...definition.publishedEvents], consumed: [] },
    },
    register(context: ProviderRegistrationContext): void {
      context.provide(`addon.${definition.id}.service`, createAddonService(definition));
    },
  };
}
