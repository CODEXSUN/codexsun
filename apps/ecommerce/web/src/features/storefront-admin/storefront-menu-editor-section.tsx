import type { CSSProperties, ReactNode } from "react"
import { RotateCcw, Save } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontMenuSurfaceDesign, StorefrontSettings } from "@ecommerce/shared"
import type { CompanyBrandAssetDesigner } from "@cxapp/shared"
import { defaultCompanyBrandAssetDesigner } from "@cxapp/shared"
import { defaultStorefrontSettings } from "@ecommerce/src/data/storefront-seed"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import {
  handleMediaPreviewError,
  resolveMediaPreviewUrl,
} from "@cxapp/web/src/features/framework-media/media-url"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { resolveRuntimeBrandLogoUrl } from "@/features/branding/runtime-brand-logo"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { GlobalLoader } from "@/registry/concerns/feedback/global-loader"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontFooterSurface } from "../../components/storefront-footer-surface"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"
import { getMenuLogoFrameStyle, getMenuLogoImageStyle } from "../../lib/storefront-menu-designer"
import {
  StorefrontDesignerPermissionCard,
  useStorefrontDesignerAccess,
} from "./storefront-designer-access"

type BrandAssetVariant = "primary" | "dark" | "favicon"
type BrandAssetDraftStatus = "idle" | "dirty" | "saving" | "saved" | "error"

const menuBrandAssetDefinitions: Array<{
  description: string
  fileName: string
  label: string
  targetLabel: string
  toneClassName: string
  variant: BrandAssetVariant
}> = [
  {
    variant: "primary",
    label: "Light logo",
    fileName: "logo.svg",
    description: "Used by the storefront top menu and the app menu light logo surface.",
    targetLabel: "Publish target: public/logo.svg",
    toneClassName: "bg-[linear-gradient(135deg,#f5f1eb_0%,#ece5dc_100%)]",
  },
  {
    variant: "dark",
    label: "Dark logo",
    fileName: "logo-dark.svg",
    description: "Used by dark storefront surfaces such as the footer logo treatment.",
    targetLabel: "Publish target: public/logo-dark.svg",
    toneClassName: "bg-[linear-gradient(135deg,#181818_0%,#31261d_100%)]",
  },
  {
    variant: "favicon",
    label: "Favicon",
    fileName: "favicon.svg",
    description: "Used for the browser tab icon and page title branding.",
    targetLabel: "Publish target: public/favicon.svg",
    toneClassName: "bg-[linear-gradient(135deg,#edf2f7_0%,#d8e1eb_100%)]",
  },
]

