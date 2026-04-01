export interface ApiHealthPayload {
  app: string
  status: 'ok'
  timestamp: string
}

const customApiBaseUrl = (import.meta.env.VITE_CUSTOM_API_URL ?? 'http://127.0.0.1:4101').replace(/\/$/, '')

export async function fetchApiHealth(): Promise<ApiHealthPayload> {
  const response = await fetch(`${customApiBaseUrl}/health`)
  if (!response.ok) {
    throw new Error(`Health request failed with status ${response.status}.`)
  }

  return response.json() as Promise<ApiHealthPayload>
}
