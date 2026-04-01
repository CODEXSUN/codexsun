import type { RowDataPacket } from 'mysql2/promise'
import { db } from './orm'
import { migrations } from './migrations'
import { seeders } from './seeders'
import { migrationTableName, seederTableName } from './table-names'

interface TrackerRow extends RowDataPacket {
  id: string
}

let databaseBootstrapPromise: Promise<void> | null = null

async function ensureTrackingTable(tableName: string) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${tableName} (
      id VARCHAR(128) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `)
}

async function readAppliedIds(tableName: string) {
  const rows = await db.query<TrackerRow>(`SELECT id FROM ${tableName} ORDER BY id`)
  return new Set(rows.map((row) => row.id))
}

async function applyPendingMigrations() {
  await ensureTrackingTable(migrationTableName)
  const appliedIds = await readAppliedIds(migrationTableName)

  for (const migration of migrations) {
    if (appliedIds.has(migration.id)) {
      continue
    }

    await migration.up({ db })
    await db.insert(migrationTableName, {
      id: migration.id,
      name: migration.name,
    })
  }
}

async function applyPendingSeeders() {
  await ensureTrackingTable(seederTableName)
  const appliedIds = await readAppliedIds(seederTableName)

  for (const seeder of seeders) {
    if (appliedIds.has(seeder.id)) {
      continue
    }

    if (seeder.isEnabled && !seeder.isEnabled()) {
      continue
    }

    await seeder.run({ db })
    await db.insert(seederTableName, {
      id: seeder.id,
      name: seeder.name,
    })
  }
}

async function applyDatabaseBootstrap() {
  if (!db.isEnabled()) {
    return
  }

  await applyPendingMigrations()
  await applyPendingSeeders()
}

export async function runMigrations() {
  if (databaseBootstrapPromise) {
    return databaseBootstrapPromise
  }

  databaseBootstrapPromise = applyDatabaseBootstrap()

  try {
    await databaseBootstrapPromise
  } finally {
    databaseBootstrapPromise = null
  }
}
