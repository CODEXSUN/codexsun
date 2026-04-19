export type BarcodePrintStandard = "CODE128" | "CODE39" | "EAN13" | "EAN8"
export type BarcodeLabelHorizontalAlign = "left" | "center" | "right"
export type BarcodeLabelVerticalAlign = "top" | "center" | "bottom"

export type BarcodePrintDesignerSettings = {
  labelWidthMm: number
  labelHeightMm: number
  paddingMm: number
  gapMm: number
  horizontalAlign: BarcodeLabelHorizontalAlign
  verticalAlign: BarcodeLabelVerticalAlign
  productFontSizePx: number
  codeFontSizePx: number
  metaFontSizePx: number
  barcodeTextFontSizePx: number
  barcodeHeightMm: number
  barcodeLineWidth: number
  barcodeStandard: BarcodePrintStandard
  showBorder: boolean
  showProductName: boolean
  showProductCode: boolean
  showBatch: boolean
  showSerial: boolean
  showExpiry: boolean
  showBarcodeText: boolean
}

export type BarcodePrintDesignerPreset = {
  id: string
  label: string
  settings: Partial<BarcodePrintDesignerSettings>
  isCustom?: boolean
}

export const BARCODE_PRINT_DESIGNER_STORAGE_KEY = "stock.barcode-print-designer.v1"
export const BARCODE_PRINT_DESIGNER_PRESETS_STORAGE_KEY =
  "stock.barcode-print-designer-presets.v1"

export const defaultBarcodePrintDesignerSettings: BarcodePrintDesignerSettings = {
  labelWidthMm: 50,
  labelHeightMm: 25,
  paddingMm: 1.6,
  gapMm: 0.45,
  horizontalAlign: "left",
  verticalAlign: "top",
  productFontSizePx: 7,
  codeFontSizePx: 6,
  metaFontSizePx: 6,
  barcodeTextFontSizePx: 6,
  barcodeHeightMm: 12,
  barcodeLineWidth: 1.28,
  barcodeStandard: "CODE128",
  showBorder: true,
  showProductName: true,
  showProductCode: true,
  showBatch: true,
  showSerial: true,
  showExpiry: true,
  showBarcodeText: true,
}

export const barcodePrintDesignerPresets: BarcodePrintDesignerPreset[] = [
  {
    id: "native-50x25",
    label: "Printer native 50 x 25",
    settings: {
      labelWidthMm: 50,
      labelHeightMm: 25,
      paddingMm: 1.6,
      gapMm: 0.45,
      barcodeHeightMm: 12,
    },
  },
  {
    id: "native-50x40",
    label: "Printer native 50 x 40",
    settings: {
      labelWidthMm: 50,
      labelHeightMm: 40,
      paddingMm: 1.8,
      gapMm: 0.6,
      barcodeHeightMm: 16,
    },
  },
]

function createCustomPresetId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return min
  }

  return Math.min(Math.max(value, min), max)
}

export function normalizeBarcodePrintDesignerSettings(
  input?: Partial<BarcodePrintDesignerSettings> | null
): BarcodePrintDesignerSettings {
  const next = {
    ...defaultBarcodePrintDesignerSettings,
    ...(input ?? {}),
  }

  return {
    labelWidthMm: clamp(Number(next.labelWidthMm), 20, 150),
    labelHeightMm: clamp(Number(next.labelHeightMm), 10, 100),
    paddingMm: clamp(Number(next.paddingMm), 0, 8),
    gapMm: clamp(Number(next.gapMm), 0, 4),
    horizontalAlign:
      next.horizontalAlign === "center" || next.horizontalAlign === "right"
        ? next.horizontalAlign
        : "left",
    verticalAlign:
      next.verticalAlign === "center" || next.verticalAlign === "bottom"
        ? next.verticalAlign
        : "top",
    productFontSizePx: clamp(Number(next.productFontSizePx), 6, 20),
    codeFontSizePx: clamp(Number(next.codeFontSizePx), 5, 18),
    metaFontSizePx: clamp(Number(next.metaFontSizePx), 5, 18),
    barcodeTextFontSizePx: clamp(Number(next.barcodeTextFontSizePx), 5, 18),
    barcodeHeightMm: clamp(Number(next.barcodeHeightMm), 6, 40),
    barcodeLineWidth: clamp(Number(next.barcodeLineWidth), 0.6, 3),
    barcodeStandard:
      next.barcodeStandard === "CODE39" ||
      next.barcodeStandard === "EAN13" ||
      next.barcodeStandard === "EAN8"
        ? next.barcodeStandard
        : "CODE128",
    showBorder: Boolean(next.showBorder),
    showProductName: Boolean(next.showProductName),
    showProductCode: Boolean(next.showProductCode),
    showBatch: Boolean(next.showBatch),
    showSerial: Boolean(next.showSerial),
    showExpiry: Boolean(next.showExpiry),
    showBarcodeText: Boolean(next.showBarcodeText),
  }
}

