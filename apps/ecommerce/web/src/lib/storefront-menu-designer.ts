import type { CSSProperties } from "react"

import type { StorefrontMenuSurfaceDesign } from "@ecommerce/shared"

export function getMenuLogoFrameStyle(
  design: StorefrontMenuSurfaceDesign,
  options: {
    backgroundColor?: string
    widthOverride?: number
    heightOverride?: number
  } = {}
): CSSProperties {
  return {
    width: `${options.widthOverride ?? design.frameWidth}px`,
    height: `${options.heightOverride ?? design.frameHeight}px`,
    backgroundColor: options.backgroundColor ?? design.areaBackgroundColor,
  }
}

export function getMenuLogoImageStyle(design: StorefrontMenuSurfaceDesign): CSSProperties {
  return {
    width: `${design.logoWidth}px`,
    height: `${design.logoHeight}px`,
    transform: `translate(${design.offsetX}px, ${design.offsetY}px)`,
    backgroundColor: design.logoBackgroundColor,
  }
}
