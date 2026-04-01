import type { EcommercePricingSettingsUpdatePayload } from '@shared/index'
import { useEffect, useMemo, useState } from 'react'
import { Calculator, RefreshCcw, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import {
  getEcommerceSettings,
  HttpError,
  updateEcommerceSettings,
} from '@/shared/api/client'
import { showErrorToast, showSuccessToast } from '@/shared/notifications/toast'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to load ecommerce pricing settings.'
}

function createDefaultValues(): EcommercePricingSettingsUpdatePayload {
  return {
    purchaseToSellPercent: 75,
    purchaseToMrpPercent: 150,
  }
}

export function EcommerceSettingsPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? null
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [form, setForm] = useState<EcommercePricingSettingsUpdatePayload>(createDefaultValues())

  useEffect(() => {
    if (!accessToken) {
      return
    }
    const authToken = accessToken

    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const settings = await getEcommerceSettings(authToken)

        if (!cancelled) {
          setForm({
            purchaseToSellPercent: settings.purchaseToSellPercent,
            purchaseToMrpPercent: settings.purchaseToMrpPercent,
          })
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(toErrorMessage(error))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  const preview = useMemo(() => {
    const purchase = 100
    const sell = Math.ceil(purchase * (1 + form.purchaseToSellPercent / 100))
    const mrp = Math.ceil(purchase * (1 + form.purchaseToMrpPercent / 100))

    return {
      purchase,
      sell,
      mrp,
    }
  }, [form.purchaseToMrpPercent, form.purchaseToSellPercent])

  async function handleSave() {
    const token = accessToken
    if (typeof token !== 'string') {
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      await updateEcommerceSettings(token, form)
      showSuccessToast({
        title: 'Ecommerce settings saved',
        description: 'Pricing defaults will be used for new products and copy actions.',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showErrorToast({
        title: 'Unable to save ecommerce settings',
        description: message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Ecommerce settings</CardTitle>
            <CardDescription>Loading pricing defaults.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="mesh-panel overflow-hidden">
        <CardHeader className="border-b border-border/60">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <Badge>Ecommerce desk</Badge>
              <div>
                <CardTitle className="text-3xl">Product pricing settings</CardTitle>
                <CardDescription className="mt-2 max-w-3xl text-sm leading-6">
                  Store the default pricing formula here. New products and copied products can use these values to derive sell and MRP from purchase price.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="px-4 py-1.5">
              Round up enabled
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 lg:grid-cols-[1fr_0.9fr]">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Calculator className="size-5" />
                Purchase formula
              </CardTitle>
              <CardDescription>
                Enter markups as percentages. Example: 75 means purchase price multiplied by 1.75.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-2">
                <Label htmlFor="purchase-to-sell">Purchase to Sell %</Label>
                <Input
                  id="purchase-to-sell"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchaseToSellPercent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      purchaseToSellPercent: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchase-to-mrp">Purchase to MRP %</Label>
                <Input
                  id="purchase-to-mrp"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.purchaseToMrpPercent}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      purchaseToMrpPercent: Number(event.target.value || 0),
                    }))
                  }
                />
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
                <p className="font-medium text-foreground">Round up prices</p>
                <p className="text-sm text-muted-foreground">
                  Calculated prices are always rounded up to the next whole value.
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => void handleSave()} disabled={saving}>
                  <RefreshCcw className="size-4" />
                  {saving ? 'Saving...' : 'Save settings'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="size-5" />
                Preview
              </CardTitle>
              <CardDescription>Using a purchase price of 100.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Purchase</span>
                <span className="font-medium text-foreground">{preview.purchase.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">Sell</span>
                <span className="font-medium text-foreground">
                  {preview.sell.toFixed(2)} {form.purchaseToSellPercent ? `(1 + ${form.purchaseToSellPercent / 100})` : ''}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 p-3">
                <span className="text-muted-foreground">MRP</span>
                <span className="font-medium text-foreground">
                  {preview.mrp.toFixed(2)} {form.purchaseToMrpPercent ? `(1 + ${form.purchaseToMrpPercent / 100})` : ''}
                </span>
              </div>
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                Example: purchase 100 with 75% markup becomes 175, and 150% markup becomes 250.
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}
    </div>
  )
}
