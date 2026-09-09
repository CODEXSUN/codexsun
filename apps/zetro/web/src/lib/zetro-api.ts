import { invoke } from '@tauri-apps/api/core'

interface DesktopStatus {
  apiUrl: string
  sessionToken: string
}

let desktopStatus: Promise<DesktopStatus | null> | null = null

export async function zetroFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers)
  const status = await getDesktopStatus()
  if (status?.sessionToken) headers.set('X-Zetro-Session-Token', status.sessionToken)
  return fetch(status ? useDesktopApi(input, status.apiUrl) : input, { ...init, headers })
}

function getDesktopStatus(): Promise<DesktopStatus | null> {
  if (!desktopStatus) desktopStatus = readDesktopStatus()
  return desktopStatus
}

async function readDesktopStatus(): Promise<DesktopStatus | null> {
  if (!('__TAURI_INTERNALS__' in window)) return null
  return invoke<DesktopStatus>('desktop_status')
}

function useDesktopApi(input: RequestInfo | URL, apiUrl: string): RequestInfo | URL {
  const originalUrl = input instanceof Request ? input.url : input.toString()
  const requestUrl = new URL(originalUrl, window.location.origin)
  const desktopUrl = new URL(apiUrl)
  requestUrl.protocol = desktopUrl.protocol
  requestUrl.host = desktopUrl.host
  return input instanceof Request ? new Request(requestUrl, input) : requestUrl
}
