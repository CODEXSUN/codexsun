import {
  documentListResponseSchema,
  documentResponseSchema,
  documentUpdateResponseSchema,
  documentationScanResponseSchema,
  syncResponseSchema,
  type Document,
  type DocumentListResponse,
  type DocumentationScanResponse,
  type DocumentUpdateRequest,
} from "@codexsun/garments-contracts";

const localGarmentsApiUrl = import.meta.env.VITE_GARMENTS_API_URL;
const apiUrl = import.meta.env.VITE_GARMENTS_API_URL ?? localGarmentsApiUrl;

function getApiUrl(): string {
  return apiUrl.replace(/\/$/, "");
}

export function getDocumentAssetUrl(path: string): string {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  return `${getApiUrl()}/api/garments/v1/assets/${encodedPath}`;
}

export async function fetchDocument(slug: string, signal?: AbortSignal): Promise<Document> {
  const response = await fetch(`${getApiUrl()}/api/garments/v1/documents/${slug}`, { signal });
  if (!response.ok) {
    throw new Error(`Could not load document (${response.status}).`);
  }

  return documentResponseSchema.parse(await response.json()).document;
}

export async function fetchDocuments(signal?: AbortSignal): Promise<DocumentListResponse> {
  const response = await fetch(`${getApiUrl()}/api/garments/v1/documents`, { signal });
  if (!response.ok) {
    throw new Error(`Could not load Garments library (${response.status}).`);
  }

  return documentListResponseSchema.parse(await response.json());
}

export async function scanDocumentation(): Promise<DocumentationScanResponse> {
  const response = await fetch(`${getApiUrl()}/api/garments/v1/scan`);
  if (!response.ok) {
    throw new Error(`Could not scan repository documentation (${response.status}).`);
  }

  return documentationScanResponseSchema.parse(await response.json());
}

export async function updateDocument(slug: string, input: DocumentUpdateRequest): Promise<Document> {
  const response = await fetch(`${getApiUrl()}/api/garments/v1/documents/${slug}`, {
    body: JSON.stringify(input),
    headers: { "content-type": "application/json" },
    method: "PUT",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => undefined);
    throw new Error(typeof body?.error === "string" ? body.error : `Could not save document (${response.status}).`);
  }

  return documentUpdateResponseSchema.parse(await response.json()).document;
}

export async function syncIndex(): Promise<number> {
  const response = await fetch(`${getApiUrl()}/api/garments/v1/index/sync`, { method: "POST" });
  if (!response.ok) {
    throw new Error(`Could not synchronize the database index (${response.status}).`);
  }

  return syncResponseSchema.parse(await response.json()).indexed;
}
