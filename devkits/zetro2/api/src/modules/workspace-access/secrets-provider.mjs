// Zetro2 Secrets Provider
// Resolves application secrets from environment without logging or leaking credentials

export class ZetroSecretsProvider {
  #environment;
  #defaultJwtSecret;

  constructor(env = process.env, options = {}) {
    this.#environment = env;
    this.#defaultJwtSecret = options.defaultJwtSecret || 'zetro2-development-only-secret-do-not-use-in-production';
  }

  getSecret(key, defaultValue = undefined) {
    return this.#environment[key] ?? defaultValue;
  }

  getRequiredSecret(key) {
    const value = this.#environment[key];
    if (!value) {
      throw new Error(`Missing required secret or environment variable: ${key}`);
    }
    return value;
  }

  getJwtSecret() {
    return this.#environment.ZETRO2_JWT_SECRET
      ?? this.#environment.PLATFORM_JWT_SECRET
      ?? this.#defaultJwtSecret;
  }

  getDatabaseUrl() {
    return this.#environment.ZETRO2_DATABASE_URL
      ?? this.#environment.DATABASE_URL
      ?? 'file:storage/apps/private/zetro2/database.sqlite';
  }

  getStorageRoot() {
    return this.#environment.ZETRO2_STORAGE_ROOT
      ?? 'storage/apps/private/zetro2';
  }

  redact(text) {
    if (typeof text !== 'string') return text;
    let redacted = text;
    for (const [key, val] of Object.entries(this.#environment)) {
      if (!val || typeof val !== 'string' || val.length < 4) continue;
      const upper = key.toUpperCase();
      if (
        upper.includes('SECRET') ||
        upper.includes('KEY') ||
        upper.includes('TOKEN') ||
        upper.includes('PASSWORD') ||
        upper.includes('CREDENTIAL')
      ) {
        redacted = redacted.replaceAll(val, '[REDACTED]');
      }
    }
    return redacted;
  }

  toJSON() {
    return { provider: 'ZetroSecretsProvider', status: 'active', redacted: true };
  }
}

export function createSecretsProvider(env = process.env, options = {}) {
  return new ZetroSecretsProvider(env, options);
}
