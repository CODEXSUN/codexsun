import type { DatabaseLifecyclePlan } from "@codexsun/platform-core";
import { qcafeFoundationLifecyclePlan } from "./modules/foundation/persistence/qcafe-persistence.js";
import type { QcafeFoundationDatabase } from "./modules/foundation/persistence/qcafe-foundation.database.js";
import { qcafeMenuLifecyclePlan } from "./modules/menu/persistence/menu-lifecycle.js";
import { qcafeSettingsLifecyclePlan } from "./modules/settings/persistence/settings-lifecycle.js";

export function createQcafeLifecyclePlans(): readonly DatabaseLifecyclePlan<QcafeFoundationDatabase>[] {
  return [qcafeFoundationLifecyclePlan, qcafeMenuLifecyclePlan, qcafeSettingsLifecyclePlan];
}
