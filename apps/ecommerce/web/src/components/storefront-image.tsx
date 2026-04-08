import type { ImgHTMLAttributes } from "react"

import {
  handleStorefrontImageError,
  resolveStorefrontImageUrl,
} from "../lib/storefront-image"

export function StorefrontImage({
  imageUrl,
  fallbackLabel,
  alt,
  width,
  height,
  loading = "lazy",
  decoding = "async",
  fetchPriority,
  className,
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  imageUrl: string | null | undefined
  fallbackLabel?: string | null
  alt: string
}) {
  return (
    <img
      {...props}
      src={resolveStorefrontImageUrl(imageUrl, fallbackLabel ?? alt)}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding={decoding}
      fetchPriority={fetchPriority}
      className={className}
      onError={(event) => {
        handleStorefrontImageError(event, fallbackLabel ?? alt)
        props.onError?.(event)
      }}
    />
  )
}