function DesignField({
  children,
  label,
  resetAction,
}: {
  children: ReactNode
  label: string
  resetAction?: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label>{label}</Label>
        {resetAction ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            onClick={resetAction}
          >
            <RotateCcw className="size-4" />
            <span className="sr-only">{`Reset ${label}`}</span>
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

function updateNumberField(
  value: string,
  fallback: number,
  options: {
    max: number
    min: number
  }
) {
  return Math.min(options.max, Math.max(options.min, Math.round(Number(value) || fallback)))
}

function updateMenuSurfaceField(
  current: StorefrontMenuSurfaceDesign,
  key: keyof StorefrontMenuSurfaceDesign,
  value: number | string
) {
  return {
    ...current,
    [key]: value,
  }
}

function getBrandAssetSource(
  designer: CompanyBrandAssetDesigner,
  variant: BrandAssetVariant
) {
  return designer[variant].sourceUrl
}

function updateBrandAssetSource(
  designer: CompanyBrandAssetDesigner,
  variant: BrandAssetVariant,
  sourceUrl: string
) {
  return {
    ...designer,
    [variant]: {
      ...designer[variant],
      sourceUrl,
    },
  }
}

function createBrandAssetSnapshot(designer: CompanyBrandAssetDesigner) {
  return JSON.stringify(designer)
}

function PreviewShell({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-[1.4rem] border border-[#e3d8ca] bg-[linear-gradient(180deg,#fbf7f1_0%,#f4ece1_100%)] p-4 shadow-[0_20px_44px_-34px_rgba(34,22,13,0.3)]">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(139,94,52,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(139,94,52,0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="relative">{children}</div>
    </div>
  )
}

function LogoAreaPreview({
  brandName,
  logoUrl,
  menuDesign,
  secondaryText,
  surfaceTone,
}: {
  brandName: string
  logoUrl: string
  menuDesign: StorefrontMenuSurfaceDesign
  secondaryText: string
  surfaceTone: {
    frameClassName: string
    titleClassName: string
    subtitleClassName: string
  }
}) {
  return (
    <div
      className={`group flex items-center gap-3 rounded-[1.4rem] border border-transparent px-3 py-3 transition-colors duration-200 group-hover:border-[var(--menu-logo-hover-color)] ${surfaceTone.frameClassName}`}
      style={
        {
          "--menu-logo-hover-color": menuDesign.logoHoverColor,
        } as CSSProperties
      }
    >
      <div
        className="relative flex shrink-0 items-center justify-center overflow-hidden rounded-[1rem] border border-black/10 shadow-sm"
        style={getMenuLogoFrameStyle(menuDesign)}
      >
        <img
          src={logoUrl}
          alt={brandName}
          className="absolute rounded-lg object-contain"
          style={getMenuLogoImageStyle(menuDesign)}
        />
      </div>
      <div className="min-w-0">
        <p className={`truncate font-semibold uppercase tracking-[0.2em] transition-colors group-hover:text-[var(--menu-logo-hover-color)] ${surfaceTone.titleClassName}`}>
          {brandName}
        </p>
        <p className={`truncate text-[11px] uppercase tracking-[0.18em] transition-colors group-hover:text-[var(--menu-logo-hover-color)] ${surfaceTone.subtitleClassName}`}>
          {secondaryText}
        </p>
      </div>
    </div>
  )
}

function NumberField({
  label,
  max,
  min,
  onChange,
  value,
}: {
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  value: number
}) {
  return (
    <DesignField label={label}>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(updateNumberField(event.target.value, value, { min, max }))}
      />
    </DesignField>
  )
}

function ColorField({
  label,
  onChange,
  resetAction,
  value,
}: {
  label: string
  onChange: (value: string) => void
  resetAction?: () => void
  value: string
}) {
  return (
    <DesignField label={label} resetAction={resetAction}>
      <div className="flex items-center gap-3">
        <Input
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 p-1"
        />
        <Input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </DesignField>
  )
}

function MenuSurfaceEditor({
  defaultDesign,
  description,
  draft,
  onChange,
  preview,
  title,
}: {
  defaultDesign: StorefrontMenuSurfaceDesign
  description: string
  draft: StorefrontMenuSurfaceDesign
  onChange: (next: StorefrontMenuSurfaceDesign) => void
  preview: ReactNode
  title: string
}) {
  return (
    <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-[1.1rem] tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 p-5 xl:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <div className="space-y-5 rounded-[1.3rem] border border-border/70 bg-background/80 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <DesignField label="Logo tone">
              <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background px-3 py-2.5">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {draft.logoVariant === "dark" ? "Dark" : "Light"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Switch the surface between the published light and dark logo assets.
                  </p>
                </div>
                <Switch
                  checked={draft.logoVariant === "dark"}
                  onCheckedChange={(checked) =>
                    onChange(
                      updateMenuSurfaceField(
                        draft,
                        "logoVariant",
                        checked ? "dark" : "primary"
                      )
                    )
                  }
                  aria-label="Toggle logo tone"
                />
              </div>
            </DesignField>
            <NumberField
              label="Area width"
              min={48}
              max={640}
              value={draft.frameWidth}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "frameWidth", value))}
            />
            <NumberField
              label="Area height"
              min={40}
              max={240}
              value={draft.frameHeight}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "frameHeight", value))}
            />
            <NumberField
              label="Logo width"
              min={16}
              max={480}
              value={draft.logoWidth}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "logoWidth", value))}
            />
            <NumberField
              label="Logo height"
              min={16}
              max={240}
              value={draft.logoHeight}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "logoHeight", value))}
            />
            <NumberField
              label="Offset X"
              min={-320}
              max={320}
              value={draft.offsetX}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "offsetX", value))}
            />
            <NumberField
              label="Offset Y"
              min={-160}
              max={160}
              value={draft.offsetY}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "offsetY", value))}
            />
          </div>

          <DesignField
            label="Position reset"
            resetAction={() =>
              onChange({
                ...draft,
                offsetX: defaultDesign.offsetX,
                offsetY: defaultDesign.offsetY,
              })
            }
          >
            <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">
              Restore `offsetX` and `offsetY` to the default position for this surface.
            </div>
          </DesignField>

          <div className="grid gap-3">
            <ColorField
              label="Hover color"
              value={draft.logoHoverColor}
              onChange={(value) => onChange(updateMenuSurfaceField(draft, "logoHoverColor", value))}
              resetAction={() =>
                onChange(updateMenuSurfaceField(draft, "logoHoverColor", defaultDesign.logoHoverColor))
              }
            />
            <ColorField
              label="Area background"
              value={draft.areaBackgroundColor}
              onChange={(value) =>
                onChange(updateMenuSurfaceField(draft, "areaBackgroundColor", value))
              }
              resetAction={() =>
                onChange(
                  updateMenuSurfaceField(
                    draft,
                    "areaBackgroundColor",
                    defaultDesign.areaBackgroundColor
                  )
                )
              }
            />
            <ColorField
              label="Logo background"
              value={draft.logoBackgroundColor}
              onChange={(value) =>
                onChange(updateMenuSurfaceField(draft, "logoBackgroundColor", value))
              }
              resetAction={() =>
                onChange(
                  updateMenuSurfaceField(
                    draft,
                    "logoBackgroundColor",
                    defaultDesign.logoBackgroundColor
                  )
                )
              }
            />
          </div>
        </div>

        {preview}
      </CardContent>
    </Card>
  )
}

