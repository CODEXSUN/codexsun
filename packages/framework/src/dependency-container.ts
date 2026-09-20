export interface DependencyResolver {
  require<T>(key: string): T;
}

export type DependencyFactory<T> = (resolver: DependencyResolver) => T;
export type DependencyLifetime = "singleton" | "scoped";

interface Registration {
  readonly factory?: DependencyFactory<unknown>;
  readonly lifetime: DependencyLifetime;
  readonly value?: unknown;
}

class DependencyResolutionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DependencyResolutionError";
  }
}

export class DependencyContainer implements DependencyResolver {
  private readonly registrations = new Map<string, Registration>();
  private readonly resolved = new Map<string, unknown>();
  private readonly resolving = new Set<string>();

  provide<T>(key: string, value: T): void {
    this.register(key, { lifetime: "singleton", value });
  }

  provideFactory<T>(key: string, factory: DependencyFactory<T>): void {
    this.register(key, { factory, lifetime: "singleton" });
  }

  provideScopedFactory<T>(key: string, factory: DependencyFactory<T>): void {
    this.register(key, { factory, lifetime: "scoped" });
  }

  require<T>(key: string): T {
    if (this.resolved.has(key)) return this.resolved.get(key) as T;
    const registration = this.registrations.get(key);
    if (!registration) throw new Error(`Provider value is unavailable: ${key}`);
    if (registration.lifetime === "scoped") {
      throw new Error(`Provider value requires a scope: ${key}`);
    }

    const value = this.resolve(key, registration, this);
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

  resolveInScope<T>(key: string, scope: DependencyScope): T {
    const registration = this.registrations.get(key);
    if (!registration) throw new Error(`Provider value is unavailable: ${key}`);
    if (registration.lifetime === "singleton") return this.require<T>(key);
    return this.resolve(key, registration, scope) as T;
  }

  private resolve(key: string, registration: Registration, resolver: DependencyResolver): unknown {
    if (!registration.factory) return registration.value;
    if (this.resolving.has(key)) {
      throw new DependencyResolutionError(`Provider factory dependency cycle: ${[...this.resolving, key].join(" -> ")}`);
    }

    this.resolving.add(key);
    try {
      return registration.factory(resolver);
    } catch (error) {
      if (error instanceof DependencyResolutionError) throw error;
      throw new Error(`Provider factory failed: ${key}`, { cause: error });
    } finally {
      this.resolving.delete(key);
    }
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
    if (this.values.has(key)) return this.values.get(key) as T;
    if (this.parent instanceof DependencyContainer) {
      const value = this.parent.resolveInScope<T>(key, this);
      this.values.set(key, value);
      return value;
    }
    return this.parent.require<T>(key);
  }
}
