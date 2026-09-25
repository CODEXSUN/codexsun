// Workspace Access Store Factory and Lifecycle Manager
// Coordinates data provider initialization, checksummed migrations, repeat-safe seeders, and repository instantiation

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
  createSqliteDataProvider,
  createMariaDbDataProvider,
  MigrationRunner,
} from '@codexsun/platform-core';
import { workspaceAccessLifecyclePlan } from './workspace-access-lifecycle-plan.mjs';
import { WorkspaceAccessRepository } from './workspace-access.repository.mjs';

export class WorkspaceAccessStore {
  #provider;
  #database;
  #repository;
  #runner;
  #secretsProvider;

  constructor(provider, secretsProvider = null) {
    this.#provider = provider;
    this.#database = provider.queryDatabase();
    this.#secretsProvider = secretsProvider;
    this.#repository = new WorkspaceAccessRepository(this.#database, this.#secretsProvider);
    this.#runner = new MigrationRunner(this.#database);
  }

  get database() {
    return this.#database;
  }

  get repository() {
    return this.#repository;
  }

  get runner() {
    return this.#runner;
  }

  async initialize() {
    return this.#runner.run(workspaceAccessLifecyclePlan);
  }

  async verify() {
    return this.#runner.verify(workspaceAccessLifecyclePlan);
  }

  async close() {
    await this.#provider.destroy();
  }
}

export async function createWorkspaceAccessStore(options = {}) {
  const {
    connectionUrl,
    sqliteFilename = ':memory:',
    storageProvider,
    secretsProvider,
  } = options;

  let provider;
  if (connectionUrl && connectionUrl.startsWith('mysql:')) {
    provider = createMariaDbDataProvider({ connectionUrl });
  } else {
    let filename = sqliteFilename;
    if (storageProvider && sqliteFilename === ':memory:') {
      filename = storageProvider.getDatabasePath();
    }
    if (filename !== ':memory:') {
      mkdirSync(dirname(filename), { recursive: true });
    }
    provider = createSqliteDataProvider({ filename });
  }

  const store = new WorkspaceAccessStore(provider, secretsProvider);
  await store.initialize();
  return store;
}
