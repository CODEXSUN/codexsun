import { createHash } from "node:crypto";
import type { ZetroHandoffReceipt, ZetroPreparedTaskHandoff, ZunoAcceptedZetroHandoff } from "@codexsun/zetro-contracts";
import { receiptFromRow, ZunoHandoffStore } from "./handoff-store";

export class HandoffConflictError extends Error {
  constructor() {
    super("This idempotency key already belongs to a different Zetro handoff.");
  }
}

export class ZunoHandoffService {
  constructor(private readonly store: ZunoHandoffStore) {}

  accept(handoff: ZetroPreparedTaskHandoff): ZetroHandoffReceipt {
    const payloadHash = createHash("sha256").update(JSON.stringify(handoff)).digest("hex");
    const existing = this.store.find(handoff.idempotencyKey);
    if (!existing) return this.store.insert(handoff, payloadHash);
    if (existing.payload_hash !== payloadHash) throw new HandoffConflictError();
    return receiptFromRow(existing);
  }

  list(): ZunoAcceptedZetroHandoff[] {
    return this.store.list();
  }

  close(): void {
    this.store.close();
  }
}
