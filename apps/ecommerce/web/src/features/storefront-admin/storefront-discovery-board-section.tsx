import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type {
  StorefrontDiscoveryBoard,
  StorefrontDiscoveryBoardCard,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import { DiscoveryBoard } from "@/components/blocks/discovery-board"
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
  validateDiscoveryBoardDesigner,
} from "./storefront-designer-validation"

function createCard(index: number): StorefrontDiscoveryBoardCard {
  const baseId = `discovery-board:${Date.now()}-${index}`

  return {
    id: baseId,
    title: `Discovery board ${index + 1}`,
    href: "/shop/catalog",
    images: Array.from({ length: 4 }, (_, imageIndex) =>
      `https://placehold.co/560x560/f3eee7/2b211b?text=Board+${index + 1}+${imageIndex + 1}`
    ),
  }
}

export function StorefrontDiscoveryBoardSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const [draft, setDraft] = useState<StorefrontDiscoveryBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const validationIssues = draft ? validateDiscoveryBoardDesigner(draft) : []
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

        const nextConfig = await storefrontApi.getStorefrontDiscoveryBoard(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load discovery board settings."
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

      const saved = await storefrontApi.updateStorefrontDiscoveryBoard(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Discovery Board",
        action: "saved",
        recordName: "Storefront discovery board",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error
          ? saveError.message
          : "Failed to save discovery board settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Discovery board save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateCard(
    cardId: string,
    updater: (card: StorefrontDiscoveryBoardCard) => StorefrontDiscoveryBoardCard
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
                    <p className="text-sm font-medium">Show discovery board on storefront</p>
                    <p className="text-xs text-muted-foreground">
                      Toggle the four-card collage board rendered on the home page.
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
                  <Label>Section summary</Label>
                  <Textarea
                    rows={3}
                    value={draft.summary ?? ""}
                    onChange={(event) =>
                      setDraft({ ...draft, summary: event.target.value || null })
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
                  Add board card
                </Button>
              </div>
              {draft.cards.map((card, index) => (
                <Card key={card.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70">
                    <div>
                      <CardTitle className="text-base">Board card {index + 1}</CardTitle>
                      <CardDescription>
                        Admin title, click target, and four collage images for a single board card.
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
                      <Label>Card title</Label>
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
                    {card.images.map((imageUrl, imageIndex) => (
                      <div key={`${card.id}:${imageIndex}`} className="space-y-2">
                        <Label>Image {imageIndex + 1}</Label>
                        <FrameworkMediaPickerField
                          value={imageUrl}
                          onChange={(value) =>
                            updateCard(card.id, (current) => ({
                              ...current,
                              images: current.images.map((entry, entryIndex) =>
                                entryIndex === imageIndex ? value : entry
                              ),
                            }))
                          }
                          previewAlt={`${card.title || "Discovery board"} image ${imageIndex + 1}`}
                          showPreview={false}
                          helperText="Choose a square or portrait visual for this collage slot."
                        />
                      </div>
                    ))}
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
          {isSaving ? "Saving..." : "Save discovery board"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <StorefrontDesignerValidationCard
        issues={validationIssues}
        title="Discovery board validation"
      />

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>
            Preview of the public storefront discovery board with image-only collage cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? <DiscoveryBoard config={draft} /> : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="content" tabs={tabs} /> : null}</div>
    </div>
  )
}
