import { createOperationLogEntry, type OperationLogEntry, type StorageProvider } from "@codexsun/platform-core";

export class OperationsService {
  constructor(private readonly storage: StorageProvider) {}

  audit(entry: OperationLogEntry): OperationLogEntry {
    return createOperationLogEntry(entry);
  }

  storageFor(module: string) {
    return this.storage.forModule("platform", module);
  }
}
