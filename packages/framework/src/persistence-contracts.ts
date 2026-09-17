export interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | undefined>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
}

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export type TransactionWork<T> = (transaction: Transaction) => Promise<T>;

export interface UnitOfWork {
  execute<T>(work: TransactionWork<T>): Promise<T>;
}

export interface MigrationDescriptor {
  readonly id: string;
  readonly owner: string;
  readonly description: string;
  apply(transaction: Transaction): Promise<void>;
  revert?(transaction: Transaction): Promise<void>;
}

export interface SeederDescriptor {
  readonly id: string;
  readonly owner: string;
  readonly description: string;
  seed(transaction: Transaction): Promise<void>;
}

export async function executeTransaction<T>(transaction: Transaction, work: TransactionWork<T>): Promise<T> {
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}
