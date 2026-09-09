export interface PlatformReadinessProbe {
  check(): Promise<void>
  failureMessage?: string
  moduleId: string
  name: string
  timeoutMs?: number
}

export interface PlatformReadinessResult {
  message?: string
  moduleId: string
  name: string
  status: 'not-ready' | 'ready'
}

export interface PlatformReadinessRegistrar {
  register(probe: PlatformReadinessProbe): void
}

export class PlatformReadinessRegistry implements PlatformReadinessRegistrar {
  private readonly probes = new Map<string, PlatformReadinessProbe>()

  register(probe: PlatformReadinessProbe): void {
    validateProbe(probe)
    if (this.probes.has(probe.name)) {
      throw new Error(`The readiness probe "${probe.name}" is already registered.`)
    }
    this.probes.set(probe.name, Object.freeze({ ...probe }))
  }

  list(): readonly PlatformReadinessProbe[] {
    return [...this.probes.values()]
  }

  async checkAll(): Promise<readonly PlatformReadinessResult[]> {
    return Promise.all(this.list().map(runProbe))
  }
}

async function runProbe(probe: PlatformReadinessProbe): Promise<PlatformReadinessResult> {
  try {
    await withTimeout(probe.check(), probe.timeoutMs ?? 2_000, probe.name)
    return { moduleId: probe.moduleId, name: probe.name, status: 'ready' }
  } catch (error) {
    const timedOut = error instanceof ReadinessTimeoutError
    return {
      message: timedOut
        ? error.message
        : (probe.failureMessage ?? 'The dependency is unavailable.'),
      moduleId: probe.moduleId,
      name: probe.name,
      status: 'not-ready',
    }
  }
}

function validateProbe(probe: PlatformReadinessProbe): void {
  if (!probe.name.trim()) throw new Error('A readiness probe needs a name.')
  if (!probe.moduleId.trim()) throw new Error('A readiness probe needs a module owner.')
  if (
    probe.timeoutMs !== undefined &&
    (!Number.isInteger(probe.timeoutMs) || probe.timeoutMs < 1)
  ) {
    throw new Error('A readiness probe timeout must be a positive integer.')
  }
}

async function withTimeout<T>(action: Promise<T>, timeoutMs: number, name: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      action,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new ReadinessTimeoutError(name)), timeoutMs)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

class ReadinessTimeoutError extends Error {
  constructor(name: string) {
    super(`The ${name} readiness probe timed out.`)
  }
}
