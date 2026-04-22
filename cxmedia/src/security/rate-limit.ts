type RateLimitEntry = {
  count: number
  resetAt: number
}

export class RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>()

  constructor(
    private readonly options: {
      windowMs: number
      maxRequests: number
    }
  ) {}

  check(key: string) {
    const now = Date.now()
    const entry = this.entries.get(key)

    if (!entry || entry.resetAt <= now) {
      const nextEntry = {
        count: 1,
        resetAt: now + this.options.windowMs,
      }
      this.entries.set(key, nextEntry)

      return {
        allowed: true,
        remaining: this.options.maxRequests - 1,
        resetAt: nextEntry.resetAt,
      }
    }

    if (entry.count >= this.options.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      }
    }

    entry.count += 1
    this.entries.set(key, entry)

    return {
      allowed: true,
      remaining: Math.max(this.options.maxRequests - entry.count, 0),
      resetAt: entry.resetAt,
    }
  }
}
