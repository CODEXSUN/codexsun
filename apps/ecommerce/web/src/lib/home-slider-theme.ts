import type { StorefrontHomeSliderTheme } from "@ecommerce/shared"

export type HomeSliderThemeOption = {
  value: string
  label: string
  backgroundFrom: string
  backgroundVia: string
  backgroundTo: string
}

export const homeSliderThemeOptions: HomeSliderThemeOption[] = [
  {
    value: "signature-ember",
    label: "Signature Ember",
    backgroundFrom: "#3d2219",
    backgroundVia: "#7c5642",
    backgroundTo: "#efe3d6",
  },
  {
    value: "espresso-sand",
    label: "Espresso Sand",
    backgroundFrom: "#241913",
    backgroundVia: "#6a4633",
    backgroundTo: "#f0dcc8",
  },
  {
    value: "walnut-glow",
    label: "Walnut Glow",
    backgroundFrom: "#201611",
    backgroundVia: "#5f4334",
    backgroundTo: "#e9d6c3",
  },
  {
    value: "mocha-bronze",
    label: "Mocha Bronze",
    backgroundFrom: "#2f1e18",
    backgroundVia: "#8a5a40",
    backgroundTo: "#efcfac",
  },
  {
    value: "cocoa-linen",
    label: "Cocoa Linen",
    backgroundFrom: "#311f19",
    backgroundVia: "#7a503c",
    backgroundTo: "#f6e6d3",
  },
  {
    value: "sienna-cream",
    label: "Sienna Cream",
    backgroundFrom: "#3b241b",
    backgroundVia: "#965f43",
    backgroundTo: "#f7dcc0",
  },
]

export type ResolvedHomeSliderThemeStyles = {
  background: string
  textColor: string
  mutedTextColor: string
  badgeBackground: string
  badgeTextColor: string
  primaryButtonLabel: string
  secondaryButtonLabel: string
  primaryButtonBackground: string
  primaryButtonTextColor: string
  secondaryButtonBackground: string
  secondaryButtonTextColor: string
  navBackground: string
  navTextColor: string
  frameBackground: string
  outerFrameBorderColor: string
  innerFrameBorderColor: string
  imagePanelBackground: string
  activeIndicatorColor: string
  inactiveIndicatorColor: string
  isDark: boolean
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((part) => `${part}${part}`)
          .join("")
      : normalized.slice(0, 6)

  const red = Number.parseInt(expanded.slice(0, 2), 16)
  const green = Number.parseInt(expanded.slice(2, 4), 16)
  const blue = Number.parseInt(expanded.slice(4, 6), 16)

  return { red, green, blue }
}

function channelToLinear(channel: number) {
  const normalized = channel / 255
  return normalized <= 0.03928
    ? normalized / 12.92
    : ((normalized + 0.055) / 1.055) ** 2.4
}

function getRelativeLuminance(hex: string) {
  const { red, green, blue } = hexToRgb(hex)
  return (
    0.2126 * channelToLinear(red) +
    0.7152 * channelToLinear(green) +
    0.0722 * channelToLinear(blue)
  )
}

function mixHexColors(from: string, to: string, ratio: number) {
  const start = hexToRgb(from)
  const end = hexToRgb(to)
  const clamp = Math.max(0, Math.min(1, ratio))
  const red = Math.round(start.red + (end.red - start.red) * clamp)
  const green = Math.round(start.green + (end.green - start.green) * clamp)
  const blue = Math.round(start.blue + (end.blue - start.blue) * clamp)
  return `#${[red, green, blue]
    .map((channel) => channel.toString(16).padStart(2, "0"))
    .join("")}`
}

function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`
}

export function applyHomeSliderThemePreset(
  settings: StorefrontHomeSliderTheme,
  themeKey: string
): StorefrontHomeSliderTheme {
  const preset =
    homeSliderThemeOptions.find((item) => item.value === themeKey) ??
    homeSliderThemeOptions[0]

  return {
    ...settings,
    themeKey: preset?.value ?? settings.themeKey,
    backgroundFrom: preset?.backgroundFrom ?? settings.backgroundFrom,
    backgroundVia: preset?.backgroundVia ?? settings.backgroundVia,
    backgroundTo: preset?.backgroundTo ?? settings.backgroundTo,
  }
}

export function resolveHomeSliderThemeStyles(
  settings: StorefrontHomeSliderTheme
): ResolvedHomeSliderThemeStyles {
  const averageTone = mixHexColors(settings.backgroundFrom, settings.backgroundVia, 0.45)
  const isDark = getRelativeLuminance(averageTone) < 0.42
  const textColor = settings.textColor ?? (isDark ? "#ffffff" : "#111111")
  const mutedTextColor = settings.mutedTextColor ?? (isDark ? "#efe2d6" : "#3f342d")
  const primaryButtonBackground =
    settings.primaryButtonBackground ?? (isDark ? "#ffffff" : "#1b140f")
  const primaryButtonTextColor =
    settings.primaryButtonTextColor ?? (isDark ? "#1a120f" : "#ffffff")
  const secondaryButtonBackground =
    settings.secondaryButtonBackground ??
    (isDark ? withAlpha("#ffffff", "30") : withAlpha("#ffffff", "b8"))
  const secondaryButtonTextColor = settings.secondaryButtonTextColor ?? textColor
  const navBackground =
    settings.navBackground ?? (isDark ? withAlpha("#ffffff", "de") : withAlpha("#ffffff", "d4"))
  const navTextColor = settings.navTextColor ?? (isDark ? "#1a120f" : "#111111")
  const badgeBackground =
    settings.badgeBackground ?? (isDark ? withAlpha("#ffffff", "24") : withAlpha("#111111", "14"))
  const badgeTextColor = settings.badgeTextColor ?? textColor
  const frameBackground =
    settings.frameBackground ?? (isDark ? withAlpha("#ffffff", "1c") : withAlpha("#ffffff", "30"))
  const outerFrameBorderColor =
    settings.outerFrameBorderColor ?? (isDark ? withAlpha("#ffffff", "44") : withAlpha("#ffffff", "66"))
  const innerFrameBorderColor =
    settings.innerFrameBorderColor ?? (isDark ? withAlpha("#ffffff", "7a") : withAlpha("#ffffff", "8f"))
  const imagePanelBackground = settings.imagePanelBackground ?? "#ffffff"

  return {
    background: `linear-gradient(118deg, ${settings.backgroundFrom} 0%, ${settings.backgroundVia} 48%, ${settings.backgroundTo} 100%)`,
    textColor,
    mutedTextColor,
    badgeBackground,
    badgeTextColor,
    primaryButtonLabel: settings.primaryButtonLabel ?? "Buy now",
    secondaryButtonLabel: settings.secondaryButtonLabel ?? "View details",
    primaryButtonBackground,
    primaryButtonTextColor,
    secondaryButtonBackground,
    secondaryButtonTextColor,
    navBackground,
    navTextColor,
    frameBackground,
    outerFrameBorderColor,
    innerFrameBorderColor,
    imagePanelBackground,
    activeIndicatorColor: navTextColor,
    inactiveIndicatorColor: isDark ? withAlpha("#ffffff", "b3") : withAlpha("#ffffff", "8f"),
    isDark,
  }
}
