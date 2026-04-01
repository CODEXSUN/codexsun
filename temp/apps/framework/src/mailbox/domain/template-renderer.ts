export function renderTemplateString(template: string | null | undefined, data: Record<string, unknown>) {
  if (!template) {
    return null
  }

  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key: string) => {
    const value = key.split('.').reduce<unknown>((current, segment) => {
      if (current && typeof current === 'object' && segment in current) {
        return (current as Record<string, unknown>)[segment]
      }

      return undefined
    }, data)

    if (value == null) {
      return ''
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
      return String(value)
    }

    if (value instanceof Date) {
      return value.toISOString()
    }

    return ''
  })
}
