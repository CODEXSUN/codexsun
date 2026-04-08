import { useEffect, useState } from "react"
import { PackageCheck, Plus, Save, Trash2, Truck } from "lucide-react"

import type {
  StorefrontSettings,
  StorefrontShippingMethod,
  StorefrontShippingZone,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"

function createShippingMethodDraft(index: number): StorefrontShippingMethod {
  return {
    id: `method-${Date.now()}-${index}`,
    label: "New delivery method",
    description: "Describe the dispatch window and promise for this method.",
    courierName: null,
    serviceLevel: "Dispatch within 24 hours",
    etaMinDays: 3,
    etaMaxDays: 5,
    shippingAmount: 149,
    handlingAmount: 99,
    freeShippingThreshold: 3999,
    codEligible: false,
    isDefault: false,
    isActive: true,
  }
}

function createShippingZoneDraft(index: number): StorefrontShippingZone {
  return {
    id: `zone-${Date.now()}-${index}`,
    label: "New zone",
    countries: ["India"],
    states: [],
    pincodePrefixes: [],
    shippingSurchargeAmount: 0,
    handlingSurchargeAmount: 0,
    freeShippingThresholdOverride: null,
    etaAdditionalDays: 0,
    codEligible: false,
    isDefault: false,
    isActive: true,
  }
}

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

  function updateShippingMethod(
    methodId: string,
    updater: (method: StorefrontShippingMethod) => StorefrontShippingMethod
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            shippingMethods: current.shippingMethods.map((method) =>
              method.id === methodId ? updater(method) : method
            ),
          }
        : current
    )
  }

  function updateShippingZone(
    zoneId: string,
    updater: (zone: StorefrontShippingZone) => StorefrontShippingZone
  ) {
    setDraft((current) =>
      current
        ? {
            ...current,
            shippingZones: current.shippingZones.map((zone) =>
              zone.id === zoneId ? updater(zone) : zone
            ),
          }
        : current
    )
  }

  function syncLegacyDefaults(current: StorefrontSettings, methodId: string) {
    const defaultMethod = current.shippingMethods.find((method) => method.id === methodId)

    if (!defaultMethod) {
      return current
    }

    return {
      ...current,
      defaultShippingAmount: defaultMethod.shippingAmount,
      defaultHandlingAmount: defaultMethod.handlingAmount,
      freeShippingThreshold: defaultMethod.freeShippingThreshold ?? current.freeShippingThreshold,
    }
  }

  function handleSetDefaultMethod(methodId: string) {
    setDraft((current) =>
      current
        ? syncLegacyDefaults(
            {
              ...current,
              shippingMethods: current.shippingMethods.map((method) => ({
                ...method,
                isDefault: method.id === methodId,
              })),
            },
            methodId
          )
        : current
    )
  }

  function handleAddMethod() {
    setDraft((current) =>
      current
        ? {
            ...current,
            shippingMethods: [
              ...current.shippingMethods,
              createShippingMethodDraft(current.shippingMethods.length),
            ],
          }
        : current
    )
  }

  function handleRemoveMethod(methodId: string) {
    setDraft((current) => {
      if (!current || current.shippingMethods.length <= 1) {
        return current
      }

      const nextMethods = current.shippingMethods.filter((method) => method.id !== methodId)
      const normalizedMethods = nextMethods.some((method) => method.isDefault)
        ? nextMethods
        : nextMethods.map((method, index) => ({
            ...method,
            isDefault: index === 0,
          }))
      const defaultMethod =
        normalizedMethods.find((method) => method.isDefault) ?? normalizedMethods[0]

      return defaultMethod
        ? {
            ...current,
            shippingMethods: normalizedMethods,
            defaultShippingAmount: defaultMethod.shippingAmount,
            defaultHandlingAmount: defaultMethod.handlingAmount,
            freeShippingThreshold:
              defaultMethod.freeShippingThreshold ?? current.freeShippingThreshold,
          }
        : current
    })
  }

  function handleAddZone() {
    setDraft((current) =>
      current
        ? {
            ...current,
            shippingZones: [...current.shippingZones, createShippingZoneDraft(current.shippingZones.length)],
          }
        : current
    )
  }

  function handleSetDefaultZone(zoneId: string) {
    setDraft((current) =>
      current
        ? {
            ...current,
            shippingZones: current.shippingZones.map((zone) => ({
              ...zone,
              isDefault: zone.id === zoneId,
            })),
          }
        : current
    )
  }

  function handleRemoveZone(zoneId: string) {
    setDraft((current) => {
      if (!current || current.shippingZones.length <= 1) {
        return current
      }

      const nextZones = current.shippingZones.filter((zone) => zone.id !== zoneId)
      return {
        ...current,
        shippingZones: nextZones.some((zone) => zone.isDefault)
          ? nextZones
          : nextZones.map((zone, index) => ({
              ...zone,
              isDefault: index === 0,
            })),
      }
    })
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
              Configure storefront delivery methods with courier, SLA, ETA, and fallback
              charge rules. Product-level shipping or handling overrides still take
              precedence at checkout.
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
            <CardTitle className="text-[1.2rem] tracking-tight">Legacy defaults</CardTitle>
            <CardDescription>
              These compatibility fields mirror the current default delivery method.
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
              Product override: if a product carries shipping or handling, checkout uses
              that product value first.
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Method fallback: if a product does not define a charge, checkout uses the
              selected delivery method values.
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Historical safety: completed orders keep their selected courier, SLA, and ETA
              snapshot even after storefront settings change later.
            </div>
            <div className="rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
              Current default:
              {" "}
              <strong>
                {settings?.shippingMethods.find((method) => method.isDefault)?.label ?? "Not set"}
              </strong>
              .
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-[1.2rem] tracking-tight">Delivery methods</CardTitle>
              <CardDescription>
                Configure courier, service level, ETA window, and fallback charges for
                each method.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={handleAddMethod}>
              <Plus className="size-4" />
              Add method
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {draft?.shippingMethods.map((method) => (
            <div
              key={method.id}
              className="space-y-4 rounded-[1.4rem] border border-border/70 bg-background/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{method.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {method.isDefault ? "Default delivery method" : "Secondary delivery method"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveMethod(method.id)}
                  disabled={(draft?.shippingMethods.length ?? 0) <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={method.label}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Courier</Label>
                  <Input
                    value={method.courierName ?? ""}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        courierName: event.target.value.trim() || null,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>SLA</Label>
                  <Input
                    value={method.serviceLevel}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        serviceLevel: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={method.description}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETA min days</Label>
                  <Input
                    type="number"
                    value={method.etaMinDays}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        etaMinDays: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETA max days</Label>
                  <Input
                    type="number"
                    value={method.etaMaxDays}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        etaMaxDays: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping charge</Label>
                  <Input
                    type="number"
                    value={method.shippingAmount}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        shippingAmount: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Handling charge</Label>
                  <Input
                    type="number"
                    value={method.handlingAmount}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        handlingAmount: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free shipping threshold</Label>
                  <Input
                    type="number"
                    value={method.freeShippingThreshold ?? 0}
                    onChange={(event) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        freeShippingThreshold: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={method.isActive}
                    onCheckedChange={(checked) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        isActive: checked === true,
                      }))
                    }
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={method.isDefault}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        handleSetDefaultMethod(method.id)
                      }
                    }}
                  />
                  Default
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={method.codEligible}
                    onCheckedChange={(checked) =>
                      updateShippingMethod(method.id, (current) => ({
                        ...current,
                        codEligible: checked === true,
                      }))
                    }
                  />
                  COD eligible
                </label>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-2"
              onClick={() => void handleSave()}
              disabled={isSaving || !draft}
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save shipping settings"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="text-[1.2rem] tracking-tight">Shipping zones</CardTitle>
              <CardDescription>
                Match destination country, state, and pincode prefixes to add surcharges,
                ETA days, and COD rules.
              </CardDescription>
            </div>
            <Button type="button" variant="outline" className="gap-2" onClick={handleAddZone}>
              <Plus className="size-4" />
              Add zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-5">
          {draft?.shippingZones.map((zone) => (
            <div
              key={zone.id}
              className="space-y-4 rounded-[1.4rem] border border-border/70 bg-background/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">{zone.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {zone.isDefault ? "Default fallback zone" : "Matched zone rule"}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveZone(zone.id)}
                  disabled={(draft?.shippingZones.length ?? 0) <= 1}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={zone.label}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        label: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Countries</Label>
                  <Input
                    value={zone.countries.join(", ")}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        countries: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>States</Label>
                  <Input
                    value={zone.states.join(", ")}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        states: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode prefixes</Label>
                  <Input
                    value={zone.pincodePrefixes.join(", ")}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        pincodePrefixes: event.target.value
                          .split(",")
                          .map((item) => item.trim())
                          .filter(Boolean),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping surcharge</Label>
                  <Input
                    type="number"
                    value={zone.shippingSurchargeAmount}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        shippingSurchargeAmount: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Handling surcharge</Label>
                  <Input
                    type="number"
                    value={zone.handlingSurchargeAmount}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        handlingSurchargeAmount: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Free shipping override</Label>
                  <Input
                    type="number"
                    value={zone.freeShippingThresholdOverride ?? 0}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        freeShippingThresholdOverride: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>ETA extra days</Label>
                  <Input
                    type="number"
                    value={zone.etaAdditionalDays}
                    onChange={(event) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        etaAdditionalDays: Number(event.target.value || 0),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={zone.isActive}
                    onCheckedChange={(checked) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        isActive: checked === true,
                      }))
                    }
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={zone.isDefault}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        handleSetDefaultZone(zone.id)
                      }
                    }}
                  />
                  Default
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <Checkbox
                    checked={zone.codEligible}
                    onCheckedChange={(checked) =>
                      updateShippingZone(zone.id, (current) => ({
                        ...current,
                        codEligible: checked === true,
                      }))
                    }
                  />
                  COD eligible
                </label>
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button
              type="button"
              className="gap-2"
              onClick={() => void handleSave()}
              disabled={isSaving || !draft}
            >
              <Save className="size-4" />
              {isSaving ? "Saving..." : "Save shipping settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
