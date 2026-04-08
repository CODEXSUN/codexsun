import { Save } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontCouponBanner } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { CouponBanner } from "@/components/blocks/coupon-banner"
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
  validateCouponBannerDesigner,
} from "./storefront-designer-validation"

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

export function StorefrontCouponBannerSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const [draft, setDraft] = useState<StorefrontCouponBanner | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const validationIssues = draft ? validateCouponBannerDesigner(draft) : []
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

        const nextConfig = await storefrontApi.getStorefrontCouponBanner(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load coupon banner settings.")
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

      const saved = await storefrontApi.updateStorefrontCouponBanner(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Coupon Banner",
        action: "saved",
        recordName: "Storefront coupon banner",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save coupon banner settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Coupon banner save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
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
                    <p className="text-sm font-medium">Show coupon banner on storefront</p>
                    <p className="text-xs text-muted-foreground">Toggle the promo coupon strip below the category rail.</p>
                  </div>
                  <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} />
                </div>
                <div className="space-y-2">
                  <Label>Eyebrow</Label>
                  <Input value={draft.eyebrow} onChange={(event) => setDraft({ ...draft, eyebrow: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Coupon code</Label>
                  <Input value={draft.couponCode} onChange={(event) => setDraft({ ...draft, couponCode: event.target.value.toUpperCase() })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Title</Label>
                  <Input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Summary</Label>
                  <Textarea rows={4} value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Helper text</Label>
                  <Input value={draft.helperText} onChange={(event) => setDraft({ ...draft, helperText: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Button label</Label>
                  <Input value={draft.buttonLabel} onChange={(event) => setDraft({ ...draft, buttonLabel: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Button link</Label>
                  <Input value={draft.buttonHref ?? ""} onChange={(event) => setDraft({ ...draft, buttonHref: event.target.value || null })} />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Style",
          value: "style",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                <ColorField label="Background" value={draft.backgroundColor} onChange={(value) => setDraft({ ...draft, backgroundColor: value })} />
                <ColorField label="Border" value={draft.borderColor} onChange={(value) => setDraft({ ...draft, borderColor: value })} />
                <ColorField label="Accent" value={draft.accentColor} onChange={(value) => setDraft({ ...draft, accentColor: value })} />
                <ColorField label="Eyebrow text" value={draft.eyebrowColor} onChange={(value) => setDraft({ ...draft, eyebrowColor: value })} />
                <ColorField label="Title text" value={draft.titleColor} onChange={(value) => setDraft({ ...draft, titleColor: value })} />
                <ColorField label="Summary text" value={draft.summaryColor} onChange={(value) => setDraft({ ...draft, summaryColor: value })} />
                <ColorField label="Code background" value={draft.codeBackgroundColor} onChange={(value) => setDraft({ ...draft, codeBackgroundColor: value })} />
                <ColorField label="Code text" value={draft.codeTextColor} onChange={(value) => setDraft({ ...draft, codeTextColor: value })} />
                <ColorField label="Button background" value={draft.buttonBackgroundColor} onChange={(value) => setDraft({ ...draft, buttonBackgroundColor: value })} />
                <ColorField label="Button text" value={draft.buttonTextColor} onChange={(value) => setDraft({ ...draft, buttonTextColor: value })} />
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
        <Button type="button" className="gap-2" disabled={!draft || !canEditStorefrontDesigner || isSaving || hasValidationIssues} onClick={() => void handleSave()}>
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save coupon banner"}
        </Button>
      </div>

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <StorefrontDesignerValidationCard
        issues={validationIssues}
        title="Coupon banner validation"
      />

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Preview of the public storefront coupon banner below the category/catalog section.</CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? <CouponBanner config={draft} /> : null}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="content" tabs={tabs} /> : null}</div>
    </div>
  )
}
