import { Plus, Save, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

import type { StorefrontFooter } from "@ecommerce/shared"
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
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useRuntimeBrand } from "@/features/branding/runtime-brand-provider"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import { StorefrontFooterSurface } from "../../components/storefront-footer-surface"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"
import {
  StorefrontDesignerPermissionCard,
  useStorefrontDesignerAccess,
} from "./storefront-designer-access"
import {
  FOOTER_SOCIAL_PLATFORM_OPTIONS,
  getFooterSocialPlatformIcon,
} from "../../lib/storefront-footer-socials"

function createFooterGroup(index: number): StorefrontFooter["groups"][number] {
  return {
    id: `footer-group:${index + 1}`,
    title: `Column ${index + 1}`,
    links: [{ label: "New link", href: "/" }],
  }
}

function createSocialLink(index: number): StorefrontFooter["socialLinks"][number] {
  return {
    id: `footer-social:${index + 1}`,
    label: "Website",
    href: "https://example.com",
    platform: "website",
  }
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
      <Input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full p-1" />
    </div>
  )
}

export function StorefrontFooterSection() {
  const { canEditStorefrontDesigner } = useStorefrontDesignerAccess()
  const { brand } = useRuntimeBrand()
  const [draft, setDraft] = useState<StorefrontFooter | null>(null)
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

        const nextFooter = await storefrontApi.getStorefrontFooter(accessToken)
        if (!cancelled) {
          setDraft(nextFooter)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load storefront footer.")
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

      const saved = await storefrontApi.updateStorefrontFooter(accessToken, draft)
      setDraft(saved)
      invalidateStorefrontShellData()
      showRecordToast({
        entity: "Footer",
        action: "saved",
        recordName: "Storefront footer",
      })
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save storefront footer."
      setError(message)
      showAppToast({
        variant: "error",
        title: "Footer save failed.",
        description: message,
      })
    } finally {
      setIsSaving(false)
    }
  }

  const tabs: AnimatedContentTab[] = draft
    ? [
        {
          label: "Copy",
          value: "copy",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardContent className="space-y-4 p-5">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    rows={5}
                    value={draft.description}
                    onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  />
                </div>
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Columns",
          value: "columns",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[1.1rem] tracking-tight">Footer columns</CardTitle>
                    <CardDescription>Headings and dynamic links for each footer column.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() => setDraft({ ...draft, groups: [...draft.groups, createFooterGroup(draft.groups.length)] })}
                  >
                    <Plus className="size-4" />
                    Add column
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 p-5">
                {draft.groups.map((group, groupIndex) => (
                  <div key={group.id} className="space-y-4 rounded-[1.2rem] border border-border/70 bg-background/70 p-4">
                    <div className="flex items-center gap-3">
                      <Input
                        value={group.title}
                        onChange={(event) =>
                          setDraft({
                            ...draft,
                            groups: draft.groups.map((item, index) =>
                              index === groupIndex ? { ...item, title: event.target.value } : item
                            ),
                          })
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          draft.groups.length > 1 &&
                          setDraft({
                            ...draft,
                            groups: draft.groups.filter((_, index) => index !== groupIndex),
                          })
                        }
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    {group.links.map((link, linkIndex) => (
                      <div key={`${group.id}:${linkIndex}`} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <Input
                          value={link.label}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              groups: draft.groups.map((item, index) =>
                                index === groupIndex
                                  ? {
                                      ...item,
                                      links: item.links.map((linkItem, itemIndex) =>
                                        itemIndex === linkIndex ? { ...linkItem, label: event.target.value } : linkItem
                                      ),
                                    }
                                  : item
                              ),
                            })
                          }
                        />
                        <Input
                          value={link.href}
                          onChange={(event) =>
                            setDraft({
                              ...draft,
                              groups: draft.groups.map((item, index) =>
                                index === groupIndex
                                  ? {
                                      ...item,
                                      links: item.links.map((linkItem, itemIndex) =>
                                        itemIndex === linkIndex ? { ...linkItem, href: event.target.value } : linkItem
                                      ),
                                    }
                                  : item
                              ),
                            })
                          }
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDraft({
                              ...draft,
                              groups: draft.groups.map((item, index) =>
                                index === groupIndex
                                  ? {
                                      ...item,
                                      links:
                                        item.links.length > 1
                                          ? item.links.filter((_, itemIndex) => itemIndex !== linkIndex)
                                          : item.links,
                                    }
                                  : item
                              ),
                            })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          groups: draft.groups.map((item, index) =>
                            index === groupIndex
                              ? { ...item, links: [...item.links, { label: "New link", href: "/" }] }
                              : item
                          ),
                        })
                      }
                    >
                      <Plus className="size-4" />
                      Add link
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          ),
        },
        {
          label: "Bottom Bar",
          value: "bottom-bar",
          content: (
            <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
              <CardHeader className="border-b border-border/70">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-[1.1rem] tracking-tight">Bottom bar</CardTitle>
                    <CardDescription>Control the bottom-left social icons and the copyright text on the right.</CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      setDraft({ ...draft, socialLinks: [...draft.socialLinks, createSocialLink(draft.socialLinks.length)] })
                    }
                  >
                    <Plus className="size-4" />
                    Add social
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <div className="space-y-2 pb-2">
                  <Label>Copyright text</Label>
                  <Input
                    value={draft.legalLine}
                    onChange={(event) => setDraft({ ...draft, legalLine: event.target.value })}
                  />
                </div>
                {draft.socialLinks.map((item, index) => (
                  <div key={item.id} className="grid gap-3 md:grid-cols-[160px_minmax(0,1fr)_minmax(0,1fr)_auto]">
                    {(() => {
                      const PlatformIcon = getFooterSocialPlatformIcon(item.platform)

                      return (
                    <Select
                      value={item.platform}
                      onValueChange={(value: StorefrontFooter["socialLinks"][number]["platform"]) =>
                        setDraft({
                          ...draft,
                          socialLinks: draft.socialLinks.map((socialItem, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...socialItem,
                                  platform: value,
                                }
                              : socialItem
                          ),
                        })
                      }
                    >
                      <SelectTrigger>
                        <div className="flex items-center gap-2">
                          <PlatformIcon className="size-4 text-muted-foreground" />
                          <span>{FOOTER_SOCIAL_PLATFORM_OPTIONS.find((option) => option.platform === item.platform)?.label ?? "Website"}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {FOOTER_SOCIAL_PLATFORM_OPTIONS.map((platformOption) => {
                          const OptionIcon = getFooterSocialPlatformIcon(platformOption.platform)

                          return (
                            <SelectItem key={platformOption.platform} value={platformOption.platform}>
                              <div className="flex items-center gap-2">
                                <OptionIcon className="size-4 text-muted-foreground" />
                                <span>{platformOption.label}</span>
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                      )
                    })()}
                    <Input
                      value={item.label}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          socialLinks: draft.socialLinks.map((socialItem, itemIndex) =>
                            itemIndex === index ? { ...socialItem, label: event.target.value } : socialItem
                          ),
                        })
                      }
                    />
                    <Input
                      value={item.href}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          socialLinks: draft.socialLinks.map((socialItem, itemIndex) =>
                            itemIndex === index ? { ...socialItem, href: event.target.value } : socialItem
                          ),
                        })
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          socialLinks: draft.socialLinks.filter((_, itemIndex) => itemIndex !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
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
              <CardContent className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                <ColorField label="Background" value={draft.design.backgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, backgroundColor: value } })} />
                <ColorField label="Border" value={draft.design.borderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, borderColor: value } })} />
                <ColorField label="Title text" value={draft.design.titleColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, titleColor: value } })} />
                <ColorField label="Body text" value={draft.design.bodyTextColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, bodyTextColor: value } })} />
                <ColorField label="Muted text" value={draft.design.mutedTextColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, mutedTextColor: value } })} />
                <ColorField label="Logo backdrop" value={draft.design.logoBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, logoBackgroundColor: value } })} />
                <ColorField label="Social bg" value={draft.design.socialButtonBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, socialButtonBackgroundColor: value } })} />
                <ColorField label="Social border" value={draft.design.socialButtonBorderColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, socialButtonBorderColor: value } })} />
                <ColorField label="Social icon" value={draft.design.socialButtonIconColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, socialButtonIconColor: value } })} />
                <ColorField label="Social hover bg" value={draft.design.socialButtonHoverBackgroundColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, socialButtonHoverBackgroundColor: value } })} />
                <ColorField label="Social hover icon" value={draft.design.socialButtonHoverIconColor} onChange={(value) => setDraft({ ...draft, design: { ...draft.design, socialButtonHoverIconColor: value } })} />
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

      <StorefrontDesignerPermissionCard canEdit={canEditStorefrontDesigner} />

      <div className="flex items-center justify-end">
        <Button type="button" className="gap-2" disabled={!draft || !canEditStorefrontDesigner || isSaving} onClick={() => void handleSave()}>
          <Save className="size-4" />
          {isSaving ? "Saving..." : "Save footer"}
        </Button>
      </div>

      <Card className="overflow-hidden rounded-[1.6rem] border-border/70 py-0 shadow-sm">
        <CardHeader className="border-b border-border/70">
          <CardTitle className="text-[1.2rem] tracking-tight">Live preview</CardTitle>
          <CardDescription>Current storefront footer using the configured colors, text, icons, and links.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-5">
          {draft ? (
            <StorefrontFooterSurface
              brand={brand}
              footer={draft}
              previewMode
              supportEmail={brand?.primaryEmail}
              supportPhone={brand?.primaryPhone}
            />
          ) : (
            <div className="p-5 text-sm text-muted-foreground">Loading footer preview...</div>
          )}
        </CardContent>
      </Card>

      <div>
        {draft ? <AnimatedTabs defaultTabValue="copy" tabs={tabs} /> : null}
      </div>
    </div>
  )
}
