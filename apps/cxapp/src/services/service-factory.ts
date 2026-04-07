import type { Kysely } from "kysely"

import type { ServerConfig } from "../../../framework/src/runtime/config/index.js"

import { AuthRepository } from "../repositories/auth-repository.js"
import { MailboxRepository } from "../repositories/mailbox-repository.js"

import { AuthService } from "./auth-service.js"
import { MailboxService } from "./mailbox-service.js"

export function createMailboxService(
  database: Kysely<unknown>,
  config: ServerConfig
) {
  return new MailboxService(new MailboxRepository(database), config, database)
}

export function createAuthService(
  database: Kysely<unknown>,
  config: ServerConfig
) {
  return new AuthService(
    new AuthRepository(database),
    createMailboxService(database, config),
    config
  )
}
