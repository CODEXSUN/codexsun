import type { ModuleProvider } from "@codexsun/framework";
import { QcafeBillingProvider } from "./modules/billing/provider.js";
import { QcafeBookingProvider } from "./modules/booking/provider.js";
import { QcafeDevicesProvider } from "./modules/devices/provider.js";
import { QcafeFoundationProvider } from "./modules/foundation/provider.js";
import { QcafeInventoryProvider } from "./modules/inventory/provider.js";
import { QcafeKitchenProvider } from "./modules/kitchen/provider.js";
import { QcafeMenuProvider } from "./modules/menu/provider.js";
import { QcafePosProvider } from "./modules/pos/provider.js";
import { QcafeSettingsProvider } from "./modules/settings/provider.js";

export function createQcafeProviders(): ModuleProvider[] {
  return [
    new QcafeFoundationProvider(),
    new QcafeMenuProvider(),
    new QcafeSettingsProvider(),
    new QcafePosProvider(),
    new QcafeKitchenProvider(),
    new QcafeBillingProvider(),
    new QcafeBookingProvider(),
    new QcafeInventoryProvider(),
    new QcafeDevicesProvider(),
  ];
}
