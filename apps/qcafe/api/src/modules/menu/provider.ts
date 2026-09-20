import type { ModuleProvider, ProviderRegistrationContext } from "@codexsun/framework";
import type { StorageProvider } from "@codexsun/platform-core";
import { MenuMediaStorage } from "./persistence/menu-media.storage.js";

export class QcafeMenuProvider implements ModuleProvider {
  readonly manifest = {
    id: "qcafe.menu",
    owner: "apps/qcafe/api/modules/menu",
    version: "1.6.0",
    dependencies: ["qcafe.foundation"],
    contracts: [
      "qcafe.menu.catalog.v1",
      "qcafe.menu.effective-price.v1",
      "qcafe.menu.media.v1",
      "qcafe.menu.availability.v1",
      "qcafe.menu.customization.v1",
      "qcafe.menu.saleability.v1",
      "qcafe.menu.campaign-pricing.v1",
    ],
    events: { published: [], consumed: [] },
  };

  register(context: ProviderRegistrationContext): void {
    const storage = context.require<StorageProvider>("storage").forModule("qcafe", "menu");
    context.provide("qcafe.menu.media-storage", new MenuMediaStorage(storage));
  }
}
