import { useEffect, useState } from "react"
import { MailCheck, Settings2, Sparkles } from "lucide-react"

import type { EcommerceSettings } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"

function LoadingCard({ message }: { message: string }) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardContent className="space-y-4 p-5">
        <div className="h-5 w-48 animate-pulse rounded-md bg-muted" />
        <div className="space-y-3">
          <div className="h-20 animate-pulse rounded-2xl bg-muted/80" />
          <div className="h-20 animate-pulse rounded-2xl bg-muted/60" />
        </div>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  )
}

function StateCard({ message }: { message: string }) {
  return (
    <Card className="border border-border/70 bg-background/90 shadow-sm">
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

export function EcommerceSettingsSection() {
  const [settings, setSettings] = useState<EcommerceSettings | null>(null)
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

        const nextSettings = await storefrontApi.getEcommerceSettings(accessToken)

        if (!cancelled) {
          setSettings(nextSettings)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load ecommerce settings."
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

  async function handleAutoWelcomeMailChange(checked: boolean) {
    if (!settings) {
      return
    }

    const accessToken = getStoredAccessToken()

    if (!accessToken) {
      setError("Admin access token is required.")
      return
    }

    const previous = settings
    const optimistic = {
      ...settings,
      automation: {
        ...settings.automation,
        autoSendWelcomeMail: checked,
      },
    }

    setSettings(optimistic)
    setIsSaving(true)
    setError(null)

    try {
      const saved = await storefrontApi.updateEcommerceSettings(accessToken, {
        automation: {
          autoSendWelcomeMail: checked,
        },
      })

      setSettings(saved)
      showRecordToast({
        entity: "Ecommerce settings",
        action: "updated",
        recordName: "Customer automation",
      })
    } catch (saveError) {
      setSettings(previous)
      const message =
        saveError instanceof Error ? saveError.message : "Failed to update ecommerce settings."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Ecommerce settings update failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading ecommerce settings..." />
  }

  if (error && !settings) {
    return <StateCard message={error} />
  }

  if (!settings) {
    return <StateCard message="Ecommerce settings are unavailable." />
  }

  const tabs: AnimatedContentTab[] = [
    {
      label: "Automation",
      value: "automation",
      content: (
        <div className="space-y-4">
          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader className="space-y-3">
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <MailCheck className="size-3.5" />
                Customer mail
              </div>
              <div className="space-y-2">
                <CardTitle>Welcome mail automation</CardTitle>
                <CardDescription className="max-w-3xl text-sm leading-7">
                  Control whether the first successful customer login should send the{" "}
                  <span className="font-mono text-foreground">storefront_customer_welcome</span>{" "}
                  template automatically.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-card/60 p-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Label htmlFor="ecommerce-auto-welcome-mail" className="text-sm font-medium">
                      Auto send welcome mail
                    </Label>
                    <Badge
                      variant="outline"
                      className={
                        settings.automation.autoSendWelcomeMail
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700"
                          : "border-slate-500/30 bg-slate-500/10 text-slate-700"
                      }
                    >
                      {settings.automation.autoSendWelcomeMail ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Turning this off stops the automatic welcome mail only. Admins can still send
                    the welcome mail manually from the customer preview page.
                  </p>
                </div>
                <Switch
                  id="ecommerce-auto-welcome-mail"
                  checked={settings.automation.autoSendWelcomeMail}
                  onCheckedChange={(checked) => void handleAutoWelcomeMailChange(checked)}
                  disabled={isSaving}
                />
              </div>
              {error ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  {error}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
            <CardHeader>
              <CardTitle>Reserved for upcoming controls</CardTitle>
              <CardDescription>
                This page is the dedicated home for ecommerce-owned settings. Future customer,
                communication, and operational toggles can be added here without mixing them into
                storefront design screens.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Customer automation and communication policy controls.
              </div>
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
                Future ecommerce runtime preferences and admin safeguards.
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      contentClassName: "space-y-4",
    },
    {
      label: "Roadmap",
      value: "roadmap",
      content: (
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardHeader>
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              <Sparkles className="size-3.5" />
              More coming
            </div>
            <CardTitle>Settings space reserved</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-7">
              Keep future ecommerce settings here instead of spreading them across unrelated admin
              pages.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
              Add the next ecommerce-owned settings blocks here when the workflows are ready.
            </div>
          </CardContent>
        </Card>
      ),
      contentClassName: "space-y-4",
    },
  ]

  return (
    <div className="space-y-4">
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            <Settings2 className="size-3.5" />
            Ecommerce settings
          </div>
          <div className="space-y-2">
            <CardTitle>Ecommerce app settings</CardTitle>
            <CardDescription className="max-w-3xl text-sm leading-7">
              Manage ecommerce-owned automation and admin behavior from one dedicated settings
              workspace.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <AnimatedTabs defaultTabValue="automation" tabs={tabs} />
    </div>
  )
}