function MenuBrandAssetCard({
  companyName,
  disabled,
  fileName,
  label,
  onChange,
  sourceUrl,
  targetLabel,
  toneClassName,
}: {
  companyName: string
  disabled: boolean
  fileName: string
  label: string
  onChange: (value: string) => void
  sourceUrl: string
  targetLabel: string
  toneClassName: string
}) {
  const hasSource = sourceUrl.trim().length > 0

  return (
    <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
      <CardHeader className="border-b border-border/70">
        <CardTitle className="text-base tracking-tight">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        <div className="space-y-2">
          <div className={disabled ? "pointer-events-none opacity-60" : undefined}>
            <FrameworkMediaPickerField
              value={sourceUrl}
              onChange={onChange}
              previewAlt={`${companyName} ${label.toLowerCase()} source`}
              showPreview={false}
              helperText={targetLabel}
            />
          </div>
        </div>
        <div>
          <div className={`relative overflow-hidden rounded-[1.2rem] border border-border/70 ${toneClassName}`}>
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.22)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.22)_1px,transparent_1px)] bg-[size:20px_20px]" />
            <div className="relative flex min-h-[148px] items-center justify-center p-4">
              {hasSource ? (
                <img
                  src={resolveMediaPreviewUrl(sourceUrl, `${companyName} ${label.toLowerCase()}`)}
                  alt={`${companyName} ${label.toLowerCase()} preview`}
                  className="max-h-16 max-w-[78%] object-contain"
                  onError={(event) =>
                    handleMediaPreviewError(event, `${companyName} ${label.toLowerCase()}`)
                  }
                />
              ) : (
                <div className="px-4 text-center text-xs text-muted-foreground">
                  Select or upload an SVG file to update {fileName}.
                </div>
              )}
            </div>
            <div className="absolute bottom-2 left-2 rounded-full border border-border/70 bg-background/90 px-2.5 py-1 text-[11px] text-muted-foreground">
              {fileName}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function AppMenuPreview({
  brandName,
  logoUrl,
  menuDesign,
  tagline,
}: {
  brandName: string
  logoUrl: string
  menuDesign: StorefrontMenuSurfaceDesign
  tagline: string
}) {
  return (
    <PreviewShell>
      <div className="w-full max-w-[420px] rounded-[1.5rem] border border-[#ddd4c9] bg-[#f7f4ef] p-4">
        <LogoAreaPreview
          brandName={brandName}
          logoUrl={logoUrl}
          menuDesign={menuDesign}
          secondaryText={tagline}
          surfaceTone={{
            frameClassName: "bg-white shadow-sm",
            titleClassName: "text-sm text-foreground",
            subtitleClassName: "text-sm text-muted-foreground",
          }}
        />
      </div>
    </PreviewShell>
  )
}

