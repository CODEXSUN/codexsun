import type { SyntheticEvent } from "react"

const storefrontImageFallbackCache = new Map<string, string>()

function normalizeFallbackLabel(label: string | null | undefined) {
  const trimmed = label?.trim()

  return trimmed && trimmed.length > 0 ? trimmed : "Product"
}

export function getStorefrontImageFallback(label?: string | null) {
  const normalizedLabel = normalizeFallbackLabel(label)
  const cachedValue = storefrontImageFallbackCache.get(normalizedLabel)

  if (cachedValue) {
    return cachedValue
  }

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000" viewBox="0 0 800 1000" fill="none">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#efe3d4"/>
          <stop offset="100%" stop-color="#f8f3ed"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1000" rx="44" fill="url(#g)"/>
      <rect x="72" y="72" width="656" height="856" rx="36" fill="#fffaf4" stroke="#decfbd" stroke-width="4"/>
      <circle cx="400" cy="372" r="124" fill="#ead9c6"/>
      <path d="M400 284c-55.2 0-100 44.8-100 100 0 19.7 5.7 38 15.5 53.4 22.2-21.4 52.4-34.4 84.5-34.4 32.1 0 62.3 13 84.5 34.4C494.3 422 500 403.7 500 384c0-55.2-44.8-100-100-100Z" fill="#7e6150"/>
      <path d="M248 690c26-85.4 82.6-128 152-128s126 42.6 152 128" fill="#d5b79a"/>
      <text x="400" y="808" text-anchor="middle" fill="#2d211b" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">${normalizedLabel}</text>
    </svg>
  `.trim()

  const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
  storefrontImageFallbackCache.set(normalizedLabel, dataUri)

  return dataUri
}

export function resolveStorefrontImageUrl(
  imageUrl: string | null | undefined,
  fallbackLabel?: string | null
) {
  const trimmed = imageUrl?.trim()

  if (!trimmed) {
    return getStorefrontImageFallback(fallbackLabel)
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
    return trimmed
  }

  try {
    return new URL(trimmed, `${window.location.origin}/`).toString()
  } catch {
    return getStorefrontImageFallback(fallbackLabel)
  }
}

export function handleStorefrontImageError(
  event: SyntheticEvent<HTMLImageElement>,
  fallbackLabel?: string | null
) {
  event.currentTarget.onerror = null
  event.currentTarget.src = getStorefrontImageFallback(fallbackLabel)
}
