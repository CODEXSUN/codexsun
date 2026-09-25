import type { AddonRecord } from "./index.js";

export interface AddonRepository {
  create(record: AddonRecord): AddonRecord;
  list(): readonly AddonRecord[];
  get(id: string): AddonRecord | undefined;
  update(record: AddonRecord): AddonRecord;
}

export class InMemoryAddonRepository implements AddonRepository {
  private readonly records = new Map<string, AddonRecord>();

  create(record: AddonRecord): AddonRecord {
    if (this.records.has(record.id)) throw new Error(`Record ${record.id} already exists.`);
    this.records.set(record.id, record);
    return record;
  }

  list(): readonly AddonRecord[] {
    return [...this.records.values()];
  }

  get(id: string): AddonRecord | undefined {
    return this.records.get(id);
  }

  update(record: AddonRecord): AddonRecord {
    if (!this.records.has(record.id)) throw new Error(`Record ${record.id} was not found.`);
    this.records.set(record.id, record);
    return record;
  }
}