function TopMenuPreview({
  brandName,
  logoUrl,
  menuDesign,
  tagline,
}: {
  brandName: string
  logoUrl: string
  menuDesign: StorefrontMenuSurfaceDesign
  tagline: string
}) {
  return (
    <PreviewShell>
      <div className="rounded-[1.5rem] border border-[#ece7df] bg-[#fbfaf7] p-4">
        <LogoAreaPreview
          brandName={brandName}
          logoUrl={logoUrl}
          menuDesign={menuDesign}
          secondaryText={tagline}
          surfaceTone={{
            frameClassName: "bg-transparent",
            titleClassName: "text-[1rem] text-[#181818]",
            subtitleClassName: "text-[#a39689]",
          }}
        />
      </div>
    </PreviewShell>
  )
}

function GlobalLoaderPreview({
  brandOverride,
  menuDesign,
}: {
  brandOverride: {
    darkLogoUrl?: string | null
    logoUrl?: string | null
  } | null
  menuDesign: StorefrontMenuSurfaceDesign
}) {
  return (
    <PreviewShell>
      <div className="overflow-hidden rounded-[1.5rem] border border-[#ddd4c9] bg-[#f7f4ef]">
        <GlobalLoader
          fullScreen={false}
          designOverride={menuDesign}
          brandOverride={brandOverride}
          className="min-h-[220px] bg-transparent"
        />
      </div>
    </PreviewShell>
  )
}

