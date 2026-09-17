import { DatabaseSync, type SQLInputValue, type StatementSync } from "node:sqlite";
import { Kysely, SqliteDialect, type SqliteDatabase, type SqliteStatement } from "kysely";
import { KyselyDataProvider } from "./kysely-data-provider.js";

export interface SqliteDataProviderOptions {
  readonly filename: string;
}

export function createSqliteDataProvider<TDatabase>(options: SqliteDataProviderOptions): KyselyDataProvider<TDatabase> {
  if (!options.filename.trim()) throw new Error("SQLite requires a database filename.");

  const database = new DatabaseSync(options.filename);
  configureDatabase(database);
  const dialect = new SqliteDialect({ database: new NodeSqliteDatabase(database) });
  return new KyselyDataProvider(new Kysely<TDatabase>({ dialect }));
}

class NodeSqliteDatabase implements SqliteDatabase {
  constructor(private readonly database: DatabaseSync) {}

  close(): void {
    this.database.close();
  }

  prepare(sql: string): SqliteStatement {
    return new NodeSqliteStatement(this.database.prepare(sql));
  }
}

class NodeSqliteStatement implements SqliteStatement {
  constructor(private readonly statement: StatementSync) {}

  get reader(): boolean {
    return this.statement.columns().length > 0;
  }

  all(parameters: ReadonlyArray<unknown>): unknown[] {
    return this.statement.all(...sqliteParameters(parameters));
  }

  run(parameters: ReadonlyArray<unknown>): { changes: number | bigint; lastInsertRowid: number | bigint } {
    const result = this.statement.run(...sqliteParameters(parameters));
    return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
  }

  iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown> {
    return this.statement.iterate(...sqliteParameters(parameters)) as IterableIterator<unknown>;
  }
}

function configureDatabase(database: DatabaseSync): void {
  database.exec("PRAGMA foreign_keys = ON");
  database.exec("PRAGMA journal_mode = WAL");
  database.exec("PRAGMA busy_timeout = 5000");
}

function sqliteParameters(parameters: ReadonlyArray<unknown>): SQLInputValue[] {
  return parameters as SQLInputValue[];
}
