import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontCampaignSection } from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { CampaignTrustSection } from "@/components/blocks/campaign-trust-section"
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

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"

function createTrustNote(index: number): StorefrontCampaignSection["trustNotes"][number] {
  return {
    id: `trust:${index + 1}`,
    title: `Trust card ${index + 1}`,
    summary: "Explain the reassurance point shown on the storefront.",
    iconKey: "sparkles",
  }
}

function LabeledField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

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

export function StorefrontCampaignSection() {
  const [draft, setDraft] = useState<StorefrontCampaignSection | null>(null)
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

        const nextConfig = await storefrontApi.getStorefrontCampaign(accessToken)
        if (!cancelled) {
          setDraft(nextConfig)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load campaign settings.")
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

      const saved = await storefrontApi.updateStorefrontCampaign(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Campaign",
        action: "saved",
        recordName: "Storefront campaign",
      })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save storefront campaign."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Campaign save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: AnimatedContentTab[] = draft
    ? [
        {
          label: "Campaign",
          value: "campaign",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-[1.1rem] tracking-tight">Campaign card</CardTitle>
                <CardDescription>Labeled text fields for the left CTA card on the storefront.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Show campaign card on storefront</p>
                    <p className="text-xs text-muted-foreground">Controls the left promotional card in the campaign row.</p>
                  </div>
                  <Switch
                    checked={draft.visibility.cta}
                    onCheckedChange={(checked) =>
                      setDraft({ ...draft, visibility: { ...draft.visibility, cta: checked } })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <LabeledField label="Eyebrow text">
                    <Input
                      value={draft.campaign.eyebrow}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, eyebrow: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                  <LabeledField label="Heading text">
                    <Input
                      value={draft.campaign.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, title: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                </div>

                <LabeledField label="Description text">
                  <Textarea
                    rows={4}
                    value={draft.campaign.summary}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        campaign: { ...draft.campaign, summary: event.target.value },
                      })
                    }
                  />
                </LabeledField>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <LabeledField label="Primary button text">
                    <Input
                      value={draft.campaign.primaryCtaLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, primaryCtaLabel: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                  <LabeledField label="Primary button link">
                    <Input
                      value={draft.campaign.primaryCtaHref}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, primaryCtaHref: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                  <LabeledField label="Secondary button text">
                    <Input
                      value={draft.campaign.secondaryCtaLabel}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, secondaryCtaLabel: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                  <LabeledField label="Secondary button link">
                    <Input
                      value={draft.campaign.secondaryCtaHref}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          campaign: { ...draft.campaign, secondaryCtaHref: event.target.value },
                        })
                      }
                    />
                  </LabeledField>
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Trust",
          value: "trust",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[1.1rem] tracking-tight">Trust cards</CardTitle>
                    <CardDescription>Labeled fields for the right-side reassurance cards.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        trustNotes: [...draft.trustNotes, createTrustNote(draft.trustNotes.length)],
                      })
                    }
                  >
                    <Plus className="size-4" />
                    Add card
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-5 p-5">
                <div className="flex items-center justify-between rounded-[1rem] border border-border/70 bg-card/60 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Show trust cards on storefront</p>
                    <p className="text-xs text-muted-foreground">Controls the right-side reassurance stack in the campaign row.</p>
                  </div>
                  <Switch
                    checked={draft.visibility.trust}
                    onCheckedChange={(checked) =>
                      setDraft({ ...draft, visibility: { ...draft.visibility, trust: checked } })
                    }
                  />
                </div>

                {draft.trustNotes.map((note, index) => (
                  <div
                    key={note.id}
                    className="space-y-4 rounded-[1.2rem] border border-border/70 bg-background/70 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">Trust card {index + 1}</p>
                        <p className="text-xs text-muted-foreground">Edit the title, description, and icon shown on the storefront.</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={draft.trustNotes.length <= 1}
                        onClick={() =>
                          draft.trustNotes.length > 1 &&
                          setDraft({
                            ...draft,
                            trustNotes: draft.trustNotes.filter((item) => item.id !== note.id),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <LabeledField label="Card heading text">
                        <Input
                          value={note.title}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              trustNotes: draft.trustNotes.map((item) =>
                                item.id === note.id ? { ...item, title: event.target.value } : item
                              ),
                            })
                          }
                        />
                      </LabeledField>
                      <LabeledField label="Card icon">
                        <Select
                          value={note.iconKey}
                          onValueChange={(value: "sparkles" | "truck" | "shield") =>
                            setDraft({
                              ...draft,
                              trustNotes: draft.trustNotes.map((item) =>
                                item.id === note.id ? { ...item, iconKey: value } : item
                              ),
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select card icon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sparkles">Sparkles</SelectItem>
                            <SelectItem value="truck">Truck</SelectItem>
                            <SelectItem value="shield">Shield</SelectItem>
                          </SelectContent>
                        </Select>
                      </LabeledField>
                    </div>

                    <LabeledField label="Card description text">
                      <Textarea
                        rows={4}
                        value={note.summary}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            trustNotes: draft.trustNotes.map((item) =>
                              item.id === note.id ? { ...item, summary: event.target.value } : item
                            ),
                          })
                        }
                      />
                    </LabeledField>
                  </div>
                ))}
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Design",
          value: "design",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/70">
                <CardTitle className="text-[1.1rem] tracking-tight">Design controls</CardTitle>
                <CardDescription>Customize campaign and trust colors used on the live storefront.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 p-5">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Campaign card colors</p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ColorField label="Campaign background start" value={draft.design.campaignBackgroundFrom} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignBackgroundFrom: value } })} />
                    <ColorField label="Campaign background end" value={draft.design.campaignBackgroundTo} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignBackgroundTo: value } })} />
                    <ColorField label="Campaign border" value={draft.design.campaignBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignBorderColor: value } })} />
                    <ColorField label="Eyebrow text color" value={draft.design.campaignEyebrowColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignEyebrowColor: value } })} />
                    <ColorField label="Heading text color" value={draft.design.campaignTitleColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignTitleColor: value } })} />
                    <ColorField label="Description text color" value={draft.design.campaignSummaryColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, campaignSummaryColor: value } })} />
                    <ColorField label="Primary button bg" value={draft.design.primaryButtonBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, primaryButtonBackgroundColor: value } })} />
                    <ColorField label="Primary button text" value={draft.design.primaryButtonTextColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, primaryButtonTextColor: value } })} />
                    <ColorField label="Primary button border" value={draft.design.primaryButtonBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, primaryButtonBorderColor: value } })} />
                    <ColorField label="Secondary button bg" value={draft.design.secondaryButtonBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, secondaryButtonBackgroundColor: value } })} />
                    <ColorField label="Secondary button text" value={draft.design.secondaryButtonTextColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, secondaryButtonTextColor: value } })} />
                    <ColorField label="Secondary button border" value={draft.design.secondaryButtonBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, secondaryButtonBorderColor: value } })} />
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Trust card colors</p>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    <ColorField label="Trust card bg" value={draft.design.trustCardBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustCardBackgroundColor: value } })} />
                    <ColorField label="Trust card border" value={draft.design.trustCardBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustCardBorderColor: value } })} />
                    <ColorField label="Trust hover border" value={draft.design.trustCardHoverBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustCardHoverBorderColor: value } })} />
                    <ColorField label="Icon bg" value={draft.design.trustIconBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustIconBackgroundColor: value } })} />
                    <ColorField label="Icon color" value={draft.design.trustIconColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustIconColor: value } })} />
                    <ColorField label="Icon hover bg" value={draft.design.trustIconHoverBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustIconHoverBackgroundColor: value } })} />
                    <ColorField label="Icon hover color" value={draft.design.trustIconHoverColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustIconHoverColor: value } })} />
                    <ColorField label="Title color" value={draft.design.trustTitleColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustTitleColor: value } })} />
                    <ColorField label="Title hover color" value={draft.design.trustTitleHoverColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustTitleHoverColor: value } })} />
                    <ColorField label="Summary color" value={draft.design.trustSummaryColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustSummaryColor: value } })} />
                    <ColorField label="Summary hover color" value={draft.design.trustSummaryHoverColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, trustSummaryHoverColor: value } })} />
                  </div>
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
          {isSaving ? "Saving..." : "Save campaign"}
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Exact storefront campaign and trust row using the current editable content.</CardDescription>
        </CardHeader>
        <CardContent className="bg-[linear-gradient(180deg,#f7f1ea_0%,#f3ede6_100%)] p-4 pt-5">
          {draft ? (
            <CampaignTrustSection
              campaign={draft.campaign}
              trustNotes={draft.trustNotes}
              visibility={draft.visibility}
              design={draft.design}
            />
          ) : (
            <div className="p-5 text-sm text-muted-foreground">Loading campaign preview...</div>
          )}
        </CardContent>
      </Card>

      <div>{draft ? <AnimatedTabs defaultTabValue="campaign" tabs={tabs} /> : null}</div>
    </div>
  )
}
