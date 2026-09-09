#!/usr/bin/env node

import { resolve } from 'node:path'
import { readMariaDbEnvironment, verifyApplicationDatabase } from './mariadb-local.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const environment = readMariaDbEnvironment(projectRoot)

try {
  const proof = await verifyApplicationDatabase(environment, environment.DB_MASTER_NAME)
  process.stdout.write(
    `[mariadb] smoke passed for ${proof.databaseName} on ${environment.DB_HOST}:${environment.DB_PORT} (${proof.version}).\n`,
  )
} catch (error) {
  process.stderr.write(
    `[mariadb] smoke failed: ${error instanceof Error ? error.message : 'connection failed'}\n`,
  )
  process.exitCode = 1
}
