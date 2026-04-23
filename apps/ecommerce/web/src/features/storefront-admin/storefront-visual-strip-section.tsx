import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontVisualStrip, StorefrontVisualStripCard } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import { VisualStrip } from "@/components/blocks/visual-strip"
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
  validateVisualStripDesigner,
} from "./storefront-designer-validation"

function createCard(index: number): StorefrontVisualStripCard {
  return {
    id: `visual-strip:${Date.now()}-${index}`,
    label: `Visual strip ${index + 1}`,
    href: "/shop/catalog",
    imageUrl: `https://placehold.co/720x900/f3eee7/2b211b?text=Strip+${index + 1}`,
  }
}

export function StorefrontVisualStripSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const [draft, setDraft] = useState<StorefrontVisualStrip | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const validationIssues = draft ? validateVisualStripDesigner(draft) : []
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

        const nextConfig = await storefrontApi.getStorefrontVisualStrip(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load visual strip settings."
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

      const saved = await storefrontApi.updateStorefrontVisualStrip(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Visual Strip",
        action: "saved",
        recordName: "Storefront visual strip",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save visual strip settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Visual strip save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateCard(
    cardId: string,
    updater: (card: StorefrontVisualStripCard) => StorefrontVisualStripCard
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
                    <p className="text-sm font-medium">Show visual strip on storefront</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle the compact image rail rendered below the discovery board.
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
                <div className="space-y-2">
                  <Label>CTA label</Label>
                  <Input
                    value={draft.ctaLabel ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, ctaLabel: event.target.value || null })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>CTA link</Label>
                  <Input
                    value={draft.ctaHref ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, ctaHref: event.target.value || null })
                    }
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
                      cards: [...draft.cards, createCard(draft.cards.length)],
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add strip card
                </Button>
              </div>
              {draft.cards.map((card, index) => (
                <Card key={card.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70">
                    <div>
                      <CardTitle className="text-base">Strip card {index + 1}</CardTitle>
                      <CardDescription>
                        Small image card shown in the horizontal storefront strip.
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
                  <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Card label</Label>
                      <Input
                        value={card.label}
                        onChange={(event) =>
                          updateCard(card.id, (current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Card link</Label>
                      <Input
                        value={card.href ?? ""}
                        onChange={(event) =>
                          updateCard(card.id, (current) => ({
                            ...current,
                            href: event.target.value || null,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Image URL</Label>
                      <FrameworkMediaPickerField
                        value={card.imageUrl}
                        onChange={(value) =>
                          updateCard(card.id, (current) => ({
                            ...current,
                            imageUrl: value,
                          }))
                        }
                        previewAlt={`${card.label || "Visual strip"} image`}
                        showPreview={false}
                        helperText="Choose a compact visual for this strip card."
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
        <Button
          type="button"
          className="gap-2"
          disabled={!draft || !canEditStorefrontDesigner || isSaving || hasValidationIssues}
          onClick={() => void handleSave()}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save visual strip"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <StorefrontDesignerValidationCard
        issues={validationIssues}
        title="Visual strip validation"
      />

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>
            Preview of the public storefront visual strip with compact image cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? <VisualStrip config={draft} /> : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="content" tabs={tabs} /> : null}</div>
    </div>
  )
}
