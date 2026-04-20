import type { StorefrontCampaignSection, StorefrontSettings } from "./schemas/catalog.js"

export type StorefrontCampaignDesign = StorefrontCampaignSection["design"]

function isVeryLightHexColor(value: string | null | undefined) {
  if (typeof value !== "string") {
    return false
  }

  const normalized = value.trim().replace(/^#/, "")
  const hex =
    normalized.length === 3
      ? normalized
          .split("")
          .map((character) => `${character}${character}`)
          .join("")
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(hex)) {
    return false
  }

  const red = Number.parseInt(hex.slice(0, 2), 16)
  const green = Number.parseInt(hex.slice(2, 4), 16)
  const blue = Number.parseInt(hex.slice(4, 6), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

  return luminance >= 0.9
}

export function normalizeStorefrontCampaignDesign<T extends StorefrontCampaignDesign>(
  design: T
): T {
  const normalized = { ...design }

  if (isVeryLightHexColor(normalized.secondaryButtonBackgroundColor)) {
    normalized.secondaryButtonBackgroundColor = "#d7b391" as T["secondaryButtonBackgroundColor"]
    normalized.secondaryButtonTextColor = "#2f2119" as T["secondaryButtonTextColor"]
    normalized.secondaryButtonBorderColor = "#e7c9ad" as T["secondaryButtonBorderColor"]
  }

  return normalized
}

export function normalizeStorefrontSettingsCampaignDesign(
  settings: StorefrontSettings
): StorefrontSettings {
  return {
    ...settings,
    campaignDesign: normalizeStorefrontCampaignDesign(settings.campaignDesign),
  }
}