export function StorefrontMenuEditorSection() {
  const { canApproveStorefrontDesigner, canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const { brand } = useRuntimeBrand()
  const [draft, setDraft] = useState<StorefrontSettings | null>(null)
  const [brandDesigner, setBrandDesigner] = useState<CompanyBrandAssetDesigner | null>(null)
  const [brandCompanyId, setBrandCompanyId] = useState<string | null>(null)
  const [brandCompanyName, setBrandCompanyName] = useState("Primary company")
  const [brandDraftError, setBrandDraftError] = useState<string | null>(null)
  const [brandDraftNotice, setBrandDraftNotice] = useState<string | null>(null)
  const [brandDraftStatus, setBrandDraftStatus] = useState<BrandAssetDraftStatus>("idle")
  const [brandLastSavedSnapshot, setBrandLastSavedSnapshot] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPublishingBrandAssets, setIsPublishingBrandAssets] = useState(false)
  const [isSavingBrandDraft, setIsSavingBrandDraft] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  useGlobalLoading(
    isLoading || isSaving || isPublishing || isSavingBrandDraft || isPublishingBrandAssets
  )

  const currentBrandSnapshot = brandDesigner ? createBrandAssetSnapshot(brandDesigner) : null
  const isBrandDraftDirty =
    brandDesigner !== null &&
    currentBrandSnapshot !== null &&
    currentBrandSnapshot !== brandLastSavedSnapshot

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const accessToken = getStoredAccessToken()

        if (!accessToken) {
          throw new Error("Admin access token is required.")
        }

        const [workflow, companies] = await Promise.all([
          storefrontApi.getStorefrontSettingsWorkflow(accessToken),
          storefrontApi.getCompanies(accessToken),
        ])
        const primaryCompany = companies.items.find((item) => item.isPrimary) ?? companies.items[0] ?? null

        if (!primaryCompany) {
          throw new Error("Create a primary company before using the menu logo publisher.")
        }

        const [company, brandDraft] = await Promise.all([
          storefrontApi.getCompany(accessToken, primaryCompany.id),
          storefrontApi.getCompanyBrandDraft(accessToken, primaryCompany.id),
        ])
        const resolvedDesigner = brandDraft.item?.designer ?? company.item.brandAssetDesigner
        const snapshot = createBrandAssetSnapshot(resolvedDesigner)

        if (!cancelled) {
          setDraft(workflow.previewSettings)
          setBrandCompanyId(primaryCompany.id)
          setBrandCompanyName(company.item.name)
          setBrandDesigner(resolvedDesigner)
          setBrandDraftError(null)
          setBrandDraftNotice(brandDraft.item ? "Logo draft loaded from the company branding workspace." : null)
          setBrandDraftStatus(brandDraft.item ? "saved" : "idle")
          setBrandLastSavedSnapshot(snapshot)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load menu designer."
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!brandDesigner || !currentBrandSnapshot) {
      return
    }

    if (currentBrandSnapshot === brandLastSavedSnapshot) {
      if (brandDraftStatus === "dirty") {
        setBrandDraftStatus("saved")
      }
      return
    }

    if (isSavingBrandDraft || isPublishingBrandAssets) {
      return
    }

    setBrandDraftStatus("dirty")
  }, [
    brandDesigner,
    brandDraftStatus,
    brandLastSavedSnapshot,
    currentBrandSnapshot,
    isPublishingBrandAssets,
    isSavingBrandDraft,
  ])

  async function saveBrandDraft(options?: {
    showSuccessToast?: boolean
    silent?: boolean
  }) {
    if (!brandCompanyId || !brandDesigner || !currentBrandSnapshot) {
      throw new Error("Primary company branding is unavailable.")
    }

    setIsSavingBrandDraft(true)
    setBrandDraftError(null)
    setBrandDraftStatus("saving")

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      await storefrontApi.saveCompanyBrandDraft(accessToken, brandCompanyId, brandDesigner)
      setBrandDraftNotice("Logo draft saved.")
      setBrandDraftStatus("saved")
      setBrandLastSavedSnapshot(currentBrandSnapshot)

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "success",
          title: "Logo draft saved",
          description: "The primary company branding draft was updated from the menu editor.",
        })
      }
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save the logo draft."
      setBrandDraftError(message)
      setBrandDraftStatus("error")

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "error",
          title: "Draft save failed",
          description: message,
        })
      }

      throw saveError
    } finally {
      setIsSavingBrandDraft(false)
    }
  }

  async function handlePublishBrandAssets(options?: {
    reloadAfterPublish?: boolean
    showSuccessToast?: boolean
    silent?: boolean
  }) {
    if (!brandDesigner || !brandCompanyId) {
      setBrandDraftError("Primary company branding is unavailable.")
      return
    }

    if (!brandDesigner.primary.sourceUrl.trim()) {
      setBrandDraftError("Select at least the light logo SVG before publishing.")
      return
    }

    setIsPublishingBrandAssets(true)
    setBrandDraftError(null)

    try {
      await saveBrandDraft({
        showSuccessToast: false,
        silent: true,
      })

      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const response = await storefrontApi.publishCompanyBrandAssets(accessToken, {
        primary: brandDesigner.primary,
        dark: brandDesigner.dark.sourceUrl.trim()
          ? brandDesigner.dark
          : {
              ...defaultCompanyBrandAssetDesigner.dark,
              sourceUrl: brandDesigner.primary.sourceUrl,
            },
        favicon: brandDesigner.favicon.sourceUrl.trim()
          ? brandDesigner.favicon
          : {
              ...defaultCompanyBrandAssetDesigner.favicon,
              sourceUrl: brandDesigner.primary.sourceUrl,
            },
      })

      setBrandDraftNotice(response.item.message)
      invalidateStorefrontShellData()

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "success",
          title: "Brand SVGs published",
          description: response.item.message,
        })
      }

      if (options?.reloadAfterPublish !== false) {
        window.setTimeout(() => {
          window.location.reload()
        }, 900)
      }
    } catch (publishError) {
      const message =
        publishError instanceof Error ? publishError.message : "Failed to publish brand SVG files."
      setBrandDraftError(message)

      if (options?.showSuccessToast !== false && !options?.silent) {
        showAppToast({
          variant: "error",
          title: "Brand publish failed",
          description: message,
        })
      }
    } finally {
      setIsPublishingBrandAssets(false)
    }
  }

  async function handleSave() {
    if (!draft) {
      return
    }

    if (!canEditStorefrontDesigner) {
      setError("This role has read-only storefront designer access.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const saved = await storefrontApi.updateStorefrontSettings(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Menu Designer",
        action: "saved",
        recordName: "Storefront menu settings",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save menu designer."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Menu designer save failed.",
        description: message,
      })
      throw saveError
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!draft) {
      return
    }

    if (!canApproveStorefrontDesigner) {
      setError("This role does not have storefront publish access.")
      return
    }

    setIsPublishing(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const workflow = await storefrontApi.publishStorefrontSettings(accessToken)
      setDraft(workflow.previewSettings)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Menu Designer",
        action: "published",
        recordName: "Storefront menu settings",
      })
    } catch (publishError) {
      const message =
        publishError instanceof Error ? publishError.message : "Failed to publish menu designer."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Menu designer publish failed.",
        description: message,
      })
      throw publishError
    } finally {
      setIsPublishing(false)
    }
  }

  async function handlePublishAll() {
    if (!draft) {
      return
    }

    if (!canApproveStorefrontDesigner) {
      setError("This role does not have storefront publish access.")
      return
    }

    if (!canEditStorefrontDesigner) {
      setError("This role has read-only storefront designer access.")
      return
    }

    try {
      await handleSave()
      await handlePublishBrandAssets({
        reloadAfterPublish: false,
        showSuccessToast: false,
        silent: true,
      })
      await handlePublish()

      showAppToast({
        variant: "success",
        title: "Storefront published",
        description:
          "Menu designer settings and live brand assets were saved and published together.",
      })

      window.setTimeout(() => {
        window.location.reload()
      }, 900)
    } catch {
      // Each underlying step already reports its own error state and toast.
    }
  }

  const previewBrand =
    brand && brandDesigner
      ? {
          ...brand,
          logoUrl: brandDesigner.primary.sourceUrl.trim() || brand.logoUrl,
          darkLogoUrl:
            brandDesigner.dark.sourceUrl.trim() ||
            brand.darkLogoUrl ||
            brandDesigner.primary.sourceUrl.trim() ||
            brand.logoUrl,
        }
      : brand
  function resolvePreviewLogoUrl(menuDesign: StorefrontMenuSurfaceDesign) {
    const requestedVariant = menuDesign.logoVariant
    const selectedSource =
      requestedVariant === "dark"
        ? brandDesigner?.dark.sourceUrl.trim() || brandDesigner?.primary.sourceUrl.trim()
        : brandDesigner?.primary.sourceUrl.trim()

    return selectedSource || resolveRuntimeBrandLogoUrl(previewBrand, requestedVariant)
  }

  const brandName = brand?.brandName ?? "Codexsun"
  const tagline = brand?.tagline ?? "Smart IT. Trusted value."

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <StorefrontDesignerPermissionCard
        canEdit={canEditStorefrontDesigner}
        canApprove={canApproveStorefrontDesigner}
      />

      <div className="space-y-3">
          {brandDesigner ? (
            <div className="grid gap-4 xl:grid-cols-3">
              {menuBrandAssetDefinitions.map((asset) => (
                <MenuBrandAssetCard
                  key={asset.variant}
                  companyName={brandCompanyName}
                  disabled={!canEditStorefrontDesigner || isSavingBrandDraft || isPublishingBrandAssets}
                  fileName={asset.fileName}
                  label={asset.label}
                  sourceUrl={getBrandAssetSource(brandDesigner, asset.variant)}
                  targetLabel={asset.targetLabel}
                  toneClassName={asset.toneClassName}
                  onChange={(value) => {
                    setBrandDesigner((current) =>
                      current ? updateBrandAssetSource(current, asset.variant, value) : current
                    )
                    setBrandDraftNotice(null)
                    setBrandDraftError(null)
                  }}
                />
              ))}
            </div>
          ) : null}

          {brandDraftNotice ? (
            <p className="text-xs text-muted-foreground">{brandDraftNotice}</p>
          ) : null}

          {brandDraftError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {brandDraftError}
            </div>
          ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-w-[170px] flex-1"
            disabled={
              !brandDesigner ||
              !canEditStorefrontDesigner ||
              (!isBrandDraftDirty && brandDraftStatus !== "error") ||
              isSavingBrandDraft ||
              isPublishingBrandAssets ||
              isSaving ||
              isPublishing
            }
            onClick={() => {
              void saveBrandDraft()
            }}
          >
            {isSavingBrandDraft ? "Saving draft..." : "Save logo draft"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-[170px] flex-1"
            disabled={
              !brandDesigner ||
              !canApproveStorefrontDesigner ||
              !brandDesigner.primary.sourceUrl.trim() ||
              isSavingBrandDraft ||
              isPublishingBrandAssets ||
              isSaving ||
              isPublishing
            }
            onClick={() => {
              void handlePublishBrandAssets()
            }}
          >
            {isPublishingBrandAssets ? "Publishing..." : "Publish logo live"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-[170px] flex-1"
            disabled={
              !draft ||
              !canApproveStorefrontDesigner ||
              !canEditStorefrontDesigner ||
              isPublishing ||
              isSaving ||
              isSavingBrandDraft ||
              isPublishingBrandAssets
            }
            onClick={() => void handlePublishAll()}
          >
            {isPublishing || isSaving || isSavingBrandDraft || isPublishingBrandAssets
              ? "Publishing..."
              : "Publish live"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-w-[170px] flex-1 gap-2"
            disabled={
              !draft ||
              !canApproveStorefrontDesigner ||
              isPublishing ||
              isSaving ||
              isSavingBrandDraft ||
              isPublishingBrandAssets
            }
            onClick={() => void handlePublish()}
          >
            {isPublishing ? "Publishing..." : "Publish menu only"}
          </Button>
          <Button
            type="button"
            className="min-w-[170px] flex-1 gap-2"
            disabled={
              !draft ||
              !canEditStorefrontDesigner ||
              isSaving ||
              isPublishing ||
              isSavingBrandDraft ||
              isPublishingBrandAssets
            }
            onClick={() => void handleSave()}
          >
            <Save className="size-4" />
            {isSaving ? "Saving..." : "Save menu designer"}
          </Button>
        </div>
      </div>

      {draft ? (
        <div className="space-y-4 pt-2">
          <MenuSurfaceEditor
            title="Top menu"
            description="Tune the header logo frame directly. Use width, height, and offsets to fit different client logos."
            defaultDesign={defaultStorefrontSettings.menuDesigner.topMenu}
            draft={draft.menuDesigner.topMenu}
            onChange={(next) =>
              setDraft({
                ...draft,
                menuDesigner: {
                  ...draft.menuDesigner,
                  topMenu: next,
                },
              })
            }
            preview={
              <TopMenuPreview
                brandName={brandName}
                logoUrl={resolvePreviewLogoUrl(draft.menuDesigner.topMenu)}
                menuDesign={draft.menuDesigner.topMenu}
                tagline={tagline}
              />
            }
          />

          <MenuSurfaceEditor
            title="Footer menu"
            description="Tune the footer logo frame and use the background colors to test light or dark logo treatments."
            defaultDesign={defaultStorefrontSettings.menuDesigner.footerMenu}
            draft={draft.menuDesigner.footerMenu}
            onChange={(next) =>
              setDraft({
                ...draft,
                menuDesigner: {
                  ...draft.menuDesigner,
                  footerMenu: next,
                },
              })
            }
            preview={
              <PreviewShell>
                <StorefrontFooterSurface
                  brand={previewBrand}
                  footer={draft.footer}
                  menuDesign={draft.menuDesigner.footerMenu}
                  previewMode
                  supportEmail={draft.supportEmail}
                  supportPhone={draft.supportPhone}
                />
              </PreviewShell>
            }
          />

          <MenuSurfaceEditor
            title="App menu"
            description="Tune the dashboard sidebar logo area with direct numeric sizing and offset controls."
            defaultDesign={defaultStorefrontSettings.menuDesigner.appMenu}
            draft={draft.menuDesigner.appMenu}
            onChange={(next) =>
              setDraft({
                ...draft,
                menuDesigner: {
                  ...draft.menuDesigner,
                  appMenu: next,
                },
              })
            }
            preview={
              <AppMenuPreview
                brandName={brandName}
                logoUrl={resolvePreviewLogoUrl(draft.menuDesigner.appMenu)}
                menuDesign={draft.menuDesigner.appMenu}
                tagline={tagline}
              />
            }
          />

          <MenuSurfaceEditor
            title="Global loader"
            description="Tune the loading logo area and choose whether the loader uses the light or dark runtime logo."
            defaultDesign={defaultStorefrontSettings.menuDesigner.globalLoader}
            draft={draft.menuDesigner.globalLoader}
            onChange={(next) =>
              setDraft({
                ...draft,
                menuDesigner: {
                  ...draft.menuDesigner,
                  globalLoader: next,
                },
              })
            }
            preview={
              <GlobalLoaderPreview
                brandOverride={previewBrand}
                menuDesign={draft.menuDesigner.globalLoader}
              />
            }
          />
        </div>
      ) : null}
    </div>
  )
}
