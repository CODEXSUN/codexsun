import { type ModuleStorage } from "@codexsun/platform-core";
import {
  recordedOrchestrationAttemptSchema,
  type RecordedOrchestrationAttempt,
} from "../contracts/orchestration.contract.js";

export interface OrchestrationAttemptRepository {
  find(id: string): Promise<RecordedOrchestrationAttempt | undefined>;
  list(): Promise<RecordedOrchestrationAttempt[]>;
  save(attempt: RecordedOrchestrationAttempt): Promise<void>;
}

export class StorageOrchestrationAttemptRepository implements OrchestrationAttemptRepository {
  constructor(private readonly storage: ModuleStorage) {}

  async find(id: string): Promise<RecordedOrchestrationAttempt | undefined> {
    return (await this.list()).find((attempt) => attempt.id === id);
  }

  async list(): Promise<RecordedOrchestrationAttempt[]> {
    try {
      const file = await this.storage.read("private", "attempts.json");
      return JSON.parse(file.toString("utf8"))
        .map((attempt: unknown) => recordedOrchestrationAttemptSchema.parse(attempt))
        .sort((left: RecordedOrchestrationAttempt, right: RecordedOrchestrationAttempt) =>
          left.id.localeCompare(right.id),
        );
    } catch (error: unknown) {
      if (isMissingFile(error)) return [];
      throw error;
    }
  }

  async save(attempt: RecordedOrchestrationAttempt): Promise<void> {
    const existing = await this.list();
    const records = [...existing.filter((candidate) => candidate.id !== attempt.id), attempt];
    await this.storage.write("private", "attempts.json", JSON.stringify(records, null, 2));
  }
}

function isMissingFile(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
