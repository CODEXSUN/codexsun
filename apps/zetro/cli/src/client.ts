import { writeFile } from 'node:fs/promises'

export interface ZetroClientOptions {
  apiUrl: string
  sessionToken?: string
}

export interface ZetroCliApi {
  download(path: string, output: string): Promise<{ output: string; size: number }>
  get(path: string): Promise<unknown>
  post(path: string, body?: unknown): Promise<unknown>
}

export class ZetroCliClient implements ZetroCliApi {
  public constructor(private readonly options: ZetroClientOptions) {}

  public get(path: string): Promise<unknown> {
    return this.request(path)
  }

  public post(path: string, body?: unknown): Promise<unknown> {
    return this.request(path, {
      body: body === undefined ? undefined : JSON.stringify(body),
      method: 'POST',
    })
  }

  public async download(path: string, output: string): Promise<{ output: string; size: number }> {
    const response = await fetch(this.url(path), { headers: this.headers() })
    if (!response.ok) throw new Error(await readError(response))
    const data = Buffer.from(await response.arrayBuffer())
    await writeFile(output, data)
    return { output, size: data.byteLength }
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const headers = this.headers(init.body ? { 'Content-Type': 'application/json' } : undefined)
    const response = await fetch(this.url(path), { ...init, headers })
    const text = await response.text()
    const payload = text ? parseJson(text) : null
    if (!response.ok) throw new Error(readPayloadError(payload, response.status))
    return payload
  }

  private headers(extra?: HeadersInit): Headers {
    const headers = new Headers(extra)
    if (this.options.sessionToken) {
      headers.set('X-Zetro-Session-Token', this.options.sessionToken)
    }
    return headers
  }

  private url(path: string): string {
    return `${this.options.apiUrl.replace(/\/$/u, '')}${path}`
  }
}

async function readError(response: Response): Promise<string> {
  const text = await response.text()
  return readPayloadError(text ? parseJson(text) : null, response.status)
}

function readPayloadError(payload: unknown, status: number): string {
  return typeof payload === 'object' &&
    payload &&
    'error' in payload &&
    typeof payload.error === 'string'
    ? payload.error
    : `Zetro API returned HTTP ${status}.`
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown
  } catch {
    throw new Error('Zetro API returned an invalid response.')
  }
}
