import {
  KyselyTransactionProvider,
  type DatabaseProvider,
  type TransactionProvider,
} from "@codexsun/platform-core-api";
import { Kysely, MysqlDialect, sql, type Transaction } from "kysely";
import { createPool } from "mysql2";
import type { GarmentsEnvironment } from "../../config.js";

export type GarmentsMariaDbDatabase<TDatabase = Record<string, never>> = Kysely<TDatabase>;

export class GarmentsMariaDbDatabaseProvider<TDatabase = Record<string, never>> implements DatabaseProvider<
  GarmentsMariaDbDatabase<TDatabase>
> {
  readonly client: GarmentsMariaDbDatabase<TDatabase>;

  constructor(environment: GarmentsEnvironment) {
    this.client = new Kysely<TDatabase>({
      dialect: new MysqlDialect({
        pool: createPool({
          database: environment.DB_MASTER_NAME,
          host: environment.DB_HOST,
          password: environment.DB_PASSWORD,
          port: environment.DB_PORT,
          user: environment.DB_USER,
        }),
      }),
    });
  }

  async check(): Promise<void> {
    await sql`select 1 as health_check`.execute(this.client);
  }

  close(): Promise<void> {
    return this.client.destroy();
  }

  transaction(): TransactionProvider<Transaction<TDatabase>> {
    return new KyselyTransactionProvider(this.client);
  }
}
