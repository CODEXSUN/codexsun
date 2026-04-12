import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

import type { CommonModuleItem } from "@core/shared"
import type {
  CompanyBrandAssetDesigner,
  CompanyBrandAssetDraftReadResponse,
  CompanyBrandAssetDraftResponse,
  CompanyBrandAssetPublishResponse,
  CompanyResponse,
} from "@cxapp/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import {
  handleMediaPreviewError,
  resolveMediaPreviewUrl,
} from "@cxapp/web/src/features/framework-media/media-url"

import { showAppToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TechnicalNameBadge } from "@/components/system/technical-name-badge"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  companyEmailTypeOptions,
  companyPhoneTypeOptions,
  createDefaultCompanyFormValues,
  createEmptyCompanyAddress,
  createEmptyCompanyBankAccount,
  createEmptyCompanyEmail,
  createEmptyCompanyPhone,
  toCompanyFormValues,
  type CompanyFormValues,
  type CompanyLocationModuleKey,
} from "./company-form-state"
import {
  CompanyCheckboxField,
  CompanyCollectionRow,
  CompanyField,
  CompanyFormMessage,
  CompanyFormSectionCard,
  CompanyLookupField,
  CompanySelectField,
  CompanyStatusField,
  CompanyTextField,
} from "./company-form-sections"

type LookupState = Record<CompanyLocationModuleKey, CommonModuleItem[]>
type CompanyFieldErrors = Partial<Record<keyof CompanyFormValues, string>>
type BrandAssetVariant = "primary" | "dark" | "favicon" | "print"
type BrandAssetSourceState = {
  logoUrl: string
  darkLogoUrl: string
  faviconUrl: string
  printLogoUrl: string
}
type SvgEditorDraft = {
  canvasWidth: number
  canvasHeight: number
  offsetX: number
  offsetY: number
  scale: number
  fillColor: string
  hoverFillColor: string
}
type BrandAssetEditorState = Record<BrandAssetVariant, SvgEditorDraft>
type BrandAssetSourceMarkupState = Record<BrandAssetVariant, string | null>
type BrandAssetDraftStatus = "idle" | "dirty" | "saving" | "saved" | "error"

const lookupModules: CompanyLocationModuleKey[] = ["addressTypes", "countries", "states", "districts", "cities", "pincodes"]
const companyUpsertTechnicalName = "section.core.companies.upsert"
const defaultBrandAssetSourceState: BrandAssetSourceState = {
  logoUrl: "",
  darkLogoUrl: "",
  faviconUrl: "",
  printLogoUrl: "",
}
const defaultBrandAssetEditorState: BrandAssetEditorState = {
  primary: {
    canvasWidth: 320,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#111111",
    hoverFillColor: "#8b5e34",
  },
  dark: {
    canvasWidth: 320,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#f5efe8",
    hoverFillColor: "#f0c48a",
  },
  favicon: {
    canvasWidth: 64,
    canvasHeight: 64,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#8b5e34",
    hoverFillColor: "#5a3a1b",
  },
  print: {
    canvasWidth: 420,
    canvasHeight: 120,
    offsetX: 0,
    offsetY: 0,
    scale: 100,
    fillColor: "#111111",
    hoverFillColor: "#3b3b3b",
  },
}
const brandAssetEditorDefinitions: Array<{
  variant: BrandAssetVariant
  label: string
  fileName: string
  description: string
  surfaceClassName: string
  imageClassName: string
  targetLabel: string
  publishable: boolean
}> = [
  {
    variant: "primary",
    label: "Light",
    fileName: "logo.svg",
    description: "Default light-surface logo used across web and app chrome.",
    surfaceClassName: "bg-[linear-gradient(135deg,#f5f1eb_0%,#ece5dc_100%)]",
    imageClassName: "max-h-24 max-w-[80%]",
    targetLabel: "Publish target: public/logo.svg",
    publishable: true,
  },
  {
    variant: "dark",
    label: "Dark",
    fileName: "logo-dark.svg",
    description: "Dark-surface logo for storefront footer, dark shells, and contrast-heavy sections.",
    surfaceClassName: "bg-[linear-gradient(135deg,#181818_0%,#31261d_100%)]",
    imageClassName: "max-h-24 max-w-[80%]",
    targetLabel: "Publish target: public/logo-dark.svg",
    publishable: true,
  },
  {
    variant: "favicon",
    label: "Favicon",
    fileName: "favicon.svg",
    description: "Compact mark for browser tabs, pinned surfaces, and small icon contexts.",
    surfaceClassName: "bg-[linear-gradient(135deg,#edf2f7_0%,#d8e1eb_100%)]",
    imageClassName: "max-h-16 max-w-16",
    targetLabel: "Publish target: public/favicon.svg",
    publishable: true,
  },
  {
    variant: "print",
    label: "Company Logo",
    fileName: "company-logo.svg",
    description: "Company logo draft for letterhead, print-safe layouts, and document-first branding.",
    surfaceClassName: "bg-[linear-gradient(135deg,#ffffff_0%,#f3f3f3_100%)]",
    imageClassName: "max-h-20 max-w-[85%]",
    targetLabel: "Company logo draft for letterhead. Not published yet.",
    publishable: false,
  },
]
const emptyBrandAssetSourceMarkupState: BrandAssetSourceMarkupState = {
  primary: null,
  dark: null,
  favicon: null,
  print: null,
}

function getCommonModuleRoute(moduleKey: CompanyLocationModuleKey) {
  return `/dashboard/apps/core/common-${moduleKey}`
}

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

