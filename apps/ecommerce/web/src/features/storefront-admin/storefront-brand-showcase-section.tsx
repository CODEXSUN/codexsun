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

function createCard(index: number): StorefrontBrandDiscoveryCard {
  return {
    id: `brand-showcase:${Date.now()}-${index}`,
    brandName: "New Brand",
    title: "Brand Story",
    summary: "Short supporting summary",
    imageUrl: "https://placehold.co/800x1120/f2eee7/2c211a?text=Brand",
    href: "/shop/catalog",
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
          setError(loadError instanceof Error ? loadError.message : "Failed to load brand showcase settings.")
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
        entity: "Brand Showcase",
        action: "saved",
        recordName: "Storefront brands",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save brand showcase settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Brand showcase save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateCard(cardId: string, updater: (card: StorefrontBrandDiscoveryCard) => StorefrontBrandDiscoveryCard) {
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
          label: "Section",
          value: "section",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3 md:col-span-2">
                  <div>
                    <p className="text-sm font-medium">Show brand showcase on storefront</p>
                    <p className="text-xs text-muted-foreground">Toggle the brand story rail and manage cards independently from products.</p>
                  </div>
                  <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section title</Label>
                  <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section description</Label>
                  <Input value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
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
                      cards: [...draft.cards, createCard(draft.cards.length)],
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add brand card
                </Button>
              </div>
              {draft.cards.map((card, index) => (
                <Card key={card.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70">
                    <div>
                      <CardTitle className="text-base">Brand card {index + 1}</CardTitle>
                      <CardDescription>Independent brand tile with image, chip label, title, summary, and link.</CardDescription>
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
                  <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Brand chip</Label>
                      <Input value={card.brandName} onChange={(event) => updateCard(card.id, (current) => ({ ...current, brandName: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Link</Label>
                      <Input value={card.href} onChange={(event) => updateCard(card.id, (current) => ({ ...current, href: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input value={card.title} onChange={(event) => updateCard(card.id, (current) => ({ ...current, title: event.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>Summary</Label>
                      <Input value={card.summary} onChange={(event) => updateCard(card.id, (current) => ({ ...current, summary: event.target.value }))} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Image</Label>
                      <FrameworkMediaPickerField
                        value={card.imageUrl}
                        onChange={(value) => updateCard(card.id, (current) => ({ ...current, imageUrl: value }))}
                        previewAlt={`${card.brandName || "Brand"} image`}
                        showPreview={false}
                        helperText="Choose a brand visual from media library or paste a URL."
                      />
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
        <Button type="button" className="gap-2" disabled={!draft || !canEditStorefrontDesigner || isSaving || hasValidationIssues} onClick={() => void handleSave()}>
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save brands"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <StorefrontDesignerValidationCard
        issues={validationIssues}
        title="Brand showcase validation"
      />

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Preview of the public storefront brand rail with independently managed brand cards.</CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? <BrandStoryRail title={draft.title} description={draft.description} cards={draft.cards} /> : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="section" tabs={tabs} /> : null}</div>
    </div>
  )
}
