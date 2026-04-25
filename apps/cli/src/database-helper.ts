import { pathToFileURL } from "node:url"

import { getServerConfig } from "../../framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  freshApplicationDatabase,
  listRegisteredDatabaseMigrations,
  listRegisteredDatabaseSeeders,
  prepareApplicationDatabase,
  runDatabaseMigrations,
  runDatabaseSeeders,
} from "../../framework/src/runtime/database/index.js"

type DatabaseCommand = "fresh" | "migrate" | "prepare" | "seed" | "status"

function resolveCommand(value: string | undefined): DatabaseCommand | null {
  switch (value) {
    case undefined:
    case "fresh":
    case "prepare":
    case "migrate":
    case "seed":
    case "status":
      return value ?? "prepare"
    default:
      return null
  }
}

function printUsage() {
  console.info(
    "Usage: tsx apps/cli/src/database-helper.ts [prepare|migrate|seed|status|fresh] [--yes]"
  )
}

function hasFreshConfirmation(args: string[]) {
  return args.includes("--yes")
}

export async function runDatabaseHelper(
  cwd = process.cwd(),
  args = process.argv.slice(2)
) {
  const command = resolveCommand(args[0])
  const extraArgs = args.slice(1)

  if (!command) {
    printUsage()
    process.exitCode = 1
    return
  }

  if (command === "fresh" && !hasFreshConfirmation(extraArgs)) {
    console.error(
      "Refusing db:fresh without confirmation. Re-run with --yes or use npm run db:fresh."
    )
    process.exitCode = 1
    return
  }

  const config = getServerConfig(cwd)
  const databases = createRuntimeDatabases(config)

  try {
    if (command === "status") {
      console.info(
        `Registered migrations: ${listRegisteredDatabaseMigrations().length}`
      )
      console.info(`Registered seeders: ${listRegisteredDatabaseSeeders().length}`)
      return
    }

    if (command === "migrate") {
      const result = await runDatabaseMigrations(databases.primary, {
        logger: console,
      })

      console.info(
        `Migrations applied: ${result.applied.length}, skipped: ${result.skipped.length}`
      )
      return
    }

    if (command === "seed") {
      const migrationResult = await runDatabaseMigrations(databases.primary, {
        logger: console,
      })
      const result = await runDatabaseSeeders(databases.primary, {
        logger: console,
      })

      console.info(
        `Seeders applied: ${result.applied.length}, skipped: ${result.skipped.length}. Migrations applied first: ${migrationResult.applied.length}`
      )
      return
    }

    if (command === "fresh") {
      const result = await freshApplicationDatabase(databases, {
        driver: config.database.driver,
        databaseName: config.database.name,
        logger: console,
      })

      console.info(
        `Database refreshed. Dropped tables: ${result.dropped.tables}, dropped views: ${result.dropped.views}, migrations applied: ${result.migrations.applied.length}, seeders applied: ${result.seeders.applied.length}`
      )
      return
    }

    const result = await prepareApplicationDatabase(databases, { logger: console })

    console.info(
      `Database prepared. Migrations applied: ${result.migrations.applied.length}, seeders applied: ${result.seeders.applied.length}`
    )
  } finally {
    await databases.destroy()
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void runDatabaseHelper()
}