async function requestText(path: string) {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    headers:
      path.startsWith("/internal/") && accessToken
        ? {
            authorization: `Bearer ${accessToken}`,
          }
        : undefined,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`)
  }

  return response.text()
}

function parseSvgLength(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const match = value.match(/-?\d+(?:\.\d+)?/)
  return match ? Number(match[0]) : null
}

function extractSvgAttribute(attributes: string, name: string) {
  const pattern = new RegExp(`${name}\\s*=\\s*["']([^"']+)["']`, "i")
  return attributes.match(pattern)?.[1] ?? null
}

function normalizeHexColor(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const normalized = value.trim()

  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized.toLowerCase()
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase()
  }

  return null
}

function extractSvgEditorDefaults(svgSource: string, fallback: SvgEditorDraft) {
  const rootMatch = svgSource.match(/<svg\b([^>]*)>/i)
  const attributes = rootMatch?.[1] ?? ""
  const width = parseSvgLength(extractSvgAttribute(attributes, "width"))
  const height = parseSvgLength(extractSvgAttribute(attributes, "height"))
  const viewBox = extractSvgAttribute(attributes, "viewBox")
  const viewBoxParts = viewBox?.split(/[\s,]+/).map(Number).filter(Number.isFinite) ?? []
  const derivedWidth = width ?? (viewBoxParts.length === 4 ? viewBoxParts[2] : null)
  const derivedHeight = height ?? (viewBoxParts.length === 4 ? viewBoxParts[3] : null)
  const fillMatch = svgSource.match(/fill\s*=\s*["'](#[0-9a-fA-F]{3,6})["']/i)
  const fillColor = normalizeHexColor(fillMatch?.[1]) ?? fallback.fillColor

  return {
    canvasWidth: Math.max(32, Math.round(derivedWidth ?? fallback.canvasWidth)),
    canvasHeight: Math.max(32, Math.round(derivedHeight ?? fallback.canvasHeight)),
    fillColor,
  }
}

function parseSourceSvg(svgSource: string) {
  const rootMatch = svgSource.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/i)
  const selfClosingMatch = svgSource.match(/<svg\b([^>]*)\/>/i)

  if (!rootMatch && !selfClosingMatch) {
    throw new Error("The selected source does not contain a valid SVG document.")
  }

  const attributes = rootMatch?.[1] ?? selfClosingMatch?.[1] ?? ""
  const innerMarkup = rootMatch?.[2] ?? ""
  const width = parseSvgLength(extractSvgAttribute(attributes, "width"))
  const height = parseSvgLength(extractSvgAttribute(attributes, "height"))
  const viewBox = extractSvgAttribute(attributes, "viewBox")
  const viewBoxParts = viewBox?.split(/[\s,]+/).map(Number).filter(Number.isFinite) ?? []
  const parsedWidth = width ?? (viewBoxParts.length === 4 ? viewBoxParts[2] : 100)
  const parsedHeight = height ?? (viewBoxParts.length === 4 ? viewBoxParts[3] : 100)
  const resolvedViewBox =
    viewBoxParts.length === 4
      ? viewBoxParts.join(" ")
      : `0 0 ${parsedWidth} ${parsedHeight}`

  return {
    innerMarkup,
    viewBox: resolvedViewBox,
    width: Math.max(1, parsedWidth),
    height: Math.max(1, parsedHeight),
  }
}

function replaceSvgFillColors(svgMarkup: string, fillColor: string) {
  return svgMarkup
    .replace(/fill\s*=\s*["'](#[0-9a-fA-F]{3,8})["']/gi, `fill="${fillColor}"`)
    .replace(/fill:\s*(#[0-9a-fA-F]{3,8})/gi, `fill:${fillColor}`)
}

function buildDesignedSvgPreview(sourceSvg: string, editor: SvgEditorDraft) {
  const parsed = parseSourceSvg(sourceSvg)
  const scaledWidth = Math.max(1, Number((parsed.width * editor.scale) / 100))
  const scaledHeight = Math.max(1, Number((parsed.height * editor.scale) / 100))
  const recoloredMarkup = replaceSvgFillColors(parsed.innerMarkup, editor.fillColor)

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${editor.canvasWidth}" height="${editor.canvasHeight}" viewBox="0 0 ${editor.canvasWidth} ${editor.canvasHeight}" fill="none">`,
    `  <svg x="${editor.offsetX}" y="${editor.offsetY}" width="${scaledWidth}" height="${scaledHeight}" viewBox="${parsed.viewBox}" overflow="visible">`,
    `    <style>:root svg:hover [data-hover-fill]{ fill: ${editor.hoverFillColor}; }</style>`,
    `    <g data-hover-fill="true">${recoloredMarkup}</g>`,
    "  </svg>",
    "</svg>",
  ].join("\n")
}

function buildBrandAssetDesignerPayload(
  sources: BrandAssetSourceState,
  editors: BrandAssetEditorState
): CompanyBrandAssetDesigner {
  return {
    primary: {
      sourceUrl: sources.logoUrl.trim(),
      ...editors.primary,
    },
    dark: {
      sourceUrl: sources.darkLogoUrl.trim(),
      ...editors.dark,
    },
    favicon: {
      sourceUrl: sources.faviconUrl.trim(),
      ...editors.favicon,
    },
    print: {
      sourceUrl: sources.printLogoUrl.trim(),
      ...editors.print,
    },
  }
}

function createBrandAssetDraftSnapshot(
  sources: BrandAssetSourceState,
  editors: BrandAssetEditorState
) {
  return JSON.stringify(buildBrandAssetDesignerPayload(sources, editors))
}

function createBrandAssetStateFromDesigner(designer: CompanyBrandAssetDesigner) {
  return {
    sources: {
      logoUrl: designer.primary.sourceUrl,
      darkLogoUrl: designer.dark.sourceUrl,
      faviconUrl: designer.favicon.sourceUrl,
      printLogoUrl: designer.print.sourceUrl,
    },
    editors: {
      primary: {
        canvasWidth: designer.primary.canvasWidth,
        canvasHeight: designer.primary.canvasHeight,
        offsetX: designer.primary.offsetX,
        offsetY: designer.primary.offsetY,
        scale: designer.primary.scale,
        fillColor: designer.primary.fillColor,
        hoverFillColor: designer.primary.hoverFillColor,
      },
      dark: {
        canvasWidth: designer.dark.canvasWidth,
        canvasHeight: designer.dark.canvasHeight,
        offsetX: designer.dark.offsetX,
        offsetY: designer.dark.offsetY,
        scale: designer.dark.scale,
        fillColor: designer.dark.fillColor,
        hoverFillColor: designer.dark.hoverFillColor,
      },
      favicon: {
        canvasWidth: designer.favicon.canvasWidth,
        canvasHeight: designer.favicon.canvasHeight,
        offsetX: designer.favicon.offsetX,
        offsetY: designer.favicon.offsetY,
        scale: designer.favicon.scale,
        fillColor: designer.favicon.fillColor,
        hoverFillColor: designer.favicon.hoverFillColor,
      },
      print: {
        canvasWidth: designer.print.canvasWidth,
        canvasHeight: designer.print.canvasHeight,
        offsetX: designer.print.offsetX,
        offsetY: designer.print.offsetY,
        scale: designer.print.scale,
        fillColor: designer.print.fillColor,
        hoverFillColor: designer.print.hoverFillColor,
      },
    } satisfies BrandAssetEditorState,
  }
}

function StateCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-10 w-full animate-pulse rounded-md bg-muted/80" />
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function updateCollectionItem<T>(
  items: T[],
  index: number,
  recipe: (item: T) => T
) {
  return items.map((item, itemIndex) => (itemIndex === index ? recipe(item) : item))
}

