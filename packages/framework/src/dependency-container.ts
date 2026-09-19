export interface DependencyResolver {
  require<T>(key: string): T;
}

export type DependencyFactory<T> = (resolver: DependencyResolver) => T;

interface Registration {
  readonly factory?: DependencyFactory<unknown>;
  readonly value?: unknown;
}

export class DependencyContainer implements DependencyResolver {
  private readonly registrations = new Map<string, Registration>();
  private readonly resolved = new Map<string, unknown>();

  provide<T>(key: string, value: T): void {
    this.register(key, { value });
  }

  provideFactory<T>(key: string, factory: DependencyFactory<T>): void {
    this.register(key, { factory });
  }

  require<T>(key: string): T {
    if (this.resolved.has(key)) return this.resolved.get(key) as T;
    const registration = this.registrations.get(key);
    if (!registration) throw new Error(`Provider value is unavailable: ${key}`);
    const value = registration.factory ? registration.factory(this) : registration.value;
    this.resolved.set(key, value);
    return value as T;
  }

  createScope(): DependencyScope {
    return new DependencyScope(this);
  }

  private register(key: string, registration: Registration): void {
    if (!key.trim()) throw new Error("Provider value requires a key.");
    if (this.registrations.has(key)) throw new Error(`Provider value already exists: ${key}`);
    this.registrations.set(key, registration);
  }
}

export class DependencyScope implements DependencyResolver {
  private readonly values = new Map<string, unknown>();

  constructor(private readonly parent: DependencyResolver) {}

  provide<T>(key: string, value: T): void {
    if (!key.trim()) throw new Error("Scoped value requires a key.");
    if (this.values.has(key)) throw new Error(`Scoped value already exists: ${key}`);
    this.values.set(key, value);
  }

  require<T>(key: string): T {
    return (this.values.has(key) ? this.values.get(key) : this.parent.require<T>(key)) as T;
  }
}
