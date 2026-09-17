export interface OperationLogEntry {
  readonly application: string;
  readonly module: string;
  readonly correlationId: string;
  readonly event: string;
  readonly outcome: "success" | "failure";
  readonly occurredAt: string;
  readonly errorCode?: string;
}

export function createOperationLogEntry(entry: OperationLogEntry): OperationLogEntry {
  if (!entry.application || !entry.module || !entry.correlationId || !entry.event) {
    throw new Error("Operation logs require application, module, correlation ID, and event.");
  }
  if (entry.outcome === "failure" && !entry.errorCode) {
    throw new Error("Failed operation logs require a safe error code.");
  }
  return Object.freeze({ ...entry });
}
