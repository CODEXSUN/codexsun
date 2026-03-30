export function renderTemplateString(
  template: string | null,
  data: Record<string, unknown>
) {
  if (!template) {
    return null
  }

  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_, key: string) => {
    const value = data[key]
    return value === undefined || value === null ? "" : String(value)
  })
}
