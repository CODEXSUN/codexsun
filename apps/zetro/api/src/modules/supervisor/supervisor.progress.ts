import type { ChatTurnRequest } from '../chat/index.js'
import type { SystemTaskContext } from '../system-tasks/index.js'

/** Bounded, coalesced public progress. Never persist raw provider notifications. */
export class SupervisorProgress {
  private readonly tools = new Map<string, unknown>()
  private response = ''
  private dirty = false
  private writes: Promise<void> = Promise.resolve()
  private failure: unknown
  private readonly timer: NodeJS.Timeout

  constructor(private readonly context: SystemTaskContext) {
    this.timer = setInterval(() => this.flush(), 2000)
    this.timer.unref()
  }

  readonly receive: NonNullable<ChatTurnRequest['onProgress']> = (event) => {
    if (event.kind === 'response') this.response = redact(event.text).slice(-8000)
    else {
      this.tools.set(event.itemId, {
        ...event.activity,
        itemId: event.itemId,
        label: redact(event.activity.label),
        details: undefined,
      })
      if (this.tools.size > 40) this.tools.delete(this.tools.keys().next().value!)
    }
    this.dirty = true
  }

  async close(): Promise<void> {
    clearInterval(this.timer)
    this.flush()
    await this.writes
    if (this.failure)
      throw new Error('Live progress could not be recorded. Inspect the saved conversation.')
  }

  private flush(): void {
    if (!this.dirty || this.failure) return
    this.dirty = false
    const message = `zetro.progress.v1:${JSON.stringify({ response: this.response, activities: [...this.tools.values()] })}`
    this.writes = this.writes
      .then(() => this.context.step('info', message))
      .catch((error) => {
        this.failure = error
      })
  }
}

function redact(text: string): string {
  return text
    .replace(/(authorization|api[-_]?key|password|token)\s*[:=]\s*[^\s]+/giu, '$1=[redacted]')
    .replace(/https?:\/\/[^\s:@]+:[^\s@]+@/gu, 'https://[redacted]@')
}
