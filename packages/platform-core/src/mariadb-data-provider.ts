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
  const dialect = new MysqlDialect({ pool: createPool(options.connectionUrl) });
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
