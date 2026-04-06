import type { SyntheticEvent } from "react"

import type { Media, MediaSummary, MediaVersion } from "../../../../../framework/shared/media"

const mediaPreviewFallbackCache = new Map<string, string>()

function normalizeFallbackLabel(label: string | null | undefined) {
  const trimmed = label?.trim()

  return trimmed && trimmed.length > 0 ? trimmed : "Media"
}

export function getMediaPreviewFallback(label?: string | null) {
  const normalizedLabel = normalizeFallbackLabel(label)
  const cachedValue = mediaPreviewFallbackCache.get(normalizedLabel)

  if (cachedValue) {
    return cachedValue
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="720" height="720" viewBox="0 0 720 720" fill="none">
      <defs>
        <linearGradient id="media-preview-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#eef2f6"/>
          <stop offset="100%" stop-color="#f8fafc"/>
        </linearGradient>
      </defs>
      <rect width="720" height="720" rx="40" fill="url(#media-preview-gradient)"/>
      <rect x="68" y="68" width="584" height="584" rx="28" fill="#ffffff" stroke="#d7dee7" stroke-width="4"/>
      <path d="M178 510 300 390l96 92 56-52 90 80" stroke="#9aa8ba" stroke-width="28" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="276" cy="248" r="54" fill="#d9e2ec"/>
      <text x="360" y="602" text-anchor="middle" fill="#243242" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="700">${normalizedLabel}</text>
    </svg>
  `.trim()

  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  mediaPreviewFallbackCache.set(normalizedLabel, dataUri)

  return dataUri
}

export function normalizeMediaUrl(value: string | null | undefined) {
  const trimmed = value?.trim()

  if (!trimmed) {
    return null
  }

  if (
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("/")
  ) {
    return trimmed
  }

  if (typeof window === "undefined") {
    return `/${trimmed.replace(/^\/+/, "")}`
  }

  try {
    return new URL(trimmed, `${window.location.origin}/`).toString()
  } catch {
    return null
  }
}

export function resolveMediaPreviewUrl(
  value: string | null | undefined,
  fallbackLabel?: string | null
) {
  return normalizeMediaUrl(value) ?? getMediaPreviewFallback(fallbackLabel)
}

export function handleMediaPreviewError(
  event: SyntheticEvent<HTMLImageElement>,
  fallbackLabel?: string | null
) {
  event.currentTarget.onerror = null
  event.currentTarget.src = getMediaPreviewFallback(fallbackLabel)
}

function normalizeMediaVersion(version: MediaVersion): MediaVersion {
  return {
    ...version,
    fileUrl: normalizeMediaUrl(version.fileUrl) ?? version.fileUrl,
  }
}

export function normalizeMediaSummaryUrls<TMedia extends MediaSummary>(item: TMedia): TMedia {
  return {
    ...item,
    fileUrl: normalizeMediaUrl(item.fileUrl) ?? item.fileUrl,
    thumbnailUrl: normalizeMediaUrl(item.thumbnailUrl) ?? item.thumbnailUrl,
  }
}

export function normalizeMediaUrls(item: Media): Media {
  return {
    ...normalizeMediaSummaryUrls(item),
    versions: item.versions.map(normalizeMediaVersion),
  }
}
