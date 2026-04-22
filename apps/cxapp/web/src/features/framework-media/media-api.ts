import type {
  Media,
  MediaFolderListResponse,
  MediaFolderResponse,
  MediaListResponse,
  MediaResponse,
  MediaStorageScope,
  MediaSymlinkResponse,
} from "../../../../../framework/shared/media"

import { getStoredAccessToken } from "../../auth/session-storage"
import { normalizeMediaSummaryUrls, normalizeMediaUrls } from "./media-url"

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : {
          "content-type": "application/json",
          ...(init?.headers ?? {}),
        },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null
    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`
    )
  }

  return (await response.json()) as T
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => {
      reject(new Error(`Failed to read ${file.name}.`))
    }
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Failed to read ${file.name}.`))
        return
      }

      resolve(reader.result)
    }

    reader.readAsDataURL(file)
  })
}

export function listFrameworkMedia() {
  return requestJson<MediaListResponse>("/internal/v1/framework/media").then((response) => ({
    ...response,
    items: response.items.map((item) => normalizeMediaSummaryUrls(item)),
  }))
}

export function getFrameworkMediaSymlinkStatus() {
  return requestJson<MediaSymlinkResponse>("/internal/v1/framework/media-symlink")
}

export function manageFrameworkMediaSymlink(action: "verify" | "recreate") {
  return requestJson<MediaSymlinkResponse>("/internal/v1/framework/media-symlink", {
    method: "POST",
    body: JSON.stringify({ action }),
  })
}

export function createCxmediaLaunchUrl() {
  return requestJson<{ url: string }>("/internal/v1/cxapp/media/cxmedia-launch")
}

export function getFrameworkMediaItem(mediaId: string) {
  return requestJson<MediaResponse>(
    `/internal/v1/framework/media-item?id=${encodeURIComponent(mediaId)}`
  ).then((response) => ({
    ...response,
    item: normalizeMediaUrls(response.item as Media),
  }))
}

export function listFrameworkMediaFolders() {
  return requestJson<MediaFolderListResponse>("/internal/v1/framework/media-folders")
}

export function createFrameworkMediaFolder(name: string, parentId?: string | null) {
  return requestJson<MediaFolderResponse>("/internal/v1/framework/media-folders", {
    method: "POST",
    body: JSON.stringify({
      name,
      parentId: parentId ?? null,
      isActive: true,
    }),
  })
}

export function updateFrameworkMediaItem(
  mediaId: string,
  payload: {
    title?: string | null
    altText?: string | null
    description?: string | null
    folderId?: string | null
    storageScope?: MediaStorageScope
    tags?: string[]
    isActive?: boolean
  }
) {
  return requestJson<MediaResponse>(
    `/internal/v1/framework/media-item?id=${encodeURIComponent(mediaId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        title: payload.title ?? null,
        altText: payload.altText ?? null,
        description: payload.description ?? null,
        folderId: payload.folderId ?? null,
        storageScope: payload.storageScope ?? "public",
        tags: payload.tags ?? [],
        isActive: payload.isActive ?? true,
      }),
    }
  ).then((response) => ({
    ...response,
    item: normalizeMediaUrls(response.item as Media),
  }))
}

export function deactivateFrameworkMediaItem(mediaId: string) {
  return requestJson<{ item: { id: string } }>(
    `/internal/v1/framework/media-item?id=${encodeURIComponent(mediaId)}`,
    {
      method: "DELETE",
    }
  )
}

export async function uploadFrameworkMediaImage({
  file,
  folderId,
  storageScope,
}: {
  file: File
  folderId?: string | null
  storageScope?: MediaStorageScope
}) {
  const dataUrl = await fileToDataUrl(file)

  return requestJson<MediaResponse>("/internal/v1/framework/media", {
    method: "POST",
    body: JSON.stringify({
      fileName: file.name.replace(/\.[^.]+$/, ""),
      originalName: file.name,
      dataUrl,
      folderId: folderId ?? null,
      storageScope: storageScope ?? "public",
      title: file.name.replace(/\.[^.]+$/, ""),
      altText: null,
      description: null,
      tags: [],
      isActive: true,
    }),
  }).then((response) => ({
    ...response,
    item: normalizeMediaUrls(response.item as Media),
  }))
}
