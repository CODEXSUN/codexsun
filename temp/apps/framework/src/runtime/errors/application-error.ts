export class ApplicationError extends Error {
  constructor(
    message: string,
    readonly context: Record<string, unknown> = {},
    readonly statusCode = 500,
  ) {
    super(message)
    this.name = 'ApplicationError'
  }
}
