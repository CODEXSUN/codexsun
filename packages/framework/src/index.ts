export type ProviderLifecycleStage = "register" | "start" | "stop";
export type ProviderRuntimeState = "registered" | "starting" | "started" | "stopping" | "stopped" | "failed";

export interface ProviderReadiness {
  readonly id: string;
  readonly state: ProviderRuntimeState;
}

export * from "./contracts.js";
export * from "./persistence-contracts.js";

export interface ProviderManifest {
  readonly id: string;
  readonly owner: string;
  readonly version: string;
  readonly dependencies: readonly string[];
  readonly contracts: readonly string[];
  readonly events: ProviderEvents;
}

export interface ProviderEvents {
  readonly published: readonly string[];
  readonly consumed: readonly string[];
}

export interface ModuleProvider {
  readonly manifest: ProviderManifest;
  register(context: ProviderRegistrationContext): void;
  start?(context: ProviderLifecycleContext): void;
  stop?(context: ProviderLifecycleContext): void;
}

interface RegisteredProvider {
  readonly provider: ModuleProvider;
  readonly manifest: ProviderManifest;
}

export class ProviderLifecycleError extends Error {
  constructor(
    readonly providerId: string,
    readonly stage: ProviderLifecycleStage,
    cause: unknown,
  ) {
    super(`Provider ${providerId} failed during ${stage}.`, { cause });
    this.name = "ProviderLifecycleError";
  }
}

export class ProviderRegistrationContext {
  constructor(
    private readonly engine: ProviderEngine,
    readonly manifest: ProviderManifest,
  ) {}

  provide<T>(key: string, value: T): void {
    this.engine.provide(key, value);
  }

  require<T>(key: string): T {
    return this.engine.require<T>(key);
  }
}

export class ProviderLifecycleContext extends ProviderRegistrationContext {}

export class ProviderEngine {
  private readonly providers = new Map<string, RegisteredProvider>();
  private readonly providerStates = new Map<string, ProviderRuntimeState>();
  private readonly values = new Map<string, unknown>();
  private readonly startedProviderIds: string[] = [];
  private started = false;

  register(provider: ModuleProvider): void {
    if (this.started) throw new Error("Providers cannot register after the engine starts.");

    const manifest = validateManifest(provider.manifest);
    if (this.providers.has(manifest.id)) {
      throw new Error(`Provider already exists: ${manifest.id}`);
    }

    this.runLifecycle(manifest, "register", () => {
      provider.register(new ProviderRegistrationContext(this, manifest));
    });
    this.providers.set(manifest.id, { provider, manifest });
    this.providerStates.set(manifest.id, "registered");
  }

  start(): void {
    if (this.started) return;

    try {
      for (const providerId of this.resolveProviderOrder()) {
        const registered = this.providers.get(providerId);
        if (!registered) continue;
        const { manifest, provider } = registered;
        this.providerStates.set(providerId, "starting");
        try {
          this.runLifecycle(manifest, "start", () => {
            provider.start?.(new ProviderLifecycleContext(this, manifest));
          });
        } catch (error) {
          this.providerStates.set(providerId, "failed");
          throw error;
        }
        this.providerStates.set(providerId, "started");
        this.startedProviderIds.push(providerId);
      }
    } catch (error) {
      this.stopStartedProviders();
      throw error;
    }

    this.started = true;
  }

  stop(): void {
    if (!this.started) return;

    this.stopStartedProviders();
    this.started = false;
  }

  private stopStartedProviders(): void {
    let firstFailure: unknown;

    for (const providerId of [...this.startedProviderIds].reverse()) {
      const registered = this.providers.get(providerId);
      if (!registered) continue;

      this.providerStates.set(providerId, "stopping");
      if (!registered.provider.stop) {
        this.providerStates.set(providerId, "stopped");
        continue;
      }

      try {
        this.runLifecycle(registered.manifest, "stop", () => {
          registered.provider.stop?.(new ProviderLifecycleContext(this, registered.manifest));
        });
        this.providerStates.set(providerId, "stopped");
      } catch (error) {
        this.providerStates.set(providerId, "failed");
        firstFailure ??= error;
      }
    }

    this.startedProviderIds.length = 0;
    if (firstFailure) throw firstFailure;
  }

  provide<T>(key: string, value: T): void {
    if (this.values.has(key)) throw new Error(`Provider value already exists: ${key}`);
    this.values.set(key, value);
  }

  require<T>(key: string): T {
    const value = this.values.get(key);
    if (value === undefined) throw new Error(`Provider value is unavailable: ${key}`);
    return value as T;
  }

  ids(): string[] {
    return [...this.providers.keys()].sort();
  }

  readiness(): ProviderReadiness[] {
    return this.ids().map((id) => ({ id, state: this.providerStates.get(id) ?? "failed" }));
  }

  isReady(): boolean {
    return this.providerStates.size > 0 && this.readiness().every((provider) => provider.state === "started");
  }

  private runLifecycle(manifest: ProviderManifest, stage: ProviderLifecycleStage, action: () => void): void {
    try {
      action();
    } catch (error) {
      throw new ProviderLifecycleError(manifest.id, stage, error);
    }
  }

  private resolveProviderOrder(): string[] {
    const resolved: string[] = [];
    const states = new Map<string, "visiting" | "visited">();
    const path: string[] = [];

    const visit = (providerId: string): void => {
      const state = states.get(providerId);
      if (state === "visited") return;
      if (state === "visiting") {
        const cycle = [...path.slice(path.indexOf(providerId)), providerId].join(" -> ");
        throw new Error(`Provider dependency cycle: ${cycle}`);
      }

      const registered = this.providers.get(providerId);
      if (!registered) throw new Error(`Provider is unavailable: ${providerId}`);

      states.set(providerId, "visiting");
      path.push(providerId);
      for (const dependencyId of registered.manifest.dependencies) {
        if (!this.providers.has(dependencyId)) {
          throw new Error(`Provider ${providerId} requires unavailable provider: ${dependencyId}`);
        }
        visit(dependencyId);
      }
      path.pop();
      states.set(providerId, "visited");
      resolved.push(providerId);
    };

    for (const providerId of this.providers.keys()) visit(providerId);
    return resolved;
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

function validateManifest(manifest: ProviderManifest): ProviderManifest {
  if (!manifest.id.trim()) throw new Error("Provider manifest requires an ID.");
  if (!manifest.owner.trim()) throw new Error(`Provider ${manifest.id} requires an owner.`);
  if (!/^\d+\.\d+\.\d+$/u.test(manifest.version)) {
    throw new Error(`Provider ${manifest.id} has an invalid version.`);
  }

  return {
    id: manifest.id,
    owner: manifest.owner,
    version: manifest.version,
    dependencies: [...new Set(manifest.dependencies)].sort(),
    contracts: [...new Set(manifest.contracts)].sort(),
    events: {
      published: normalizeEventNames(manifest.id, "published", manifest.events.published),
      consumed: normalizeEventNames(manifest.id, "consumed", manifest.events.consumed),
    },
  };
}

function normalizeEventNames(providerId: string, direction: string, events: readonly string[]): string[] {
  if (!Array.isArray(events)) throw new Error(`Provider ${providerId} requires ${direction} event declarations.`);
  if (events.some((event) => !event.trim())) {
    throw new Error(`Provider ${providerId} has an empty ${direction} event declaration.`);
  }

  return [...new Set(events)].sort();
}
