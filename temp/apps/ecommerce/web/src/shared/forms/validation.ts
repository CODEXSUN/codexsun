import { HttpError } from '@/shared/api/client'

export type FieldErrors = Record<string, string>

export const warningCardClassName = 'border-destructive/40 bg-destructive/10 text-destructive dark:border-destructive/50 dark:bg-destructive/15 dark:text-destructive'

export function createFieldErrors() {
  return {} as FieldErrors
}

export function setFieldError(errors: FieldErrors, path: string, message: string) {
  if (!errors[path]) {
    errors[path] = message
  }
}

export function isBlank(value: string | null | undefined) {
  return !value || value.trim().length === 0
}

export function extractFieldErrors(error: unknown) {
  if (!(error instanceof HttpError) || !error.context || typeof error.context !== 'object') {
    return createFieldErrors()
  }

  const issues = (error.context as { issues?: { fieldErrors?: Record<string, string[]> } }).issues
  const fieldErrors = issues?.fieldErrors ?? {}
  const mappedErrors = createFieldErrors()

  for (const [key, values] of Object.entries(fieldErrors)) {
    const firstMessage = values.find(Boolean)
    if (firstMessage) {
      mappedErrors[key] = firstMessage
    }
  }

  return mappedErrors
}

export function inputErrorClassName(hasError: boolean) {
  return hasError
    ? 'border-destructive focus-visible:border-destructive/70 focus-visible:ring-destructive/25'
    : ''
}

export function summarizeFieldErrors(errors: FieldErrors) {
  return Object.values(errors).filter(Boolean)
}
