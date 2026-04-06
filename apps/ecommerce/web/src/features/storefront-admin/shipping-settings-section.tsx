import { useEffect, useState } from "react"
import { PackageCheck, Save, Truck } from "lucide-react"

import type { StorefrontSettings } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"

export function ShippingSettingsSection() {
  const [settings, setSettings] = useState<StorefrontSettings | null>(null)
  const [draft, setDraft] = useState<StorefrontSettings | null>(null)
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

        const nextSettings = await storefrontApi.getStorefrontSettings(accessToken)

        if (!cancelled) {
          setSettings(nextSettings)
          setDraft(nextSettings)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load shipping settings."
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

    setIsSaving(true)
    setError(null)

    try {
      const accessToken = getStoredAccessToken()

      if (!accessToken) {
        throw new Error("Admin access token is required.")
      }

      const saved = await storefrontApi.updateStorefrontSettings(accessToken, draft)
      setSettings(saved)
      setDraft(saved)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save shipping settings."
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Truck className="size-3.5" />
            Shipping rules
          </div>
          <div className="space-y-2">
            <CardTitle>Shipping and handling</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-7">
              Set the storefront-wide fallback charges used when a product does not define
              its own shipping or handling override. Product-level values take precedence.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-0">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="text-[1.2rem] tracking-tight">Global defaults</CardTitle>
            <CardDescription>
              These values apply when the product does not carry its own override.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 p-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-free-threshold">Free shipping threshold</Label>
              <Input
                id="shipping-free-threshold"
                type="number"
                value={draft?.freeShippingThreshold ?? 0}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          freeShippingThreshold: Number(event.target.value || 0),
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-default-charge">Default shipping charge</Label>
              <Input
                id="shipping-default-charge"
                type="number"
                value={draft?.defaultShippingAmount ?? 0}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          defaultShippingAmount: Number(event.target.value || 0),
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="shipping-default-handling">Default handling charge</Label>
              <Input
                id="shipping-default-handling"
                type="number"
                value={draft?.defaultHandlingAmount ?? 0}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          defaultHandlingAmount: Number(event.target.value || 0),
                        }
                      : current
                  )
                }
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="button" className="gap-2" onClick={() => void handleSave()} disabled={isSaving || !draft}>
                <Save className="size-4" />
                {isSaving ? "Saving..." : "Save shipping settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
          <CardHeader className="border-b border-border/70">
            <CardTitle className="flex items-center gap-2 text-[1.2rem] tracking-tight">
              <PackageCheck className="size-4 text-primary" />
              Charge logic
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-5 text-sm leading-7 text-muted-foreground">
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Product override:
              if a product carries shipping or handling, checkout uses that product value first.
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Global fallback:
              if a product does not define a charge, ecommerce falls back to the values saved here.
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Current live defaults:
              free above <strong>{settings?.freeShippingThreshold ?? 0}</strong>,
              shipping <strong>{settings?.defaultShippingAmount ?? 0}</strong>,
              handling <strong>{settings?.defaultHandlingAmount ?? 0}</strong>.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
