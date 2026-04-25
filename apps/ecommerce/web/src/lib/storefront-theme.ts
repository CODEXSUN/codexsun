import type { CSSProperties } from "react"

import type { StorefrontTheme } from "@ecommerce/shared"

type StorefrontThemeStyle = CSSProperties & {
  "--storefront-section-bg": string
  "--storefront-card-bg": string
  "--storefront-card-muted-bg": string
  "--storefront-card-border": string
  "--storefront-card-shadow": string
  "--storefront-card-shadow-hover": string
}

function hexToRgb(hexColor: string) {
  const normalized = hexColor.replace("#", "")
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => part + part)
          .join("")
      : normalized.slice(0, 6)

  const numeric = Number.parseInt(value, 16)

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function rgba(hexColor: string, alpha: number) {
  const { r, g, b } = hexToRgb(hexColor)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function resolveShadow(theme: StorefrontTheme, mode: "base" | "hover") {
  const color = theme.cardShadowColor

  if (theme.cardShadowStrength === "none") {
    return "none"
  }

  if (theme.cardShadowStrength === "deep") {
    return mode === "hover"
      ? `0 24px 54px -24px ${rgba(color, 0.52)}`
      : `0 18px 42px -28px ${rgba(color, 0.42)}`
  }

  if (theme.cardShadowStrength === "medium") {
    return mode === "hover"
      ? `0 20px 46px -26px ${rgba(color, 0.38)}`
      : `0 14px 34px -28px ${rgba(color, 0.3)}`
  }

  return mode === "hover"
    ? `0 18px 40px -28px ${rgba(color, 0.26)}`
    : `0 10px 26px -24px ${rgba(color, 0.2)}`
}

export function resolveStorefrontThemeStyle(
  theme: StorefrontTheme | null | undefined
): StorefrontThemeStyle | undefined {
  if (!theme) {
    return undefined
  }

  return {
    background: `linear-gradient(180deg, ${theme.pageBackgroundFrom} 0%, ${theme.pageBackgroundVia} 18%, ${theme.pageBackgroundTo} 100%)`,
    "--storefront-section-bg": theme.sectionBackgroundColor,
    "--storefront-card-bg": theme.cardBackgroundColor,
    "--storefront-card-muted-bg": theme.cardMutedBackgroundColor,
    "--storefront-card-border": theme.cardBorderColor,
    "--storefront-card-shadow": resolveShadow(theme, "base"),
    "--storefront-card-shadow-hover": resolveShadow(theme, "hover"),
  }
}