function validateCompanyForm(values: CompanyFormValues) {
  const errors: CompanyFieldErrors = {}

  if (values.name.trim().length < 2) {
    errors.name = "Company name is required."
  }

  return errors
}

function isSvgLogo(logo: CompanyFormValues["logos"][number]) {
  return /\.svg(?:$|\?)/i.test(logo.logoUrl) || /\bsvg\b/i.test(logo.logoType)
}

function findSvgLogoUrlByType(
  logos: CompanyFormValues["logos"],
  expectedTypes: string[]
) {
  const normalizedTypes = expectedTypes.map((type) => type.trim().toLowerCase())

  return (
    logos.find(
      (logo) =>
        isSvgLogo(logo) &&
        normalizedTypes.includes(logo.logoType.trim().toLowerCase())
    )?.logoUrl ?? ""
  )
}

function getDefaultBrandAssetSources(
  logos: CompanyFormValues["logos"]
): BrandAssetSourceState {
  const firstSvgLogoUrl = logos.find(isSvgLogo)?.logoUrl ?? ""
  const primaryLogoUrl =
    findSvgLogoUrlByType(logos, ["primary", "logo", "light"]) || firstSvgLogoUrl
  const darkLogoUrl =
    findSvgLogoUrlByType(logos, ["dark", "logo-dark", "dark-logo"]) || primaryLogoUrl
  const faviconUrl =
    findSvgLogoUrlByType(logos, ["favicon", "icon", "site-icon"]) || primaryLogoUrl
  const printLogoUrl =
    findSvgLogoUrlByType(logos, ["print", "letterhead", "print-logo"]) || primaryLogoUrl

  return {
    logoUrl: primaryLogoUrl,
    darkLogoUrl,
    faviconUrl,
    printLogoUrl,
  }
}

