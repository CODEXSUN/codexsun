import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { KyselyDataProvider } from "./kysely-data-provider.js";

export interface MariaDbDataProviderOptions {
  readonly connectionUrl: string;
}

export function createMariaDbDataProvider<TDatabase>(
  options: MariaDbDataProviderOptions,
): KyselyDataProvider<TDatabase> {
  validateConnectionUrl(options.connectionUrl);
  // mysql2 and Kysely use compatible runtime pools with different declarations.
  const pool = createPool(options.connectionUrl) as unknown as ConstructorParameters<typeof MysqlDialect>[0]["pool"];
  const dialect = new MysqlDialect({ pool });
  return new KyselyDataProvider(new Kysely<TDatabase>({ dialect }));
}

function validateConnectionUrl(connectionUrl: string): void {
  if (!connectionUrl.trim()) throw new Error("MariaDB requires a connection URL.");

  const url = new URL(connectionUrl);
  if (url.protocol !== "mysql:") {
    throw new Error("MariaDB requires a mysql:// connection URL.");
  }
  if (!url.hostname) throw new Error("MariaDB connection URL requires a host.");
  if (url.pathname === "/" || !url.pathname) {
    throw new Error("MariaDB connection URL requires a database name.");
  }
}
