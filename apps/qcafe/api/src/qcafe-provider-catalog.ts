import type { ModuleProvider } from "@codexsun/framework";
import { QcafeBillingProvider } from "./modules/billing/provider.js";
import { QcafeBookingProvider } from "./modules/booking/provider.js";
import { QcafeDevicesProvider } from "./modules/devices/provider.js";
import { QcafeFoundationProvider } from "./modules/foundation/provider.js";
import { QcafeInventoryProvider } from "./modules/inventory/provider.js";
import { QcafeKitchenProvider } from "./modules/kitchen/provider.js";
import { QcafeMenuProvider } from "./modules/menu/provider.js";
import { QcafePosProvider } from "./modules/pos/provider.js";

export function createQcafeProviders(): ModuleProvider[] {
  return [
    new QcafeFoundationProvider(),
    new QcafeMenuProvider(),
    new QcafePosProvider(),
    new QcafeKitchenProvider(),
    new QcafeBookingProvider(),
    new QcafeInventoryProvider(),
    new QcafeBillingProvider(),
    new QcafeDevicesProvider(),
  ];
}
