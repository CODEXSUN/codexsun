import { Save } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontPickupLocation } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"

export function StorefrontPickupSection() {
  const [draft, setDraft] = useState<StorefrontPickupLocation | null>(null)
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

        const nextConfig = await storefrontApi.getStorefrontPickupLocation(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load pickup settings.")
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

      const saved = await storefrontApi.updateStorefrontPickupLocation(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Pickup",
        action: "saved",
        recordName: "Store pickup location",
      })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save pickup settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Pickup save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: AnimatedContentTab[] = draft
    ? [
        {
          label: "Visibility",
          value: "visibility",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Enable store pickup</p>
                    <p className="text-xs text-muted-foreground">
                      Show the store pickup fulfillment option on storefront checkout.
                    </p>
                  </div>
                  <Switch
                    checked={draft.enabled}
                    onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Content",
          value: "content",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Section title</Label>
                  <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Store name</Label>
                  <Input value={draft.storeName} onChange={(event) => setDraft({ ...draft, storeName: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Summary</Label>
                  <Textarea rows={3} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Pickup note</Label>
                  <Textarea rows={4} value={draft.pickupNote} onChange={(event) => setDraft({ ...draft, pickupNote: event.target.value })} />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Location",
          value: "location",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>Address line 1</Label>
                  <Input value={draft.line1} onChange={(event) => setDraft({ ...draft, line1: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Address line 2</Label>
                  <Input value={draft.line2 ?? ""} onChange={(event) => setDraft({ ...draft, line2: event.target.value || null })} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={draft.city} onChange={(event) => setDraft({ ...draft, city: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={draft.state} onChange={(event) => setDraft({ ...draft, state: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={draft.country} onChange={(event) => setDraft({ ...draft, country: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input value={draft.pincode} onChange={(event) => setDraft({ ...draft, pincode: event.target.value })} />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Contact",
          value: "contact",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact phone</Label>
                  <Input value={draft.contactPhone} onChange={(event) => setDraft({ ...draft, contactPhone: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contact email</Label>
                  <Input value={draft.contactEmail} onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })} />
                </div>
              </CardContent>
            </Card>
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
          {isSaving ? "Saving..." : "Save pickup"}
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Preview of the store pickup block shown in checkout.</CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-5 pt-6">
          {draft ? (
            <div className="rounded-[1.5rem] border border-[#d7c4b1] bg-[#fffaf4] p-5 text-sm text-[#4b3527] shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8c6a2f]">
                {draft.title}
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">{draft.storeName}</p>
              <p className="mt-2 leading-6">{draft.summary}</p>
              <p className="mt-4 leading-6">
                {draft.line1}
                {draft.line2 ? `, ${draft.line2}` : ""}
                <br />
                {draft.city}, {draft.state} {draft.pincode}
                <br />
                {draft.country}
              </p>
              <p className="mt-4 text-sm text-[#6b5a4c]">
                {draft.contactPhone} • {draft.contactEmail}
              </p>
              <p className="mt-3 rounded-[1rem] border border-[#eadbc8] bg-white/70 px-4 py-3 text-[#6b5a4c]">
                {draft.pickupNote}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="visibility" tabs={tabs} /> : null}</div>
    </div>
  )
}
