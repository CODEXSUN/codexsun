export type AuthNavigationState = {
  from?: string | {
    pathname?: string
    search?: string
    hash?: string
  }
}

const REQUESTED_PATH_KEY = 'codexsun.auth.requested-path'

function readRequestedPath() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.localStorage.getItem(REQUESTED_PATH_KEY)
}

export function rememberRequestedPath(path: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(REQUESTED_PATH_KEY, path)
}

export function clearRequestedPath() {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem(REQUESTED_PATH_KEY)
}

function toRequestedPath(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as { pathname?: unknown; search?: unknown; hash?: unknown }
  if (typeof candidate.pathname !== 'string') {
    return null
  }

  const search = typeof candidate.search === 'string' ? candidate.search : ''
  const hash = typeof candidate.hash === 'string' ? candidate.hash : ''
  return `${candidate.pathname}${search}${hash}`
}

export function getAuthNavigationState(state: unknown): AuthNavigationState | null {
  if (!state || typeof state !== 'object') {
    return null
  }

  const candidate = state as { from?: unknown }
  if (typeof candidate.from === 'string') {
    return { from: candidate.from }
  }

  if (candidate.from && typeof candidate.from === 'object') {
    return { from: candidate.from as AuthNavigationState['from'] }
  }

  return {}
}

export function getRequestedPath(state: unknown, fallback: string | null = null) {
  const navigationState = getAuthNavigationState(state)
  return toRequestedPath(navigationState?.from) ?? readRequestedPath() ?? fallback
}
