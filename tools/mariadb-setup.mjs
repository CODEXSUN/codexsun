#!/usr/bin/env node

import { resolve } from 'node:path'
import {
  MariaDbAdministrator,
  readMariaDbEnvironment,
  verifyApplicationDatabase,
} from './mariadb-local.mjs'

const projectRoot = resolve(import.meta.dirname, '..')
const environment = readMariaDbEnvironment(projectRoot)
const administrator = await MariaDbAdministrator.connect(environment)

try {
  await administrator.provisionApplicationDatabase()
  const proof = await verifyApplicationDatabase(environment, environment.DB_MASTER_NAME)
  process.stdout.write(
    `[mariadb] ${proof.version} ready as ${proof.account} on ${proof.databaseName}.\n`,
  )
} finally {
  await administrator.close()
}
