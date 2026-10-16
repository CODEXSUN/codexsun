import type { Kysely } from "kysely";
import { FrappeLiveSyncService, type ExportKind, type FrappeDatabase } from "@codexsun/frappe-api";
import { getTenantDatabase } from "../../database/tenant-database.js";
import { TenantRepository } from "../tenant/tenant.repository.js";
import type { QueueManagerService } from "./queue-manager.service.js";

export function startFrappeLiveSyncScheduler(queue: QueueManagerService) {
  let running = false;
  const dispatch = async () => {
    if (running) return;
    running = true;
    try {
      for (const tenant of await new TenantRepository().list()) {
        if (tenant.status !== "active" || !tenant.enabledModuleKeys.includes("frappe")) continue;
        const database = getTenantDatabase(tenant) as unknown as Kysely<FrappeDatabase>;
        try {
          const kinds = await new FrappeLiveSyncService(database).dueKinds();
          for (const kind of kinds) await enqueue(queue, tenant.uuid, tenant.dbName, kind);
        } catch (error) {
          console.warn("[frappe-live-sync] schedule pass deferred", {
            tenantId: tenant.uuid,
            message: error instanceof Error ? error.message : "Live sync schedule failed."
          });
        }
      }
    } finally {
      running = false;
    }
  };
  const timer = setInterval(() => void dispatch(), 60_000);
  timer.unref?.();
  void dispatch();
  return () => clearInterval(timer);
}

async function enqueue(
  queue: QueueManagerService,
  tenantId: string,
  tenantDatabase: string,
  kind: ExportKind
) {
  await queue.enqueue({
    actorEmail: "system:frappe-live-sync",
    correlationId: `frappe-live-sync:${kind}`,
    idempotencyKey: `frappe-live-sync:${tenantId}:${kind}:${Math.floor(Date.now() / 60_000)}`,
    jobName: "frappe.live-sync",
    maxAttempts: 3,
    payload: { tenantDatabase, kind, manual: false },
    queueName: "reports",
    sourceModule: "frappe.live-sync",
    tenantId
  });
}
