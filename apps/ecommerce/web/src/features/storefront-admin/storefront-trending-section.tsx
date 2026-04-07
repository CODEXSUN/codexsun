import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontTrendingCard, StorefrontTrendingSection } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import { TrendingSection } from "@/components/blocks/trending-section"
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

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full p-1" />
    </div>
  )
}

function createCard(index: number): StorefrontTrendingCard {
  return {
    id: `trending:${Date.now()}-${index}`,
    title: "New Trend Card",
    caption: "Card caption",
    href: "/shop/catalog",
    imageUrl: "https://placehold.co/760x1100/f3eee7/2b211b?text=Trend+Card",
    backgroundColor: "#f3eee7",
    titleColor: "#241913",
    captionBackgroundColor: "#efe1d3",
    captionTextColor: "#241913",
  }
}

export function StorefrontTrendingSectionSection() {
  const [draft, setDraft] = useState<StorefrontTrendingSection | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
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

        const nextConfig = await storefrontApi.getStorefrontTrendingSection(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load trending section settings.")
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

    setIsSaving(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const saved = await storefrontApi.updateStorefrontTrendingSection(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Trending Section",
        action: "saved",
        recordName: "Storefront trending section",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save trending section settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Trending section save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  function updateCard(cardId: string, updater: (card: StorefrontTrendingCard) => StorefrontTrendingCard) {
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
          label: "Feature",
          value: "feature",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3 md:col-span-2">
                  <div>
                    <p className="text-sm font-medium">Show trending section on storefront</p>
                    <p className="text-xs text-muted-foreground">Toggle the linked trend-card rail rendered after gift corner.</p>
                  </div>
                  <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section title</Label>
                  <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Section description</Label>
                  <Textarea rows={3} value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Lead title</Label>
                  <Input value={draft.featureTitle} onChange={(event) => setDraft({ ...draft, featureTitle: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Lead link</Label>
                  <Input value={draft.featureHref ?? ""} onChange={(event) => setDraft({ ...draft, featureHref: event.target.value || null })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Lead summary</Label>
                  <Textarea rows={3} value={draft.featureSummary} onChange={(event) => setDraft({ ...draft, featureSummary: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Lead image URL</Label>
                  <FrameworkMediaPickerField
                    value={draft.featureImageUrl}
                    onChange={(value) => setDraft({ ...draft, featureImageUrl: value })}
                    previewAlt="Trending lead image"
                    showPreview={false}
                    helperText="Choose the tall hero visual for the lead trend card."
                  />
                </div>
                <ColorField label="Lead background" value={draft.featureBackgroundColor} onChange={(value) => setDraft({ ...draft, featureBackgroundColor: value })} />
                <ColorField label="Lead text" value={draft.featureTextColor} onChange={(value) => setDraft({ ...draft, featureTextColor: value })} />
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
                  Add card
                </Button>
              </div>
              {draft.cards.map((card, index) => (
                <Card key={card.id} className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/70">
                    <div>
                      <CardTitle className="text-base">Trend card {index + 1}</CardTitle>
                      <CardDescription>Image, link, and color styling for a single storefront trend card.</CardDescription>
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
                  <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Title</Label>
                      <Input value={card.title} onChange={(event) => updateCard(card.id, (current) => ({ ...current, title: event.target.value }))} />
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Caption</Label>
                      <Input value={card.caption} onChange={(event) => updateCard(card.id, (current) => ({ ...current, caption: event.target.value }))} />
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Image URL</Label>
                      <FrameworkMediaPickerField
                        value={card.imageUrl}
                        onChange={(value) => updateCard(card.id, (current) => ({ ...current, imageUrl: value }))}
                        previewAlt={`${card.title || "Trending"} image`}
                        showPreview={false}
                        helperText="Choose the image for this trend card from the shared media library."
                      />
                    </div>
                    <div className="space-y-2 xl:col-span-2">
                      <Label>Link</Label>
                      <Input value={card.href ?? ""} onChange={(event) => updateCard(card.id, (current) => ({ ...current, href: event.target.value || null }))} />
                    </div>
                    <ColorField label="Card background" value={card.backgroundColor} onChange={(value) => updateCard(card.id, (current) => ({ ...current, backgroundColor: value }))} />
                    <ColorField label="Title color" value={card.titleColor} onChange={(value) => updateCard(card.id, (current) => ({ ...current, titleColor: value }))} />
                    <ColorField label="Caption background" value={card.captionBackgroundColor} onChange={(value) => updateCard(card.id, (current) => ({ ...current, captionBackgroundColor: value }))} />
                    <ColorField label="Caption text" value={card.captionTextColor} onChange={(value) => updateCard(card.id, (current) => ({ ...current, captionTextColor: value }))} />
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
        <Button type="button" className="gap-2" disabled={!draft || isSaving} onClick={() => void handleSave()}>
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save trending section"}
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Preview of the public storefront trending section with the lead card and trend cards.</CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? <TrendingSection config={draft} /> : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="feature" tabs={tabs} /> : null}</div>
    </div>
  )
}
