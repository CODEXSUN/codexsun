export type PlatformDiagnosticLevel = 'error' | 'info' | 'warn'

export interface PlatformDiagnosticEvent {
  code: string
  correlationId?: string
  details?: Readonly<Record<string, unknown>>
  level: PlatformDiagnosticLevel
  message: string
  moduleId?: string
  timestamp: string
}

export interface PlatformDiagnosticSink {
  report(event: PlatformDiagnosticEvent): void
}

export interface PlatformDiagnostics extends PlatformDiagnosticSink {
  list(): readonly PlatformDiagnosticEvent[]
}

export class PlatformDiagnosticRegistry implements PlatformDiagnosticSink {
  private readonly events: PlatformDiagnosticEvent[] = []

  constructor(private readonly capacity = 100) {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new Error('The diagnostic capacity must be a positive integer.')
    }
  }

  list(): readonly PlatformDiagnosticEvent[] {
    return this.events.map((event) => Object.freeze({ ...event }))
  }

  report(event: PlatformDiagnosticEvent): void {
    this.events.push(Object.freeze({ ...event }))
    if (this.events.length > this.capacity) this.events.shift()
  }
}
