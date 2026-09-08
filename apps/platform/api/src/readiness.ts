import type { ReadinessComponent } from '@codexsun/platform-contracts'

export interface ReadinessProbe {
  check(): Promise<void>
  name: string
}

export async function runReadinessProbes(
  probes: readonly ReadinessProbe[],
): Promise<readonly ReadinessComponent[]> {
  return Promise.all(
    probes.map(async (probe) => {
      try {
        await probe.check()
        return { name: probe.name, status: 'ready' as const }
      } catch {
        return {
          message: 'The dependency is unavailable.',
          name: probe.name,
          status: 'not-ready' as const,
        }
      }
    }),
  )
}
