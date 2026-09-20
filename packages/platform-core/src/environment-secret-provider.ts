import type { SecretProvider } from "@codexsun/framework";

/** Resolves named secret references through an explicit environment-variable map. */
export class EnvironmentSecretProvider implements SecretProvider {
  constructor(
    private readonly references: Readonly<Record<string, string>>,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {}

  async resolve(reference: string): Promise<string | undefined> {
    const variable = Object.hasOwn(this.references, reference) ? this.references[reference] : undefined;
    if (!variable) return undefined;
    const value = this.environment[variable];
    return value?.length ? value : undefined;
  }
}
