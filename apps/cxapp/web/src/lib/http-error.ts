export function formatHttpErrorMessage(
  payload: { error?: string; message?: string; detail?: string } | null,
  status: number
) {
  const primary = payload?.error ?? payload?.message ?? `Request failed with status ${status}.`
  const detail = payload?.detail?.trim()

  if (!detail || detail === primary) {
    return primary
  }

  return `${primary} ${detail}`
}
