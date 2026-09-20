export type DatabaseDriver = "mariadb" | "sqlite";

export interface MariaDbEnvironmentConfiguration {
  readonly driver: "mariadb";
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  readonly masterName: string;
}

/** Builds a mysql:// URL from shared DB_* settings without leaking credentials in errors. */
export function buildMariaDbConnectionUrl(configuration: MariaDbEnvironmentConfiguration): string {
  validateMariaDbConfiguration(configuration);
  const url = new URL("mysql://localhost");
  url.hostname = configuration.host;
  url.port = String(configuration.port);
  url.username = configuration.user;
  url.password = configuration.password;
  url.pathname = `/${encodeURIComponent(configuration.masterName)}`;
  return url.toString();
}

/** Uses DATABASE_URL when set, otherwise resolves the shared DB_* configuration. */
export function readDatabaseConnectionUrl(environment: NodeJS.ProcessEnv, fallback = "sqlite://local"): string {
  const explicit = environment.DATABASE_URL?.trim();
  if (explicit) return explicit;

  const driver = environment.DB_DRIVER?.trim().toLowerCase();
  if (!driver) return fallback;
  if (driver === "sqlite") return fallback;
  if (driver !== "mariadb") throw new Error("DB_DRIVER must be sqlite or mariadb.");

  return buildMariaDbConnectionUrl({
    driver,
    host: requiredEnvironment(environment, "DB_HOST"),
    port: readPort(environment.DB_PORT),
    user: requiredEnvironment(environment, "DB_USER"),
    password: requiredEnvironment(environment, "DB_PASSWORD"),
    masterName: requiredEnvironment(environment, "DB_MASTER_NAME"),
  });
}

function validateMariaDbConfiguration(configuration: MariaDbEnvironmentConfiguration): void {
  if (configuration.driver !== "mariadb") throw new Error("DB_DRIVER must be mariadb.");
  if (!configuration.host.trim()) throw new Error("DB_HOST is required.");
  if (!configuration.user.trim()) throw new Error("DB_USER is required.");
  if (!configuration.password) throw new Error("DB_PASSWORD is required.");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/u.test(configuration.masterName)) {
    throw new Error("DB_MASTER_NAME must contain only letters, numbers, underscores, or hyphens.");
  }
  if (!Number.isInteger(configuration.port) || configuration.port < 1 || configuration.port > 65_535) {
    throw new Error("DB_PORT must be an integer between 1 and 65535.");
  }
}

function requiredEnvironment(environment: NodeJS.ProcessEnv, name: string): string {
  const value = environment[name]?.trim();
  if (!value) throw new Error(`${name} is required when DB_DRIVER=mariadb.`);
  return value;
}

function readPort(value: string | undefined): number {
  const port = Number(value);
  if (!Number.isInteger(port)) throw new Error("DB_PORT must be an integer between 1 and 65535.");
  return port;
}