export function loadBarcodePrintDesignerSettings() {
  if (typeof window === "undefined") {
    return defaultBarcodePrintDesignerSettings
  }

  const raw = window.localStorage.getItem(BARCODE_PRINT_DESIGNER_STORAGE_KEY)
  if (!raw) {
    return defaultBarcodePrintDesignerSettings
  }

  try {
    return normalizeBarcodePrintDesignerSettings(
      JSON.parse(raw) as Partial<BarcodePrintDesignerSettings>
    )
  } catch {
    return defaultBarcodePrintDesignerSettings
  }
}

export function saveBarcodePrintDesignerSettings(settings: BarcodePrintDesignerSettings) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    BARCODE_PRINT_DESIGNER_STORAGE_KEY,
    JSON.stringify(normalizeBarcodePrintDesignerSettings(settings))
  )
}

export function resetBarcodePrintDesignerSettings() {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.removeItem(BARCODE_PRINT_DESIGNER_STORAGE_KEY)
}

export function loadCustomBarcodePrintDesignerPresets() {
  if (typeof window === "undefined") {
    return [] as BarcodePrintDesignerPreset[]
  }

  const raw = window.localStorage.getItem(BARCODE_PRINT_DESIGNER_PRESETS_STORAGE_KEY)
  if (!raw) {
    return [] as BarcodePrintDesignerPreset[]
  }

  try {
    const parsed = JSON.parse(raw) as Array<{
      id?: string
      label?: string
      settings?: Partial<BarcodePrintDesignerSettings>
    }>

    return parsed
      .filter((item) => typeof item.label === "string" && item.label.trim().length > 0)
      .map((item) => ({
        id: item.id?.trim() || createCustomPresetId(),
        label: item.label!.trim(),
        settings: normalizeBarcodePrintDesignerSettings(item.settings),
        isCustom: true,
      }))
  } catch {
    return [] as BarcodePrintDesignerPreset[]
  }
}

function saveCustomBarcodePrintDesignerPresets(presets: BarcodePrintDesignerPreset[]) {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem(
    BARCODE_PRINT_DESIGNER_PRESETS_STORAGE_KEY,
    JSON.stringify(
      presets.map((preset) => ({
        id: preset.id,
        label: preset.label,
        settings: normalizeBarcodePrintDesignerSettings(preset.settings),
      }))
    )
  )
}

export function createCustomBarcodePrintDesignerPreset(
  label: string,
  settings: BarcodePrintDesignerSettings
) {
  const nextPreset: BarcodePrintDesignerPreset = {
    id: createCustomPresetId(),
    label: label.trim(),
    settings: normalizeBarcodePrintDesignerSettings(settings),
    isCustom: true,
  }

  const nextPresets = [...loadCustomBarcodePrintDesignerPresets(), nextPreset]
  saveCustomBarcodePrintDesignerPresets(nextPresets)
  return nextPreset
}

export function deleteCustomBarcodePrintDesignerPreset(presetId: string) {
  const nextPresets = loadCustomBarcodePrintDesignerPresets().filter(
    (preset) => preset.id !== presetId
  )
  saveCustomBarcodePrintDesignerPresets(nextPresets)
}

export function getBarcodePrintDesignerPresets() {
  return [...barcodePrintDesignerPresets, ...loadCustomBarcodePrintDesignerPresets()]
}

export function getMatchingBarcodePrintDesignerPresetId(
  settings: BarcodePrintDesignerSettings
) {
  const normalizedSettings = normalizeBarcodePrintDesignerSettings(settings)
  const matchedPreset = getBarcodePrintDesignerPresets().find((preset) => {
    const normalizedPreset = normalizeBarcodePrintDesignerSettings({
      ...normalizedSettings,
      ...preset.settings,
    })

    return (
      normalizedPreset.labelWidthMm === normalizedSettings.labelWidthMm &&
      normalizedPreset.labelHeightMm === normalizedSettings.labelHeightMm &&
      normalizedPreset.paddingMm === normalizedSettings.paddingMm &&
      normalizedPreset.gapMm === normalizedSettings.gapMm &&
      normalizedPreset.barcodeHeightMm === normalizedSettings.barcodeHeightMm
    )
  })

  return matchedPreset?.id ?? "custom"
}
