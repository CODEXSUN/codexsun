import { invoke } from '@tauri-apps/api/core'

interface DesktopStatus {
  sessionToken: string
}

let desktopToken: Promise<string | null> | null = null

export async function zetroFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const token = await getDesktopSessionToken()
  if (token) headers.set('X-Zetro-Session-Token', token)
  return fetch(input, { ...init, headers })
}

function getDesktopSessionToken(): Promise<string | null> {
  if (!desktopToken) desktopToken = readDesktopSessionToken()
  return desktopToken
}

async function readDesktopSessionToken(): Promise<string | null> {
  if (!('__TAURI_INTERNALS__' in window)) return null
  const status = await invoke<DesktopStatus>('desktop_status')
  return status.sessionToken || null
}
