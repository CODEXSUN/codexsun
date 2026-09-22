import type { DatabaseLifecyclePlan } from "@codexsun/platform-core";
import { qcafeFoundationLifecyclePlan } from "./modules/foundation/persistence/qcafe-persistence.js";
import type { QcafeFoundationDatabase } from "./modules/foundation/persistence/qcafe-foundation.database.js";
import { qcafeMenuLifecyclePlan } from "./modules/menu/persistence/menu-lifecycle.js";
import { qcafeSettingsLifecyclePlan } from "./modules/settings/persistence/settings-lifecycle.js";
import { qcafePosLifecyclePlan } from "./modules/pos/persistence/pos-lifecycle.js";
import { qcafeBookingLifecyclePlan } from "./modules/booking/persistence/booking-lifecycle.js";
import { qcafeKitchenLifecyclePlan } from "./modules/kitchen/persistence/kitchen-lifecycle.js";
import { qcafeBillingLifecyclePlan } from "./modules/billing/persistence/billing-lifecycle.js";

export function createQcafeLifecyclePlans(): readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[] {
  return [
    qcafeFoundationLifecyclePlan,
    qcafeMenuLifecyclePlan,
    qcafeSettingsLifecyclePlan,
    qcafePosLifecyclePlan,
    qcafeBookingLifecyclePlan,
    qcafeKitchenLifecyclePlan,
    qcafeBillingLifecyclePlan,
  ];
}
