import { z } from 'zod'

export class PlatformConfiguration<TValues extends Record<string, unknown>> {
  private constructor(private readonly configuration: Readonly<TValues>) {}

  static parse<TValues extends Record<string, unknown>>(
    schema: z.ZodType<TValues>,
    source: unknown,
  ): PlatformConfiguration<TValues> {
    return new PlatformConfiguration(Object.freeze(schema.parse(source)))
  }

  get values(): Readonly<TValues> {
    return this.configuration
  }

  publicValues<TKey extends keyof TValues>(keys: readonly TKey[]): Readonly<Pick<TValues, TKey>> {
    const selected = Object.fromEntries(keys.map((key) => [key, this.configuration[key]]))
    return Object.freeze(selected) as Readonly<Pick<TValues, TKey>>
  }
}
