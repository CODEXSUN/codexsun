export class ServiceContainer {
  private values = new Map<string, unknown>()

  register<T>(token: string, value: T) {
    this.values.set(token, value)
    return this
  }

  resolve<T>(token: string): T {
    if (!this.values.has(token)) {
      throw new Error(`Missing service registration for token: ${token}`)
    }

    return this.values.get(token) as T
  }
}
