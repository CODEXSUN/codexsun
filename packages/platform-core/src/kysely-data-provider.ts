import { executeTransaction, type Transaction, type TransactionWork, type UnitOfWork } from "@codexsun/framework";
import type { ControlledTransaction, Kysely, Transaction as KyselyTransactionDatabase } from "kysely";

export type KyselyTransactionWork<TDatabase, T> = (
  database: KyselyTransactionDatabase<TDatabase>,
  transaction: Transaction,
) => Promise<T>;

export class KyselyDataProvider<TDatabase> implements UnitOfWork {
  constructor(private readonly database: Kysely<TDatabase>) {}

  async execute<T>(work: TransactionWork<T>): Promise<T> {
    return this.executeWithDatabase(async (_database, transaction) => work(transaction));
  }

  async executeWithDatabase<T>(work: KyselyTransactionWork<TDatabase, T>): Promise<T> {
    const database = await this.database.startTransaction().execute();
    const transaction = new KyselyTransaction(database);
    return executeTransaction(transaction, (activeTransaction) => work(database, activeTransaction));
  }

  queryDatabase(): Kysely<TDatabase> {
    return this.database;
  }

  async destroy(): Promise<void> {
    await this.database.destroy();
  }
}

class KyselyTransaction<TDatabase> implements Transaction {
  constructor(private readonly transaction: ControlledTransaction<TDatabase>) {}

  async commit(): Promise<void> {
    await this.transaction.commit().execute();
  }

  async rollback(): Promise<void> {
    await this.transaction.rollback().execute();
  }
}