export function CompanyUpsertSection({ companyId }: { companyId?: string }) {
  const navigate = useNavigate()
  const isEditing = Boolean(companyId)
  const [form, setForm] = useState<CompanyFormValues>(createDefaultCompanyFormValues())
  const [lookupState, setLookupState] = useState<LookupState>({
    addressTypes: [],
    countries: [],
    states: [],
    districts: [],
    cities: [],
    pincodes: [],
  })
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingBrandAssetDraft, setIsSavingBrandAssetDraft] = useState(false)
  const [isPublishingBrandAssets, setIsPublishingBrandAssets] = useState(false)
  const [brandAssetSources, setBrandAssetSources] = useState<BrandAssetSourceState>(
    defaultBrandAssetSourceState
  )
  const [brandAssetEditors, setBrandAssetEditors] = useState<BrandAssetEditorState>(
    defaultBrandAssetEditorState
  )
  const [brandAssetSourceMarkup, setBrandAssetSourceMarkup] = useState<BrandAssetSourceMarkupState>(
    emptyBrandAssetSourceMarkupState
  )
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [brandAssetDraftError, setBrandAssetDraftError] = useState<string | null>(null)
  const [brandAssetDraftNotice, setBrandAssetDraftNotice] = useState<string | null>(null)
  const [brandAssetDraftStatus, setBrandAssetDraftStatus] = useState<BrandAssetDraftStatus>("idle")
  const [brandAssetDraftLastSavedSnapshot, setBrandAssetDraftLastSavedSnapshot] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<CompanyFieldErrors>({})
  const hasHydratedBrandAssetDraftRef = useRef(false)
  useGlobalLoading(isLoading || isSaving || isSavingBrandAssetDraft || isPublishingBrandAssets)

  const svgLogos = useMemo(() => form.logos.filter(isSvgLogo), [form.logos])
  const resolvedBrandAssetSources = useMemo(() => {
    const primaryLogoUrl = brandAssetSources.logoUrl.trim()

    return {
      logoUrl: primaryLogoUrl,
      darkLogoUrl: brandAssetSources.darkLogoUrl.trim() || primaryLogoUrl,
      faviconUrl: brandAssetSources.faviconUrl.trim() || primaryLogoUrl,
      printLogoUrl: brandAssetSources.printLogoUrl.trim() || primaryLogoUrl,
    }
  }, [brandAssetSources])
  const currentBrandAssetDraftPayload = useMemo(
    () => buildBrandAssetDesignerPayload(brandAssetSources, brandAssetEditors),
    [brandAssetEditors, brandAssetSources]
  )
  const currentBrandAssetDraftSnapshot = useMemo(
    () => createBrandAssetDraftSnapshot(brandAssetSources, brandAssetEditors),
    [brandAssetEditors, brandAssetSources]
  )
  const isBrandAssetDraftDirty =
    Boolean(companyId) &&
    hasHydratedBrandAssetDraftRef.current &&
    currentBrandAssetDraftSnapshot !== brandAssetDraftLastSavedSnapshot

  function updateBrandAssetSource(variant: BrandAssetVariant, value: string) {
    setBrandAssetDraftError(null)
    setBrandAssetDraftNotice(null)
    if (companyId && hasHydratedBrandAssetDraftRef.current) {
      setBrandAssetDraftStatus("dirty")
    }

    setBrandAssetSources((current) => {
      switch (variant) {
        case "primary":
          return { ...current, logoUrl: value }
        case "dark":
          return { ...current, darkLogoUrl: value }
        case "favicon":
          return { ...current, faviconUrl: value }
        case "print":
          return { ...current, printLogoUrl: value }
      }
    })
  }

  async function handleBrandAssetSourceChange(variant: BrandAssetVariant, value: string) {
    updateBrandAssetSource(variant, value)

    if (!value.trim()) {
      setBrandAssetSourceMarkup((current) => ({ ...current, [variant]: null }))
      return
    }

    try {
      const svgMarkup = await requestText(value)
      const nextDefaults = extractSvgEditorDefaults(svgMarkup, brandAssetEditors[variant])

      setBrandAssetSourceMarkup((current) => ({ ...current, [variant]: svgMarkup }))
      setBrandAssetEditors((current) => ({
        ...current,
        [variant]: {
          ...current[variant],
          canvasWidth: nextDefaults.canvasWidth,
          canvasHeight: nextDefaults.canvasHeight,
          fillColor: nextDefaults.fillColor,
        },
      }))
    } catch {
      setBrandAssetSourceMarkup((current) => ({ ...current, [variant]: null }))
    }
  }

  function updateBrandAssetEditor<K extends keyof SvgEditorDraft>(
    variant: BrandAssetVariant,
    key: K,
    value: SvgEditorDraft[K]
  ) {
    setBrandAssetDraftError(null)
    setBrandAssetDraftNotice(null)
    if (companyId && hasHydratedBrandAssetDraftRef.current) {
      setBrandAssetDraftStatus("dirty")
    }

    setBrandAssetEditors((current) => ({
      ...current,
      [variant]: {
        ...current[variant],
        [key]: value,
      },
    }))
  }

  function resetBrandAssetVariantToSourceDefaults(variant: BrandAssetVariant) {
    const sourceMarkup = brandAssetSourceMarkup[variant]
    const fallback = defaultBrandAssetEditorState[variant]

    if (!sourceMarkup) {
      setBrandAssetDraftError("Select an SVG source before resetting this variant.")
      setBrandAssetDraftStatus("error")
      return
    }

    try {
      const nextDefaults = extractSvgEditorDefaults(sourceMarkup, fallback)

      setBrandAssetDraftError(null)
      setBrandAssetDraftNotice(null)
      if (companyId && hasHydratedBrandAssetDraftRef.current) {
        setBrandAssetDraftStatus("dirty")
      }
      setBrandAssetEditors((current) => ({
        ...current,
        [variant]: {
          ...current[variant],
          canvasWidth: nextDefaults.canvasWidth,
          canvasHeight: nextDefaults.canvasHeight,
          offsetX: 0,
          offsetY: 0,
          scale: 100,
          fillColor: nextDefaults.fillColor,
        },
      }))
    } catch (error) {
      setBrandAssetDraftError(
        error instanceof Error ? error.message : "Failed to reset variant defaults."
      )
      setBrandAssetDraftStatus("error")
    }
  }

  function copyPrimaryBrandAssetSettings(variant: Exclude<BrandAssetVariant, "primary">) {
    setBrandAssetDraftError(null)
    setBrandAssetDraftNotice(null)
    if (companyId && hasHydratedBrandAssetDraftRef.current) {
      setBrandAssetDraftStatus("dirty")
    }

    setBrandAssetEditors((current) => ({
      ...current,
      [variant]: {
        ...current[variant],
        canvasWidth: current.primary.canvasWidth,
        canvasHeight: current.primary.canvasHeight,
        offsetX: current.primary.offsetX,
        offsetY: current.primary.offsetY,
        scale: current.primary.scale,
        fillColor: current.primary.fillColor,
        hoverFillColor: current.primary.hoverFillColor,
      },
    }))
  }

  function openCommonModule(moduleKey: CompanyLocationModuleKey) {
    navigate(getCommonModuleRoute(moduleKey))
  }

  useEffect(() => {
    let cancelled = false

    async function loadWorkspaceData() {
      setIsLoading(true)
      setLoadError(null)
      setFormError(null)

      try {
        const lookupEntries = await Promise.all(
          lookupModules.map(async (moduleKey) => {
            const response = await requestJson<{
              items: CommonModuleItem[]
              module: CompanyLocationModuleKey
            }>(`/internal/v1/core/common-modules/items?module=${moduleKey}`)
            return [moduleKey, response.items] as const
          })
        )

        if (cancelled) {
          return
        }

        setLookupState(Object.fromEntries(lookupEntries) as LookupState)

        if (!companyId) {
          const defaultForm = createDefaultCompanyFormValues()
          const defaultDesignerState = createBrandAssetStateFromDesigner(defaultForm.brandAssetDesigner)

          hasHydratedBrandAssetDraftRef.current = false
          setForm(defaultForm)
          setBrandAssetSources(defaultDesignerState.sources)
          setBrandAssetEditors(defaultDesignerState.editors)
          setBrandAssetDraftError(null)
          setBrandAssetDraftNotice(null)
          setBrandAssetDraftStatus("idle")
          setBrandAssetDraftLastSavedSnapshot(null)
          setIsLoading(false)
          return
        }

        const [company, draft] = await Promise.all([
          requestJson<CompanyResponse>(
            `/internal/v1/cxapp/company?id=${encodeURIComponent(companyId)}`
          ),
          requestJson<CompanyBrandAssetDraftReadResponse>(
            `/internal/v1/cxapp/company-brand-draft?companyId=${encodeURIComponent(companyId)}`
          ),
        ])

        if (!cancelled) {
          const nextForm = toCompanyFormValues(company.item)
          const designer = draft.item?.designer ?? nextForm.brandAssetDesigner
          const designerState = createBrandAssetStateFromDesigner(designer)
          const snapshot = createBrandAssetDraftSnapshot(
            designerState.sources,
            designerState.editors
          )

          hasHydratedBrandAssetDraftRef.current = true
          setForm(nextForm)
          setBrandAssetSources(designerState.sources)
          setBrandAssetEditors(designerState.editors)
          setBrandAssetDraftError(null)
          setBrandAssetDraftNotice(draft.item ? "Logo draft loaded." : null)
          setBrandAssetDraftStatus(draft.item ? "saved" : "idle")
          setBrandAssetDraftLastSavedSnapshot(snapshot)
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          hasHydratedBrandAssetDraftRef.current = false
          setBrandAssetDraftNotice(null)
          setLoadError(
            error instanceof Error ? error.message : "Failed to load company workspace data."
          )
          setIsLoading(false)
        }
      }
    }

    void loadWorkspaceData()

    return () => {
      cancelled = true
    }
  }, [companyId])

  useEffect(() => {
    let cancelled = false

    async function loadSourceMarkup() {
      const sourceEntries: Array<[BrandAssetVariant, string]> = [
        ["primary", resolvedBrandAssetSources.logoUrl],
        ["dark", resolvedBrandAssetSources.darkLogoUrl],
        ["favicon", resolvedBrandAssetSources.faviconUrl],
        ["print", resolvedBrandAssetSources.printLogoUrl],
      ]

      for (const [variant, sourceUrl] of sourceEntries) {
        if (!sourceUrl) {
          if (!cancelled) {
            setBrandAssetSourceMarkup((current) => ({ ...current, [variant]: null }))
          }
          continue
        }

        try {
          const svgMarkup = await requestText(sourceUrl)

          if (!cancelled) {
            setBrandAssetSourceMarkup((current) =>
              current[variant] === svgMarkup ? current : { ...current, [variant]: svgMarkup }
            )
          }
        } catch {
          if (!cancelled) {
            setBrandAssetSourceMarkup((current) => ({ ...current, [variant]: null }))
          }
        }
      }
    }

    void loadSourceMarkup()

    return () => {
      cancelled = true
    }
  }, [
    resolvedBrandAssetSources.darkLogoUrl,
    resolvedBrandAssetSources.faviconUrl,
    resolvedBrandAssetSources.logoUrl,
    resolvedBrandAssetSources.printLogoUrl,
  ])

  useEffect(() => {
    const defaults = getDefaultBrandAssetSources(svgLogos)

    setBrandAssetSources((current) => {
      const next = {
        logoUrl: current.logoUrl || defaults.logoUrl,
        darkLogoUrl: current.darkLogoUrl || defaults.darkLogoUrl,
        faviconUrl: current.faviconUrl || defaults.faviconUrl,
        printLogoUrl: current.printLogoUrl || defaults.printLogoUrl,
      }

      return (
        next.logoUrl === current.logoUrl &&
        next.darkLogoUrl === current.darkLogoUrl &&
        next.faviconUrl === current.faviconUrl &&
        next.printLogoUrl === current.printLogoUrl
      )
        ? current
        : next
    })
  }, [svgLogos])

  useEffect(() => {
    if (!companyId || !hasHydratedBrandAssetDraftRef.current) {
      return
    }

    if (currentBrandAssetDraftSnapshot === brandAssetDraftLastSavedSnapshot) {
      if (brandAssetDraftStatus === "dirty") {
        setBrandAssetDraftStatus("saved")
      }
      return
    }

    if (isSavingBrandAssetDraft || isPublishingBrandAssets) {
      return
    }

    setBrandAssetDraftStatus("dirty")

    const timeout = window.setTimeout(() => {
      void saveBrandAssetDraft({
        showSuccessToast: false,
        silent: true,
        payload: currentBrandAssetDraftPayload,
        snapshot: currentBrandAssetDraftSnapshot,
      })
    }, 900)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [
    brandAssetDraftLastSavedSnapshot,
    brandAssetDraftStatus,
    companyId,
    currentBrandAssetDraftPayload,
    currentBrandAssetDraftSnapshot,
    isPublishingBrandAssets,
    isSavingBrandAssetDraft,
  ])

  const brandAssetEditorTabs = useMemo(
    () =>
      brandAssetEditorDefinitions.map((asset) => {
        const sourceUrl =
          asset.variant === "primary"
            ? brandAssetSources.logoUrl
            : asset.variant === "dark"
              ? brandAssetSources.darkLogoUrl
              : asset.variant === "favicon"
                ? brandAssetSources.faviconUrl
                : brandAssetSources.printLogoUrl
        const resolvedSourceUrl =
          asset.variant === "primary"
            ? resolvedBrandAssetSources.logoUrl
            : asset.variant === "dark"
              ? resolvedBrandAssetSources.darkLogoUrl
              : asset.variant === "favicon"
                ? resolvedBrandAssetSources.faviconUrl
                : resolvedBrandAssetSources.printLogoUrl
        const editor = brandAssetEditors[asset.variant]
        const sourceMarkup = brandAssetSourceMarkup[asset.variant]
        const previewMarkup = (() => {
          if (!sourceMarkup) {
            return null
          }

          try {
            return buildDesignedSvgPreview(sourceMarkup, editor)
          } catch {
            return null
          }
        })()

        return {
          label: asset.label,
          value: asset.variant,
          content: (
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{asset.label} Preview</p>
                  <p className="text-sm text-muted-foreground">{asset.description}</p>
                </div>
                <div
                  className={`relative overflow-hidden rounded-[1.6rem] border border-border/70 ${asset.surfaceClassName}`}
                  style={{ minHeight: asset.variant === "favicon" ? 240 : 280 }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:24px_24px]" />
                  <div className="relative flex min-h-[inherit] items-center justify-center p-8">
                    <div
                      className="flex items-center justify-center rounded-[1rem] border border-dashed border-foreground/20 bg-background/60 px-6 py-5 shadow-sm"
                      style={{
                        width: `${Math.max(72, editor.canvasWidth)}px`,
                        height: `${Math.max(72, editor.canvasHeight)}px`,
                        transform: `translate(${editor.offsetX}px, ${editor.offsetY}px) scale(${editor.scale / 100})`,
                      }}
                    >
                      {previewMarkup ? (
                        <img
                          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(previewMarkup)}`}
                          alt={`${form.name || "Company"} ${asset.label.toLowerCase()} preview`}
                          className={`h-auto w-auto object-contain ${asset.imageClassName}`}
                        />
                      ) : resolvedSourceUrl ? (
                        <img
                          src={resolveMediaPreviewUrl(
                            resolvedSourceUrl,
                            `${form.name || "Company"} ${asset.label.toLowerCase()}`
                          )}
                          alt={`${form.name || "Company"} ${asset.label.toLowerCase()} preview`}
                          className={`h-auto w-auto object-contain ${asset.imageClassName}`}
                          onError={(event) =>
                            handleMediaPreviewError(
                              event,
                              `${form.name || "Company"} ${asset.label.toLowerCase()}`
                            )
                          }
                        />
                      ) : (
                        <div className="text-center text-sm text-muted-foreground">
                          Select an SVG file to start this editor.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs text-muted-foreground">
                    {asset.fileName}
                  </div>
                </div>
              </div>

              <div className="space-y-4 rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                <div className="space-y-2">
                  <Label>{asset.label} SVG Source</Label>
                  <FrameworkMediaPickerField
                    value={sourceUrl}
                    onChange={(value) => {
                      void handleBrandAssetSourceChange(asset.variant, value)
                    }}
                    previewAlt={`${form.name || "Company"} ${asset.label.toLowerCase()} source`}
                    showPreview={false}
                    helperText={asset.targetLabel}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!sourceUrl}
                    onClick={() => {
                      resetBrandAssetVariantToSourceDefaults(asset.variant)
                    }}
                  >
                    Reset To Source
                  </Button>
                  {asset.variant !== "primary" ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        copyPrimaryBrandAssetSettings(
                          asset.variant as Exclude<BrandAssetVariant, "primary">
                        )
                      }}
                    >
                      Copy Light Settings
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <CompanyField label="Canvas Width">
                    <Input
                      type="number"
                      min={32}
                      value={editor.canvasWidth}
                      onChange={(event) =>
                        updateBrandAssetEditor(
                          asset.variant,
                          "canvasWidth",
                          Math.max(32, Number(event.target.value) || 32)
                        )
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Canvas Height">
                    <Input
                      type="number"
                      min={32}
                      value={editor.canvasHeight}
                      onChange={(event) =>
                        updateBrandAssetEditor(
                          asset.variant,
                          "canvasHeight",
                          Math.max(32, Number(event.target.value) || 32)
                        )
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Offset X">
                    <Input
                      type="number"
                      value={editor.offsetX}
                      onChange={(event) =>
                        updateBrandAssetEditor(
                          asset.variant,
                          "offsetX",
                          Math.round(Number(event.target.value) || 0)
                        )
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Offset Y">
                    <Input
                      type="number"
                      value={editor.offsetY}
                      onChange={(event) =>
                        updateBrandAssetEditor(
                          asset.variant,
                          "offsetY",
                          Math.round(Number(event.target.value) || 0)
                        )
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Scale %">
                    <Input
                      type="number"
                      min={10}
                      max={300}
                      value={editor.scale}
                      onChange={(event) =>
                        updateBrandAssetEditor(
                          asset.variant,
                          "scale",
                          Math.min(300, Math.max(10, Math.round(Number(event.target.value) || 100)))
                        )
                      }
                    />
                  </CompanyField>
                  <div className="grid gap-2">
                    <Label>Fill Color</Label>
                    <Input
                      type="color"
                      value={editor.fillColor}
                      onChange={(event) =>
                        updateBrandAssetEditor(asset.variant, "fillColor", event.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Hover Color</Label>
                    <Input
                      type="color"
                      value={editor.hoverFillColor}
                      onChange={(event) =>
                        updateBrandAssetEditor(asset.variant, "hoverFillColor", event.target.value)
                      }
                    />
                  </div>
                </div>

              </div>
            </div>
          ),
        } satisfies AnimatedContentTab
      }),
    [brandAssetEditors, brandAssetSourceMarkup, brandAssetSources, form.name, resolvedBrandAssetSources]
  )

  const tabs = useMemo(
    () =>
      [
        {
          label: "Details",
          value: "details",
          content: (
            <div className="space-y-5">
              <CompanyFormSectionCard>
                <div className="grid gap-4 md:grid-cols-2">
                  <CompanyField label="Company Name" error={fieldErrors.name}>
                    <CompanyTextField
                      value={form.name}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, name: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Legal Name">
                    <CompanyTextField
                      value={form.legalName}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, legalName: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Tagline" className="md:col-span-2">
                    <CompanyTextField
                      value={form.tagline}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, tagline: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyCheckboxField
                    checked={form.isPrimary}
                    label="Primary company for application branding"
                    onCheckedChange={(checked) =>
                      setForm((current) => ({ ...current, isPrimary: checked }))
                    }
                  />
                  <div className="hidden md:block" aria-hidden="true" />
                  <CompanyField label="Registration Number">
                    <CompanyTextField
                      value={form.registrationNumber}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          registrationNumber: event.target.value,
                        }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="PAN">
                    <CompanyTextField
                      value={form.pan}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, pan: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Financial Year Start">
                    <Input
                      type="date"
                      value={form.financialYearStart}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          financialYearStart: event.target.value,
                        }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Books Start">
                    <Input
                      type="date"
                      value={form.booksStart}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, booksStart: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Website" className="md:col-span-2">
                    <CompanyTextField
                      value={form.website}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, website: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Description" className="md:col-span-2">
                    <Textarea
                      rows={4}
                      value={form.description}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, description: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <div className="md:col-span-2">
                    <CompanyStatusField
                      id="company-status"
                      checked={form.isActive}
                      onCheckedChange={(checked) =>
                        setForm((current) => ({ ...current, isActive: checked }))
                      }
                    />
                  </div>
                </div>
              </CompanyFormSectionCard>
            </div>
          ),
        },
        {
          label: "Logos",
          value: "logos",
          content: (
            <div className="space-y-5">
              <CompanyFormSectionCard
                title="Logo Designer"
              >
                <div className="space-y-4">
                  <AnimatedTabs defaultTabValue="primary" tabs={brandAssetEditorTabs} />

                  <div className="space-y-2 rounded-[1.25rem] border border-border/70 bg-background/70 p-4">
                    <p className="text-xs leading-5 text-muted-foreground">
                      Save the logo designer draft into the temporary branding store first, then
                      publish to overwrite `public/logo.svg`, `public/logo-dark.svg`, and
                      `public/favicon.svg`. Existing public files are backed up to
                      `storage/backups/branding` with a version suffix before replacement.
                    </p>
                    {!companyId ? (
                      <p className="text-xs text-muted-foreground">
                        Save the company first to enable draft save and public publish.
                      </p>
                    ) : null}
                    {companyId ? (
                      <p className="text-xs text-muted-foreground">
                        {brandAssetDraftStatus === "saving"
                          ? "Draft status: saving changes..."
                          : brandAssetDraftStatus === "error"
                            ? "Draft status: save failed."
                            : isBrandAssetDraftDirty || brandAssetDraftStatus === "dirty"
                              ? "Draft status: unsaved changes."
                              : brandAssetDraftStatus === "saved"
                                ? "Draft status: saved."
                                : "Draft status: ready."}
                      </p>
                    ) : null}
                    {brandAssetDraftNotice ? (
                      <p className="text-xs text-muted-foreground">{brandAssetDraftNotice}</p>
                    ) : null}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={
                          !companyId ||
                          (!isBrandAssetDraftDirty && brandAssetDraftStatus !== "error") ||
                          isSavingBrandAssetDraft ||
                          isPublishingBrandAssets
                        }
                        onClick={() => {
                          void saveBrandAssetDraft()
                        }}
                      >
                        {isSavingBrandAssetDraft ? "Saving Draft..." : "Save Draft"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:flex-1"
                        disabled={
                          !companyId ||
                          !resolvedBrandAssetSources.logoUrl ||
                          isSavingBrandAssetDraft ||
                          isPublishingBrandAssets
                        }
                        onClick={() => {
                          void handlePublishBrandAssets()
                        }}
                      >
                        {isPublishingBrandAssets ? "Publishing..." : "Publish To Public"}
                      </Button>
                    </div>
                  </div>
                </div>
                {brandAssetDraftError ? (
                  <CompanyFormMessage>{brandAssetDraftError}</CompanyFormMessage>
                ) : null}
                {publishError ? <CompanyFormMessage>{publishError}</CompanyFormMessage> : null}
              </CompanyFormSectionCard>
            </div>
          ),
        },
        {
          label: "Content",
          value: "content",
          content: (
            <CompanyFormSectionCard
              title="Brand Content"
              description="About copy used across the application shell, billing surfaces, and public web pages."
            >
              <div className="grid gap-4">
                <CompanyField label="Short About">
                  <Textarea
                    rows={4}
                    value={form.shortAbout}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, shortAbout: event.target.value }))
                    }
                  />
                </CompanyField>
                <CompanyField label="Long About">
                  <Textarea
                    rows={8}
                    value={form.longAbout}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, longAbout: event.target.value }))
                    }
                  />
                </CompanyField>
              </div>
            </CompanyFormSectionCard>
          ),
        },
        {
          label: "Communication",
          value: "communication",
          content: (
            <div className="space-y-5">
              <CompanyFormSectionCard
                title="Company Emails"
                description="Operational and communication email addresses."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    emails: [...current.emails, createEmptyCompanyEmail()],
                  }))
                }
              >
                {form.emails.map((email, index) => (
                  <CompanyCollectionRow
                    key={`email-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        emails: current.emails.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <CompanyField label="Email">
                        <Input
                          type="email"
                          value={email.email}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              emails: updateCollectionItem(current.emails, index, (item) => ({
                                ...item,
                                email: event.target.value,
                              })),
                            }))
                          }
                        />
                      </CompanyField>
                      <CompanySelectField
                        label="Email Type"
                        value={email.emailType}
                        options={companyEmailTypeOptions}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            emails: updateCollectionItem(current.emails, index, (item) => ({
                              ...item,
                              emailType: value,
                            })),
                          }))
                        }
                      />
                    </div>
                  </CompanyCollectionRow>
                ))}
              </CompanyFormSectionCard>

              <CompanyFormSectionCard
                title="Company Phones"
                description="Phone and messaging channels used by the company."
                onAdd={() =>
                  setForm((current) => ({
                    ...current,
                    phones: [...current.phones, createEmptyCompanyPhone()],
                  }))
                }
              >
                {form.phones.map((phone, index) => (
                  <CompanyCollectionRow
                    key={`phone-${index}`}
                    onRemove={() =>
                      setForm((current) => ({
                        ...current,
                        phones: current.phones.filter((_, itemIndex) => itemIndex !== index),
                      }))
                    }
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <CompanyField label="Phone Number">
                        <CompanyTextField
                          value={phone.phoneNumber}
                          onChange={(event) =>
                            setForm((current) => ({
                              ...current,
                              phones: updateCollectionItem(current.phones, index, (item) => ({
                                ...item,
                                phoneNumber: event.target.value,
                              })),
                            }))
                          }
                        />
                      </CompanyField>
                      <CompanySelectField
                        label="Phone Type"
                        value={phone.phoneType}
                        options={companyPhoneTypeOptions}
                        onValueChange={(value) =>
                          setForm((current) => ({
                            ...current,
                            phones: updateCollectionItem(current.phones, index, (item) => ({
                              ...item,
                              phoneType: value,
                            })),
                          }))
                        }
                      />
                      <CompanyCheckboxField
                        checked={phone.isPrimary}
                        label="Primary phone"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            phones: updateCollectionItem(current.phones, index, (item) => ({
                              ...item,
                              isPrimary: checked,
                            })),
                          }))
                        }
                      />
                    </div>
                  </CompanyCollectionRow>
                ))}
              </CompanyFormSectionCard>

              <CompanyFormSectionCard
                title="Social Links"
                description="Public brand links used in profile and storefront surfaces."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <CompanyField label="Facebook URL">
                    <CompanyTextField
                      value={form.facebookUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, facebookUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Twitter / X URL">
                    <CompanyTextField
                      value={form.twitterUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, twitterUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="Instagram URL">
                    <CompanyTextField
                      value={form.instagramUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, instagramUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                  <CompanyField label="YouTube URL">
                    <CompanyTextField
                      value={form.youtubeUrl}
                      onChange={(event) =>
                        setForm((current) => ({ ...current, youtubeUrl: event.target.value }))
                      }
                    />
                  </CompanyField>
                </div>
              </CompanyFormSectionCard>
            </div>
          ),
        },
        {
          label: "Addressing",
          value: "addressing",
          content: (
            <CompanyFormSectionCard
              title="Company Addresses"
              description="Billing, shipping, branch, and head-office locations."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  addresses: [...current.addresses, createEmptyCompanyAddress()],
                }))
              }
            >
              {form.addresses.map((address, index) => (
                <CompanyCollectionRow
                  key={`address-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      addresses: current.addresses.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <CompanyLookupField
                      label="Address Type"
                      items={lookupState.addressTypes}
                      value={address.addressTypeId}
                      createActionLabel='Create new "Address Type"'
                      onCreateNew={() => openCommonModule("addressTypes")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            addressTypeId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyCheckboxField
                      checked={address.isDefault}
                      label="Default address"
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            isDefault: checked,
                          })),
                        }))
                      }
                    />
                    <CompanyField label="Address Line 1" className="md:col-span-2">
                      <CompanyTextField
                        value={address.addressLine1}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              addressLine1: event.target.value,
                            })),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Address Line 2" className="md:col-span-2">
                      <CompanyTextField
                        value={address.addressLine2}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              addressLine2: event.target.value,
                            })),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyLookupField
                      label="Country"
                      items={lookupState.countries}
                      value={address.countryId}
                      createActionLabel='Create new "Country"'
                      onCreateNew={() => openCommonModule("countries")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            countryId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyLookupField
                      label="State"
                      items={lookupState.states}
                      value={address.stateId}
                      createActionLabel='Create new "State"'
                      onCreateNew={() => openCommonModule("states")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            stateId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyLookupField
                      label="District"
                      items={lookupState.districts}
                      value={address.districtId}
                      createActionLabel='Create new "District"'
                      onCreateNew={() => openCommonModule("districts")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            districtId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyLookupField
                      label="City"
                      items={lookupState.cities}
                      value={address.cityId}
                      createActionLabel='Create new "City"'
                      onCreateNew={() => openCommonModule("cities")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            cityId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyLookupField
                      label="Pincode"
                      items={lookupState.pincodes}
                      value={address.pincodeId}
                      createActionLabel='Create new "Pincode"'
                      onCreateNew={() => openCommonModule("pincodes")}
                      onValueChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          addresses: updateCollectionItem(current.addresses, index, (item) => ({
                            ...item,
                            pincodeId: value,
                          })),
                        }))
                      }
                    />
                    <CompanyField label="Latitude" className="md:col-span-1">
                      <Input
                        type="number"
                        step="0.0000001"
                        value={address.latitude ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              latitude: event.target.value ? Number(event.target.value) : null,
                            })),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Longitude" className="md:col-span-1">
                      <Input
                        type="number"
                        step="0.0000001"
                        value={address.longitude ?? ""}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            addresses: updateCollectionItem(current.addresses, index, (item) => ({
                              ...item,
                              longitude: event.target.value ? Number(event.target.value) : null,
                            })),
                          }))
                        }
                      />
                    </CompanyField>
                  </div>
                </CompanyCollectionRow>
              ))}
            </CompanyFormSectionCard>
          ),
        },
        {
          label: "Banking",
          value: "banking",
          content: (
            <CompanyFormSectionCard
              title="Bank Accounts"
              description="Settlement and accounting accounts used by the company."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  bankAccounts: [...current.bankAccounts, createEmptyCompanyBankAccount()],
                }))
              }
            >
              {form.bankAccounts.map((account, index) => (
                <CompanyCollectionRow
                  key={`bank-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      bankAccounts: current.bankAccounts.filter(
                        (_, itemIndex) => itemIndex !== index
                      ),
                    }))
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <CompanyField label="Bank Name">
                      <CompanyTextField
                        value={account.bankName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, bankName: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Branch">
                      <CompanyTextField
                        value={account.branch}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, branch: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Account Number">
                      <CompanyTextField
                        value={account.accountNumber}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, accountNumber: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="Account Holder Name">
                      <CompanyTextField
                        value={account.accountHolderName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, accountHolderName: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyField label="IFSC">
                      <CompanyTextField
                        value={account.ifsc}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            bankAccounts: updateCollectionItem(
                              current.bankAccounts,
                              index,
                              (item) => ({ ...item, ifsc: event.target.value })
                            ),
                          }))
                        }
                      />
                    </CompanyField>
                    <CompanyCheckboxField
                      checked={account.isPrimary}
                      label="Primary account"
                      onCheckedChange={(checked) =>
                        setForm((current) => ({
                          ...current,
                          bankAccounts: updateCollectionItem(
                            current.bankAccounts,
                            index,
                            (item) => ({ ...item, isPrimary: checked })
                          ),
                        }))
                      }
                    />
                  </div>
                </CompanyCollectionRow>
              ))}
            </CompanyFormSectionCard>
          ),
        },
      ] satisfies AnimatedContentTab[],
    [
      brandAssetEditorTabs,
      brandAssetDraftError,
      brandAssetDraftNotice,
      brandAssetDraftStatus,
      fieldErrors.name,
      form,
      companyId,
      isBrandAssetDraftDirty,
      isSavingBrandAssetDraft,
      isPublishingBrandAssets,
      lookupState,
      publishError,
      svgLogos,
    ]
  )

  async function handleSave() {
    const nextFieldErrors = validateCompanyForm(form)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setFormError("Validation failed. Fix the highlighted fields and save again.")
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      if (companyId) {
        await requestJson<CompanyResponse>(
          `/internal/v1/cxapp/company?id=${encodeURIComponent(companyId)}`,
          {
            method: "PATCH",
            body: JSON.stringify(form),
          }
        )
      } else {
        await requestJson<CompanyResponse>("/internal/v1/cxapp/companies", {
          method: "POST",
          body: JSON.stringify(form),
        })
      }

      void navigate("/dashboard/settings/companies")
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : `Failed to save ${form.name || "company"}.`
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function saveBrandAssetDraft(options?: {
    showSuccessToast?: boolean
    silent?: boolean
    payload?: CompanyBrandAssetDesigner
    snapshot?: string
  }) {
    if (!companyId) {
      throw new Error("Save the company first before saving the logo draft.")
    }

    setIsSavingBrandAssetDraft(true)
    setBrandAssetDraftError(null)
    setBrandAssetDraftStatus("saving")

    const payload = options?.payload ?? currentBrandAssetDraftPayload
    const snapshot = options?.snapshot ?? currentBrandAssetDraftSnapshot

    try {
      const response = await requestJson<CompanyBrandAssetDraftResponse>(
        `/internal/v1/cxapp/company-brand-draft?companyId=${encodeURIComponent(companyId)}`,
        {
          method: "PUT",
          body: JSON.stringify({
            designer: payload,
          }),
        }
      )

      setBrandAssetDraftNotice("Logo draft saved.")
      setBrandAssetDraftLastSavedSnapshot(snapshot)
      setBrandAssetDraftStatus("saved")

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "success",
          title: "Logo draft saved",
          description: "Designer values were saved to the temporary branding draft.",
        })
      }

      return response
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save the logo designer draft."

      setBrandAssetDraftError(message)
      setBrandAssetDraftStatus("error")

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "error",
          title: "Draft save failed",
          description: message,
        })
      }

      throw error
    } finally {
      setIsSavingBrandAssetDraft(false)
    }
  }

  async function handlePublishBrandAssets() {
    if (!companyId) {
      setPublishError("Save the company first before publishing brand files.")
      return
    }

    if (!resolvedBrandAssetSources.logoUrl) {
      setPublishError("Select at least the light theme SVG logo before publishing.")
      return
    }

    setIsPublishingBrandAssets(true)
    setPublishError(null)

    try {
      await saveBrandAssetDraft({
        showSuccessToast: false,
        silent: true,
        payload: currentBrandAssetDraftPayload,
        snapshot: currentBrandAssetDraftSnapshot,
      })

      const response = await requestJson<CompanyBrandAssetPublishResponse>(
        "/internal/v1/cxapp/company-brand-assets/publish",
        {
          method: "POST",
          body: JSON.stringify({
            primary: {
              sourceUrl: resolvedBrandAssetSources.logoUrl,
              ...brandAssetEditors.primary,
            },
            dark: {
              sourceUrl: resolvedBrandAssetSources.darkLogoUrl,
              ...brandAssetEditors.dark,
            },
            favicon: {
              sourceUrl: resolvedBrandAssetSources.faviconUrl,
              ...brandAssetEditors.favicon,
            },
          }),
        }
      )

      showAppToast({
        variant: "success",
        title: "Brand SVGs published",
        description: response.item.message,
      })

      window.setTimeout(() => {
        window.location.reload()
      }, 900)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to publish the company brand SVG files."

      setPublishError(message)
      showAppToast({
        variant: "error",
        title: "Brand publish failed",
        description: message,
      })
    } finally {
      setIsPublishingBrandAssets(false)
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading company form..." />
  }

  if (loadError) {
    return <StateCard message={loadError} />
  }

  return (
    <div
      className="relative space-y-6"
      data-technical-name={companyUpsertTechnicalName}
    >
      <TechnicalNameBadge
        name={companyUpsertTechnicalName}
        className="absolute -top-3 right-0 z-20"
      />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to="/dashboard/settings/companies">
              <ArrowLeftIcon className="size-4" />
              Back to companies
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isEditing ? "Update Company" : "Create Company"}
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Capture company identity, communication, addressing, banking, and public
              profile surfaces in one structured workspace.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void navigate("/dashboard/settings/companies")
            }}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update Company" : "Save Company"}
          </Button>
        </div>
      </div>

      {formError ? <CompanyFormMessage>{formError}</CompanyFormMessage> : null}

      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
    </div>
  )
}
