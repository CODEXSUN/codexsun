import type { Session } from "./types"

const storageKey = "cxmedia.session"

export function readSession() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "null") as Session | null
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(storageKey, JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem(storageKey)
}
