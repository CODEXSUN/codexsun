import {
  documentListResponseSchema,
  documentResponseSchema,
  syncResponseSchema,
  type Document,
  type DocumentListResponse,
} from '@codexsun/docs-contracts'

const localDocsApiUrl = 'http://127.0.0.1:6030'
const apiUrl = import.meta.env.VITE_DOCS_API_URL ?? localDocsApiUrl

function getApiUrl(): string {
  return apiUrl.replace(/\/$/, '')
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

export async function syncIndex(): Promise<number> {
  const response = await fetch(`${getApiUrl()}/api/docs/v1/index/sync`, { method: 'POST' })
  if (!response.ok) {
    throw new Error(`Could not synchronize the database index (${response.status}).`)
  }

  return syncResponseSchema.parse(await response.json()).indexed
}
