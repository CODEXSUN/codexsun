import { useEffect, useState } from "react"

import {
  storefrontSettingsSchema,
  type StorefrontSettings,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
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
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"

import { storefrontApi } from "../../api/storefront-api"
import { invalidateStorefrontShellData } from "../../hooks/use-storefront-shell-data"
import { storefrontPaths } from "../../lib/storefront-routes"

function parsePipeList(value: string) {
  return value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
}

function toDepartmentLines(settings: StorefrontSettings) {
  return settings.search.departments.map((item) => `${item.value}|${item.label}`).join("\n")
}

function parseDepartmentLines(value: string) {
  return parsePipeList(value).map((item, index) => {
    const [rawValue, rawLabel] = item.split("|")
    const safeValue = rawValue?.trim() || `department-${index + 1}`
    return {
      value: safeValue,
      label: rawLabel?.trim() || safeValue,
    }
  })
}

function toFooterLinkLines(settings: StorefrontSettings, groupId: string) {
  const group = settings.footer.groups.find((item) => item.id === groupId)
  return group ? group.links.map((item) => `${item.label}|${item.href}`).join("\n") : ""
}

function parseFooterLinkLines(value: string) {
  return parsePipeList(value).map((item) => {
    const [label, href] = item.split("|")
    return {
      label: label?.trim() ?? "",
      href: href?.trim() ?? "/",
    }
  })
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-[1.6rem] border-border/70 py-0 shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
  )
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function StorefrontSettingsSection() {
  const [draft, setDraft] = useState<StorefrontSettings | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const accessToken = getStoredAccessToken()

  useGlobalLoading(isLoading || isSaving)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!accessToken) {
        setError("Admin session is required.")
        setIsLoading(false)
        return
      }

      try {
        const settings = await storefrontApi.getStorefrontSettings(accessToken)
        if (!cancelled) {
          setDraft(settings)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load storefront settings."
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
  }, [accessToken])

  if (isLoading) {
    return (
      <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading storefront settings...
        </CardContent>
      </Card>
    )
  }

  if (error || !draft) {
    return (
      <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-destructive">
          {error ?? "Storefront settings are unavailable."}
        </CardContent>
      </Card>
    )
  }

  const sectionEntries = [
    { key: "featured", label: "Featured" },
    { key: "categories", label: "Categories" },
    { key: "newArrivals", label: "New arrivals" },
    { key: "bestSellers", label: "Best sellers" },
  ] as const

  return (
    <div className="space-y-4">
      <Card className="border border-border/70 bg-background/90 shadow-sm">
        <CardHeader>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Storefront
          </p>
          <CardTitle>Storefront tone editor</CardTitle>
          <CardDescription className="max-w-3xl text-sm leading-7">
            Edit the public header, hero, search, sections, trust notes, and footer copy from
            ecommerce. Categories and products still come from core.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            className="rounded-full"
            disabled={isSaving}
            onClick={async () => {
              if (!accessToken) {
                setError("Admin session is required.")
                return
              }

              setIsSaving(true)
              setSaveMessage(null)
              setError(null)

              try {
                const validatedDraft = storefrontSettingsSchema.safeParse(draft)

                if (!validatedDraft.success) {
                  const firstIssue = validatedDraft.error.issues[0]
                  const issuePath = firstIssue?.path.join(".") ?? "payload"
                  setError(`${issuePath}: ${firstIssue?.message ?? "Invalid value."}`)
                  setIsSaving(false)
                  return
                }

                const saved = await storefrontApi.updateStorefrontSettings(
                  accessToken,
                  validatedDraft.data
                )
                setDraft(saved)
                invalidateStorefrontShellData()
                setSaveMessage("Storefront settings saved.")
              } catch (saveError) {
                setError(
                  saveError instanceof Error
                    ? saveError.message
                    : "Failed to save storefront settings."
                )
              } finally {
                setIsSaving(false)
              }
            }}
          >
            {isSaving ? "Saving..." : "Save storefront"}
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <a href={storefrontPaths.home()} target="_blank" rel="noreferrer">
              Open storefront
            </a>
          </Button>
          {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
        </CardContent>
      </Card>

      <SectionCard
        title="Commerce basics"
        description="Announcement strip, support details, and shipping values."
      >
        <FormField label="Announcement">
          <Textarea
            value={draft.announcement}
            onChange={(event) =>
              setDraft({ ...draft, announcement: event.target.value })
            }
            rows={3}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Support Phone">
            <Input
              value={draft.supportPhone}
              onChange={(event) =>
                setDraft({ ...draft, supportPhone: event.target.value })
              }
            />
          </FormField>
          <FormField label="Support Email">
            <Input
              value={draft.supportEmail}
              onChange={(event) =>
                setDraft({ ...draft, supportEmail: event.target.value })
              }
            />
          </FormField>
          <FormField label="Free Shipping Threshold">
            <Input
              type="number"
              value={draft.freeShippingThreshold}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  freeShippingThreshold: Number(event.target.value || 0),
                })
              }
            />
          </FormField>
          <FormField label="Default Shipping Amount">
            <Input
              type="number"
              value={draft.defaultShippingAmount}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  defaultShippingAmount: Number(event.target.value || 0),
                })
              }
            />
          </FormField>
        </div>
      </SectionCard>

      <SectionCard
        title="Hero and search"
        description="Main visual tone, search placeholder, and storefront department options."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Hero Eyebrow">
            <Input
              value={draft.hero.eyebrow}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, eyebrow: event.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Hero Image URL">
            <Input
              value={draft.hero.heroImageUrl}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, heroImageUrl: event.target.value },
                })
              }
            />
          </FormField>
        </div>
        <FormField label="Hero Title">
          <Input
            value={draft.hero.title}
            onChange={(event) =>
              setDraft({
                ...draft,
                hero: { ...draft.hero, title: event.target.value },
              })
            }
          />
        </FormField>
        <FormField label="Hero Summary">
          <Textarea
            value={draft.hero.summary}
            onChange={(event) =>
              setDraft({
                ...draft,
                hero: { ...draft.hero, summary: event.target.value },
              })
            }
            rows={4}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FormField label="Primary CTA Label">
            <Input
              value={draft.hero.primaryCtaLabel}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, primaryCtaLabel: event.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Primary CTA Href">
            <Input
              value={draft.hero.primaryCtaHref}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, primaryCtaHref: event.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Secondary CTA Label">
            <Input
              value={draft.hero.secondaryCtaLabel}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, secondaryCtaLabel: event.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Secondary CTA Href">
            <Input
              value={draft.hero.secondaryCtaHref}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  hero: { ...draft.hero, secondaryCtaHref: event.target.value },
                })
              }
            />
          </FormField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {draft.hero.highlights.map((highlight, index) => (
            <Card key={highlight.id} className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-3 p-4">
                <FormField label={`Highlight ${index + 1} Label`}>
                  <Input
                    value={highlight.label}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          highlights: draft.hero.highlights.map((item) =>
                            item.id === highlight.id
                              ? { ...item, label: event.target.value }
                              : item
                          ),
                        },
                      })
                    }
                  />
                </FormField>
                <FormField label={`Highlight ${index + 1} Summary`}>
                  <Textarea
                    value={highlight.summary}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        hero: {
                          ...draft.hero,
                          highlights: draft.hero.highlights.map((item) =>
                            item.id === highlight.id
                              ? { ...item, summary: event.target.value }
                              : item
                          ),
                        },
                      })
                    }
                    rows={3}
                  />
                </FormField>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Search Placeholder">
            <Input
              value={draft.search.placeholder}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  search: { ...draft.search, placeholder: event.target.value },
                })
              }
            />
          </FormField>
          <FormField label="Department Label">
            <Input
              value={draft.search.departmentLabel}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  search: { ...draft.search, departmentLabel: event.target.value },
                })
              }
            />
          </FormField>
        </div>
        <FormField label="Departments (one per line: value|label)">
          <Textarea
            value={toDepartmentLines(draft)}
            onChange={(event) =>
              setDraft({
                ...draft,
                search: {
                  ...draft.search,
                  departments: parseDepartmentLines(event.target.value),
                },
              })
            }
            rows={6}
          />
        </FormField>
      </SectionCard>

      <SectionCard
        title="Section copy"
        description="Headings and CTA copy for featured, category, arrivals, best-seller, and campaign blocks."
      >
        {sectionEntries.map(({ key, label }) => {
          const section = draft.sections[key]
          return (
            <Card key={key} className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-4 p-4">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Eyebrow">
                    <Input
                      value={section.eyebrow}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            [key]: { ...section, eyebrow: event.target.value },
                          },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="Title">
                    <Input
                      value={section.title}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            [key]: { ...section, title: event.target.value },
                          },
                        })
                      }
                    />
                  </FormField>
                </div>
                <FormField label="Summary">
                  <Textarea
                    value={section.summary}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        sections: {
                          ...draft.sections,
                          [key]: { ...section, summary: event.target.value },
                        },
                      })
                    }
                    rows={3}
                  />
                </FormField>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="CTA Label">
                    <Input
                      value={section.ctaLabel ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            [key]: { ...section, ctaLabel: event.target.value || null },
                          },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="CTA Href">
                    <Input
                      value={section.ctaHref ?? ""}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          sections: {
                            ...draft.sections,
                            [key]: { ...section, ctaHref: event.target.value || null },
                          },
                        })
                      }
                    />
                  </FormField>
                </div>
              </CardContent>
            </Card>
          )
        })}
        <Card className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
          <CardContent className="grid gap-4 p-4">
            <p className="text-sm font-semibold text-foreground">Campaign CTA</p>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Eyebrow">
                <Input
                  value={draft.sections.cta.eyebrow}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: { ...draft.sections.cta, eyebrow: event.target.value },
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Title">
                <Input
                  value={draft.sections.cta.title}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: { ...draft.sections.cta, title: event.target.value },
                      },
                    })
                  }
                />
              </FormField>
            </div>
            <FormField label="Summary">
              <Textarea
                value={draft.sections.cta.summary}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    sections: {
                      ...draft.sections,
                      cta: { ...draft.sections.cta, summary: event.target.value },
                    },
                  })
                }
                rows={3}
              />
            </FormField>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <FormField label="Primary CTA Label">
                <Input
                  value={draft.sections.cta.primaryCtaLabel}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: {
                          ...draft.sections.cta,
                          primaryCtaLabel: event.target.value,
                        },
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Primary CTA Href">
                <Input
                  value={draft.sections.cta.primaryCtaHref}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: {
                          ...draft.sections.cta,
                          primaryCtaHref: event.target.value,
                        },
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Secondary CTA Label">
                <Input
                  value={draft.sections.cta.secondaryCtaLabel}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: {
                          ...draft.sections.cta,
                          secondaryCtaLabel: event.target.value,
                        },
                      },
                    })
                  }
                />
              </FormField>
              <FormField label="Secondary CTA Href">
                <Input
                  value={draft.sections.cta.secondaryCtaHref}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      sections: {
                        ...draft.sections,
                        cta: {
                          ...draft.sections.cta,
                          secondaryCtaHref: event.target.value,
                        },
                      },
                    })
                  }
                />
              </FormField>
            </div>
          </CardContent>
        </Card>
      </SectionCard>

      <SectionCard
        title="Trust and footer"
        description="Trust note cards and footer link groups."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {draft.trustNotes.map((note) => (
            <Card key={note.id} className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-3 p-4">
                <FormField label="Title">
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
                </FormField>
                <FormField label="Summary">
                  <Textarea
                    value={note.summary}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        trustNotes: draft.trustNotes.map((item) =>
                          item.id === note.id ? { ...item, summary: event.target.value } : item
                        ),
                      })
                    }
                    rows={3}
                  />
                </FormField>
                <FormField label="Icon Key">
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
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select icon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sparkles">Sparkles</SelectItem>
                      <SelectItem value="truck">Truck</SelectItem>
                      <SelectItem value="shield">Shield</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>
          ))}
        </div>
        <FormField label="Footer Description">
          <Textarea
            value={draft.footer.description}
            onChange={(event) =>
              setDraft({
                ...draft,
                footer: { ...draft.footer, description: event.target.value },
              })
            }
            rows={3}
          />
        </FormField>
        <div className="grid gap-4 md:grid-cols-2">
          {draft.footer.groups.map((group) => (
            <Card key={group.id} className="rounded-[1.4rem] border-border/70 py-0 shadow-sm">
              <CardContent className="grid gap-3 p-4">
                <FormField label="Group Title">
                  <Input
                    value={group.title}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        footer: {
                          ...draft.footer,
                          groups: draft.footer.groups.map((item) =>
                            item.id === group.id ? { ...item, title: event.target.value } : item
                          ),
                        },
                      })
                    }
                  />
                </FormField>
                <FormField label="Links (one per line: label|href)">
                  <Textarea
                    value={toFooterLinkLines(draft, group.id)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        footer: {
                          ...draft.footer,
                          groups: draft.footer.groups.map((item) =>
                            item.id === group.id
                              ? { ...item, links: parseFooterLinkLines(event.target.value) }
                              : item
                          ),
                        },
                      })
                    }
                    rows={6}
                  />
                </FormField>
              </CardContent>
            </Card>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
