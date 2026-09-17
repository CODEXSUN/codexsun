import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createSqliteDataProvider } from "@codexsun/platform-core";
import type { ZetroSqliteReadiness as ZetroSqliteReadinessContract } from "@codexsun/zetro-contracts";
import { sql } from "kysely";

type ZetroSqliteDatabase = Record<string, never>;

export class ZetroSqliteReadiness implements ZetroSqliteReadinessContract {
  constructor(private readonly databasePath: string) {}

  async check(): Promise<boolean> {
    this.createParentDirectory();
    const provider = createSqliteDataProvider<ZetroSqliteDatabase>({ filename: this.databasePath });

    try {
      const result = await sql<{ value: number }>`SELECT 1 AS value`.execute(provider.queryDatabase());
      return result.rows[0]?.value === 1;
    } finally {
      await provider.destroy();
    }
  }

  private createParentDirectory(): void {
    if (this.databasePath === ":memory:") return;
    mkdirSync(dirname(this.databasePath), { recursive: true });
  }
}
