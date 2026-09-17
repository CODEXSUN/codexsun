export interface ModuleProvider {
  id: string;
  register(engine: ProviderEngine): void;
}

export class ProviderEngine {
  private readonly values = new Map<string, unknown>();
  register(provider: ModuleProvider): void {
    provider.register(this);
  }
  provide<T>(key: string, value: T): void {
    if (this.values.has(key)) throw new Error(`Provider already exists: ${key}`);
    this.values.set(key, value);
  }
  require<T>(key: string): T {
    const value = this.values.get(key);
    if (value === undefined) throw new Error(`Provider is unavailable: ${key}`);
    return value as T;
  }
  ids(): string[] {
    return [...this.values.keys()].sort();
  }
}

export class EnvironmentProvider {
  constructor(private readonly values: NodeJS.ProcessEnv) {}
  require(name: string): string {
    const value = this.values[name];
    if (!value) throw new Error(`Missing environment variable: ${name}`);
    return value;
  }
  optional(name: string, fallback: string): string {
    return this.values[name] ?? fallback;
  }
}

export interface DbConfig {
  url: string;
}
export class DbConfigProvider {
  constructor(readonly config: DbConfig) {}
}
export class DatabaseProvider {
  constructor(readonly config: DbConfigProvider) {}
  readiness(): string {
    return "configured";
  }
}
export class SettingsProvider {
  constructor(private readonly settings: Record<string, string>) {}
  get(name: string): string {
    return this.settings[name] ?? "";
  }
}
