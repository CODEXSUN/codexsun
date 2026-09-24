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
    const sensitiveKeys = ['ZETRO2_JWT_SECRET', 'PLATFORM_JWT_SECRET', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY'];
    for (const key of sensitiveKeys) {
      const val = this.#environment[key];
      if (val && val.length > 4) {
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
