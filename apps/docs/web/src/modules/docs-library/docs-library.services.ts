import {
  documentListResponseSchema,
  documentResponseSchema,
  documentUpdateResponseSchema,
  syncResponseSchema,
  type Document,
  type DocumentListResponse,
  type DocumentUpdateRequest,
} from '@codexsun/docs-contracts'

const localDocsApiUrl = 'http://127.0.0.1:6030'
const apiUrl = import.meta.env.VITE_DOCS_API_URL ?? localDocsApiUrl

function getApiUrl(): string {
  return apiUrl.replace(/\/$/, '')
}

export function getDocumentAssetUrl(path: string): string {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/')
  return `${getApiUrl()}/api/docs/v1/assets/${encodedPath}`
}

export async function fetchDocument(slug: string, signal?: AbortSignal): Promise<Document> {
  const response = await fetch(`${getApiUrl()}/api/docs/v1/documents/${slug}`, { signal })
  if (!response.ok) {
    throw new Error(`Could not load document (${response.status}).`)
  }

  return documentResponseSchema.parse(await response.json()).document
}

export async function fetchDocuments(signal?: AbortSignal): Promise<DocumentListResponse> {
  const response = await fetch(`${getApiUrl()}/api/docs/v1/documents`, { signal })
  if (!response.ok) {
    throw new Error(`Could not load Docs library (${response.status}).`)
  }

  return documentListResponseSchema.parse(await response.json())
}

export async function updateDocument(
  slug: string,
  input: DocumentUpdateRequest,
): Promise<Document> {
  const response = await fetch(`${getApiUrl()}/api/docs/v1/documents/${slug}`, {
    body: JSON.stringify(input),
    headers: { 'content-type': 'application/json' },
    method: 'PUT',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => undefined)
    throw new Error(
      typeof body?.error === 'string'
        ? body.error
        : `Could not save document (${response.status}).`,
    )
  }

  return documentUpdateResponseSchema.parse(await response.json()).document
}

export async function syncIndex(): Promise<number> {
  const response = await fetch(`${getApiUrl()}/api/docs/v1/index/sync`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Could not synchronize the database index (${response.status}).`)
  }

  return syncResponseSchema.parse(await response.json()).indexed
}
