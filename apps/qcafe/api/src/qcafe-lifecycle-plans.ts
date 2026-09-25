import type { DatabaseLifecyclePlan } from "@codexsun/platform-core";
import { qcafeFoundationLifecyclePlan } from "./modules/foundation/persistence/qcafe-persistence.js";
import type { QcafeFoundationDatabase } from "./modules/foundation/persistence/qcafe-foundation.database.js";
import { qcafeMenuLifecyclePlan } from "./modules/menu/persistence/menu-lifecycle.js";
import { qcafeSettingsLifecyclePlan } from "./modules/settings/persistence/settings-lifecycle.js";
import { qcafePosLifecyclePlan } from "./modules/pos/persistence/pos-lifecycle.js";
import { qcafeBookingLifecyclePlan } from "./modules/booking/persistence/booking-lifecycle.js";
import { qcafeKitchenLifecyclePlan } from "./modules/kitchen/persistence/kitchen-lifecycle.js";
import { qcafeBillingLifecyclePlan } from "./modules/billing/persistence/billing-lifecycle.js";
import { qcafeInventoryLifecyclePlan } from "./modules/inventory/persistence/inventory-lifecycle.js";
import { qcafeDocumentsLifecyclePlan } from "./modules/documents/persistence/documents-lifecycle.js";
import { qcafeBackupLifecyclePlan } from "./modules/backup/persistence/backup-lifecycle.js";
import { qcafeMarketplaceLifecyclePlan } from "./modules/marketplace/persistence/marketplace-lifecycle.js";
import { qcafeAccountingLifecyclePlan } from "./modules/accounting/persistence/accounting-lifecycle.js";
import { qcafeSyncLifecyclePlan } from "./modules/sync/persistence/sync-lifecycle.js";

export function createQcafeLifecyclePlans(): readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[] {  return [
    qcafeFoundationLifecyclePlan,
    qcafeMenuLifecyclePlan,
    qcafeSettingsLifecyclePlan,
    qcafePosLifecyclePlan,
    qcafeBookingLifecyclePlan,
    qcafeKitchenLifecyclePlan,
    qcafeBillingLifecyclePlan,
    qcafeInventoryLifecyclePlan,
    qcafeDocumentsLifecyclePlan,
    qcafeBackupLifecyclePlan,
    qcafeMarketplaceLifecyclePlan,
    qcafeAccountingLifecyclePlan,
    qcafeSyncLifecyclePlan,
  ];
}

export function lifecycleDescriptorTotal(): number {
  return createQcafeLifecyclePlans().reduce((sum, plan) => sum + plan.migrations.length + plan.seeders.length, 0);
}
