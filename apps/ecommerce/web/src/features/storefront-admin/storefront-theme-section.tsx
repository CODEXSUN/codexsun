import { Save } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontTheme } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"
import { resolveStorefrontThemeStyle } from "../../lib/storefront-theme"
import {
  StorefrontDesignerPermissionCard,
  useStorefrontDesignerAccess,
} from "./storefront-designer-access"

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
      <Input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full p-1"
      />
    </div>
  )
}

export function StorefrontThemeSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const [draft, setDraft] = useState<StorefrontTheme | null>(null)
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

        const nextTheme = await storefrontApi.getStorefrontTheme(accessToken)
        if (!cancelled) {
          setDraft(nextTheme)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load storefront theme.")
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

    setIsSaving(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()
      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const saved = await storefrontApi.updateStorefrontTheme(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Theme Designer",
        action: "saved",
        recordName: "Storefront theme",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save storefront theme."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Theme save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4" data-technical-name="section.ecommerce.storefront-theme">
      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-end">
        <Button
          type="button"
          className="gap-2"
          disabled={!draft || !canEditStorefrontDesigner || isSaving}
          onClick={() => void handleSave()}
        >
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save theme"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      {draft ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle>Theme Designer</CardTitle>
              <CardDescription>
                One place for the storefront page background, shared card surface, border, and card shadows.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
              <ColorField
                label="Page top"
                value={draft.pageBackgroundFrom}
                onChange={(value) => setDraft({ ...draft, pageBackgroundFrom: value })}
              />
              <ColorField
                label="Page middle"
                value={draft.pageBackgroundVia}
                onChange={(value) => setDraft({ ...draft, pageBackgroundVia: value })}
              />
              <ColorField
                label="Page bottom"
                value={draft.pageBackgroundTo}
                onChange={(value) => setDraft({ ...draft, pageBackgroundTo: value })}
              />
              <ColorField
                label="Section band"
                value={draft.sectionBackgroundColor}
                onChange={(value) => setDraft({ ...draft, sectionBackgroundColor: value })}
              />
              <ColorField
                label="Card background"
                value={draft.cardBackgroundColor}
                onChange={(value) => setDraft({ ...draft, cardBackgroundColor: value })}
              />
              <ColorField
                label="Muted card background"
                value={draft.cardMutedBackgroundColor}
                onChange={(value) => setDraft({ ...draft, cardMutedBackgroundColor: value })}
              />
              <ColorField
                label="Card border"
                value={draft.cardBorderColor}
                onChange={(value) => setDraft({ ...draft, cardBorderColor: value })}
              />
              <ColorField
                label="Shadow color"
                value={draft.cardShadowColor}
                onChange={(value) => setDraft({ ...draft, cardShadowColor: value })}
              />
              <div className="space-y-2">
                <Label>Shadow strength</Label>
                <Select
                  value={draft.cardShadowStrength}
                  onValueChange={(value) =>
                    setDraft({
                      ...draft,
                      cardShadowStrength: value as StorefrontTheme["cardShadowStrength"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="soft">Soft</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="deep">Deep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
            <CardHeader className="border-b border-border/70">
              <CardTitle className="text-[1.2rem] tracking-tight">Preview</CardTitle>
              <CardDescription>
                Theme variables applied to page and shared cards.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div
                className="space-y-4 p-5"
                style={resolveStorefrontThemeStyle(draft)}
              >
                <div className="rounded-[1rem] border bg-[var(--storefront-section-bg)] p-3 [border-color:var(--storefront-card-border)]">
                  <div className="rounded-[0.9rem] border bg-[var(--storefront-card-bg)] p-4 [border-color:var(--storefront-card-border)] [box-shadow:var(--storefront-card-shadow)]">
                    <div className="h-24 rounded-[0.7rem] bg-[var(--storefront-card-muted-bg)]" />
                    <div className="mt-4 space-y-2">
                      <div className="h-3 w-24 rounded-full bg-foreground/20" />
                      <div className="h-4 w-40 rounded-full bg-foreground/35" />
                      <div className="h-3 w-32 rounded-full bg-foreground/20" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
