import {
  registerSettingsModule,
  migrateSettings,
  seedSettings,
  readQCafeSettings
} from "../modules/settings/index.js";
import {
  registerSpecialModule,
  migrateSpecials,
  seedSpecialSettings,
  readQCafeSpecial
} from "../modules/special/index.js";
import {
  registerTableModule,
  migrateTables,
  seedTablePermissions,
  lockQCafeTable
} from "../modules/table/index.js";
import {
  registerOrderModule,
  migrateOrders,
  migrateOrderBookings,
  seedOrderPermissions,
  releaseQCafeOrderSeats
} from "../modules/order/index.js";
import {
  createQCafeOrderBill,
  migratePosOrderContext,
  migrateReceiptContext
} from "../modules/pos/index.js";
import type { FastifyInstance } from "fastify";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { Kysely } from "kysely";
import {
  registerMenuModule,
  migrateMenu,
  migrateMenuImages,
  migrateMenuSpecialPrices,
  priceQCafeMenu,
  seedMenuPermissions,
  lookupQCafeMenu
} from "../modules/menu/index.js";
import { registerPosModule, migratePos, seedPosPermissions } from "../modules/pos/index.js";
import type { QCafeDatabase, QCafeDependencies } from "./runtime.js";

export const qcafeMigrationBatch: MigrationBatch<QCafeDatabase> = {
  batch: 1,
  scope: "qcafe",
  version: "1.1.1",
  description: "QCafe web menu and POS foundation",
  steps: [
    {
      name: "qcafe.settings.001",
      checksum: "qcafe.settings.001:v1",
      description: "Tenant restaurant preferences",
      version: 1,
      up: migrateSettings
    },
    {
      name: "qcafe.menu.001",
      checksum: "qcafe.menu.001:v1",
      description: "Tenant menu and audit",
      version: 1,
      up: migrateMenu
    },
    {
      name: "qcafe.pos.001",
      checksum: "qcafe.pos.001:v1",
      description: "Immutable POS and payment ledger",
      version: 1,
      up: migratePos
    },
    {
      name: "qcafe.menu.002",
      checksum: "qcafe.menu.002:v1",
      description: "Menu image URLs",
      version: 2,
      up: migrateMenuImages
    },
    {
      name: "qcafe.table.001",
      checksum: "qcafe.table.001:v1",
      description: "Restaurant tables",
      version: 1,
      up: migrateTables
    },
    {
      name: "qcafe.pos.002",
      checksum: "qcafe.pos.002:v1",
      description: "Bill service context",
      version: 2,
      up: migratePosOrderContext
    },
    {
      name: "qcafe.order.001",
      checksum: "qcafe.order.001:v1",
      description: "Orders seats and kitchen tickets",
      version: 1,
      up: migrateOrders
    },
    {
      name: "qcafe.special.001",
      checksum: "qcafe.special.001:v1",
      description: "Tenant Today Special settings and audit",
      version: 1,
      up: migrateSpecials
    },
    {
      name: "qcafe.menu.003",
      checksum: "qcafe.menu.003:v1",
      description: "Menu special prices",
      version: 3,
      up: migrateMenuSpecialPrices
    },
    {
      name: "qcafe.pos.003",
      checksum: "qcafe.pos.003:v1",
      description: "Receipt preference and inclusive tax snapshots",
      version: 3,
      up: migrateReceiptContext
    },
    {
      name: "qcafe.order.002",
      checksum: "qcafe.order.002:v1",
      description: "Scheduled pickup booking details",
      version: 2,
      up: migrateOrderBookings
    }
  ]
};

export async function migrateQCafeWeb(database: Kysely<QCafeDatabase>) {
  await runMigrationBatch(database, qcafeMigrationBatch, { batchSize: 1 });
}

export async function seedQCafeWeb(database: Kysely<QCafeDatabase>) {
  await seedSettings(database);
  await seedMenuPermissions(database);
  await seedSpecialSettings(database);
  await seedPosPermissions(database);
  await seedTablePermissions(database);
  await seedOrderPermissions(database);
}

export function registerQCafeWeb(app: FastifyInstance, dependencies: QCafeDependencies) {
  registerSettingsModule(app, dependencies);
  registerSpecialModule(app, dependencies);
  registerMenuModule(app, {
    ...dependencies,
    specialPolicy: readQCafeSpecial,
    settingsPolicy: readQCafeSettings
  });
  const lookupMenu = async (database: Kysely<QCafeDatabase>, uuids: string[]) =>
    priceQCafeMenu(await lookupQCafeMenu(database, uuids), await readQCafeSpecial(database));
  registerTableModule(app, dependencies);
  registerOrderModule(app, {
    ...dependencies,
    lookupMenu,
    lockTable: lockQCafeTable,
    createBill: createQCafeOrderBill
  });
  registerPosModule(app, {
    ...dependencies,
    lookupMenu,
    releaseSeats: releaseQCafeOrderSeats
  });
}

export type { QCafeContext, QCafeDatabase } from "./runtime.js";
