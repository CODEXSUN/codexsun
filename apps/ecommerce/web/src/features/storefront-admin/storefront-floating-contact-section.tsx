import { Save } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontFloatingContact } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"
import { FloatingContactButton } from "@/components/blocks/floating-contact-button"

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData, useStorefrontShellData } from "../../hooks/use-storefront-shell-data"

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

export function StorefrontFloatingContactSection() {
  const { data } = useStorefrontShellData()
  const [draft, setDraft] = useState<StorefrontFloatingContact | null>(null)
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

        const nextConfig = await storefrontApi.getStorefrontFloatingContact(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load floating contact settings.")
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

      const saved = await storefrontApi.updateStorefrontFloatingContact(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Floating Contact",
        action: "saved",
        recordName: "Storefront floating contact",
      })
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save floating contact settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Floating contact save failed.",
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
                    <p className="text-sm font-medium">Show floating contact on storefront</p>
                    <p className="text-xs text-muted-foreground">Toggle the quick-contact launcher across storefront pages.</p>
                  </div>
                  <Switch checked={draft.enabled} onCheckedChange={(checked) => setDraft({ ...draft, enabled: checked })} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-[1rem] border border-border/70 px-4 py-3">
                    <span className="text-sm">WhatsApp</span>
                    <Switch checked={draft.showWhatsApp} onCheckedChange={(checked) => setDraft({ ...draft, showWhatsApp: checked })} />
                  </div>
                  <div className="flex items-center justify-between rounded-[1rem] border border-border/70 px-4 py-3">
                    <span className="text-sm">Phone</span>
                    <Switch checked={draft.showPhone} onCheckedChange={(checked) => setDraft({ ...draft, showPhone: checked })} />
                  </div>
                  <div className="flex items-center justify-between rounded-[1rem] border border-border/70 px-4 py-3">
                    <span className="text-sm">Email</span>
                    <Switch checked={draft.showEmail} onCheckedChange={(checked) => setDraft({ ...draft, showEmail: checked })} />
                  </div>
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
                  <Label>Primary icon</Label>
                  <Select value={draft.icon} onValueChange={(value: StorefrontFloatingContact["icon"]) => setDraft({ ...draft, icon: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">Contact</SelectItem>
                      <SelectItem value="message">Message</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="mail">Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Button label</Label>
                  <Input value={draft.buttonLabel} onChange={(event) => setDraft({ ...draft, buttonLabel: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>WhatsApp label</Label>
                  <Input value={draft.whatsappLabel} onChange={(event) => setDraft({ ...draft, whatsappLabel: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Phone label</Label>
                  <Input value={draft.phoneLabel} onChange={(event) => setDraft({ ...draft, phoneLabel: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Email label</Label>
                  <Input value={draft.emailLabel} onChange={(event) => setDraft({ ...draft, emailLabel: event.target.value })} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>WhatsApp message</Label>
                  <Textarea rows={4} value={draft.whatsappMessage} onChange={(event) => setDraft({ ...draft, whatsappMessage: event.target.value })} />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Links",
          value: "links",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-5">
                <div className="rounded-[1rem] border border-border/70 bg-card/60 p-4 text-sm text-muted-foreground">
                  Leave email and phone empty to keep using the storefront support contact automatically.
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Override phone</Label>
                    <Input value={draft.phone ?? ""} onChange={(event) => setDraft({ ...draft, phone: event.target.value || null })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Override email</Label>
                    <Input value={draft.email ?? ""} onChange={(event) => setDraft({ ...draft, email: event.target.value || null })} />
                  </div>
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
                <ColorField label="Button bg" value={draft.buttonBackgroundColor} onChange={(value) => setDraft({ ...draft, buttonBackgroundColor: value })} />
                <ColorField label="Button hover bg" value={draft.buttonHoverBackgroundColor} onChange={(value) => setDraft({ ...draft, buttonHoverBackgroundColor: value })} />
                <ColorField label="Button text" value={draft.buttonTextColor} onChange={(value) => setDraft({ ...draft, buttonTextColor: value })} />
                <ColorField label="Button border" value={draft.buttonBorderColor} onChange={(value) => setDraft({ ...draft, buttonBorderColor: value })} />
                <ColorField label="Button ring" value={draft.buttonRingColor} onChange={(value) => setDraft({ ...draft, buttonRingColor: value })} />
                <ColorField label="Action bg" value={draft.actionBackgroundColor} onChange={(value) => setDraft({ ...draft, actionBackgroundColor: value })} />
                <ColorField label="Action border" value={draft.actionBorderColor} onChange={(value) => setDraft({ ...draft, actionBorderColor: value })} />
                <ColorField label="Action text" value={draft.actionTextColor} onChange={(value) => setDraft({ ...draft, actionTextColor: value })} />
                <ColorField label="Action icon" value={draft.actionIconColor} onChange={(value) => setDraft({ ...draft, actionIconColor: value })} />
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
          {isSaving ? "Saving..." : "Save floating contact"}
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Preview of the floating button using current storefront support contact data.</CardDescription>
        </CardHeader>
        <CardContent className="relative min-h-[420px] bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? (
            <FloatingContactButton
              className="absolute bottom-6 right-6"
              contact={{
                email: data?.settings.supportEmail ?? null,
                phone: data?.settings.supportPhone ?? null,
              }}
              config={draft}
            />
          ) : null}
        </CardContent>
      </Card>

      <div>
        {draft ? <AnimatedTabs defaultTabValue="visibility" tabs={tabs} /> : null}
      </div>
    </div>
  )
}
