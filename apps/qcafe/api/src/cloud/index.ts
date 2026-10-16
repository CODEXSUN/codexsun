import {
  registerTableModule,
  migrateTables,
  seedTablePermissions,
  lockQCafeTable
} from "../modules/table/index.js";
import {
  registerOrderModule,
  migrateOrders,
  seedOrderPermissions,
  releaseQCafeOrderSeats
} from "../modules/order/index.js";
import { createQCafeOrderBill, migratePosOrderContext } from "../modules/pos/index.js";
import type { FastifyInstance } from "fastify";
import { runMigrationBatch, type MigrationBatch } from "@codexsun/framework/db";
import type { Kysely } from "kysely";
import {
  registerMenuModule,
  migrateMenu,
  migrateMenuImages,
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
    }
  ]
};

export async function migrateQCafeWeb(database: Kysely<QCafeDatabase>) {
  await runMigrationBatch(database, qcafeMigrationBatch, { batchSize: 1 });
}

export async function seedQCafeWeb(database: Kysely<QCafeDatabase>) {
  await seedMenuPermissions(database);
  await seedPosPermissions(database);
  await seedTablePermissions(database);
  await seedOrderPermissions(database);
}

export function registerQCafeWeb(app: FastifyInstance, dependencies: QCafeDependencies) {
  registerMenuModule(app, dependencies);
  registerTableModule(app, dependencies);
  registerOrderModule(app, {
    ...dependencies,
    lookupMenu: lookupQCafeMenu,
    lockTable: lockQCafeTable,
    createBill: createQCafeOrderBill
  });
  registerPosModule(app, {
    ...dependencies,
    lookupMenu: lookupQCafeMenu,
    releaseSeats: releaseQCafeOrderSeats
  });
}

export type { QCafeContext, QCafeDatabase } from "./runtime.js";
