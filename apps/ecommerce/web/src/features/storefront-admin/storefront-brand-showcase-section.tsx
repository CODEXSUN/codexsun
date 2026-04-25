import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontBrandDiscoveryCard, StorefrontBrandShowcase } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import { BrandStoryRail } from "@/components/blocks/brand-story-rail"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"
import {
  StorefrontDesignerPermissionCard,
  useStorefrontDesignerAccess,
} from "./storefront-designer-access"
import {
  StorefrontDesignerValidationCard,
  validateBrandShowcaseDesigner,
} from "./storefront-designer-validation"

function createBrandCard(index: number): StorefrontBrandDiscoveryCard {
  return {
    id: `brand-showcase:${Date.now()}-${index}`,
    brandName: `Brand ${index + 1}`,
    title: `Brand ${index + 1}`,
    summary: "Add a short brand story for this logo.",
    imageUrl: "",
    href: "/shop/catalog",
  }
}

function normalizeBrandAssetInput(value: string) {
  const trimmed = value.trim()

  if (!trimmed.startsWith("<svg")) {
    return trimmed
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`
}

function decodeSvgDataUrl(value: string) {
  if (!value.startsWith("data:image/svg+xml;utf8,")) {
    return value
  }

  try {
    return decodeURIComponent(value.replace("data:image/svg+xml;utf8,", ""))
  } catch {
    return value
  }
}

export function StorefrontBrandShowcaseSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const [draft, setDraft] = useState<StorefrontBrandShowcase | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const validationIssues = draft ? validateBrandShowcaseDesigner(draft) : []
  const hasValidationIssues = validationIssues.length > 0
  useGlobalLoading(isLoading || isSaving)

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

        const nextConfig = await storefrontApi.getStorefrontBrandShowcase(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load brand stories settings."
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

  async function handleSave() {
    if (!draft) {
      return
    }
    if (!canEditStorefrontDesigner) {
      setError("This role has read-only storefront designer access.")
      return
    }
    if (hasValidationIssues) {
      setError(validationIssues[0]?.message ?? "Fix validation issues before saving.")
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const saved = await storefrontApi.updateStorefrontBrandShowcase(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Brand Stories",
        action: "saved",
        recordName: "Storefront brand stories",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save brand stories settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Brand stories save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateCard(
    cardId: string,
    updater: (card: StorefrontBrandDiscoveryCard) => StorefrontBrandDiscoveryCard
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            cards: current.cards.map((card) => (card.id === cardId ? updater(card) : card)),
          }
        : current
    )
  }

  const tabs: AnimatedContentTab[] = draft
    ? [
        {
          label: "Content",
          value: "content",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3 md:col-span-2">
                  <div>
                    <p className="text-sm font-medium">Show brand stories on storefront</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle the brand image and logo marquee on the public home page.
                    </p>
                  </div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section title</Label>
                  <Input
                    value={draft.title}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section description</Label>
                  <Textarea
                    rows={3}
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Cards",
          value: "cards",
          content: (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-full"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      cards: [...draft.cards, createBrandCard(draft.cards.length)],
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add brand
                </Button>
              </div>
              {draft.cards.map((card, index) => (
                <Card key={card.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70">
                    <div>
                      <CardTitle className="text-base">Brand story {index + 1}</CardTitle>
                      <CardDescription>
                        Add a logo, SVG, or campaign image for the storefront brand rail.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          cards: draft.cards.filter((entry) => entry.id !== card.id),
                        })
                      }
                      disabled={draft.cards.length <= 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_14rem]">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Brand name</Label>
                        <Input
                          value={card.brandName}
                          onChange={(event) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              brandName: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Brand link</Label>
                        <Input
                          value={card.href}
                          onChange={(event) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              href: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Title</Label>
                        <Input
                          value={card.title}
                          onChange={(event) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              title: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Summary</Label>
                        <Textarea
                          rows={3}
                          value={card.summary}
                          onChange={(event) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              summary: event.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Brand image or logo</Label>
                        <FrameworkMediaPickerField
                          value={card.imageUrl}
                          onChange={(value) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              imageUrl: value,
                            }))
                          }
                          previewAlt={`${card.brandName || "Brand"} image`}
                          showPreview={false}
                          helperText="Choose a raster image, SVG file, or paste an SVG/data URL below."
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>SVG, image URL, or data URL</Label>
                        <Textarea
                          rows={4}
                          value={decodeSvgDataUrl(card.imageUrl)}
                          onChange={(event) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              imageUrl: normalizeBrandAssetInput(event.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="flex min-h-36 items-center justify-center rounded-[1rem] border border-border/70 bg-muted/30 p-4">
                      {card.imageUrl.trim() ? (
                        <img
                          src={card.imageUrl}
                          alt={card.brandName || "Brand preview"}
                          className="max-h-32 w-full object-contain"
                        />
                      ) : (
                        <span className="text-center text-xs font-medium text-muted-foreground">
                          Add an image or SVG to preview the brand story.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ),
        },
      ]
    : []

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          className="gap-2"
          disabled={!draft || !canEditStorefrontDesigner || isSaving || hasValidationIssues}
          onClick={() => void handleSave()}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save brand stories"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <StorefrontDesignerValidationCard
        issues={validationIssues}
        title="Brand stories validation"
      />

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>
            Preview of the public storefront brand image rail.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? (
            <BrandStoryRail
              title={draft.title}
              description={draft.description}
              cards={draft.cards}
            />
          ) : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="content" tabs={tabs} /> : null}</div>
    </div>
  )
}
