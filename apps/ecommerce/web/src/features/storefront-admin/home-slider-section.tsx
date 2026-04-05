import { Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import {
  storefrontHomeSliderSchema,
  type StorefrontHomeSlider,
  type StorefrontHomeSliderSlide,
  type StorefrontHomeSliderTheme,
} from "@ecommerce/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { showAppToast, showRecordToast } from "@/components/ui/app-toast"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import { storefrontApi } from "../../api/storefront-api"
import {
  applyHomeSliderThemePreset,
  homeSliderThemeOptions,
  resolveHomeSliderThemeStyles,
} from "../../lib/home-slider-theme"
import { storefrontPaths } from "../../lib/storefront-routes"

function createDefaultTheme(themeKey = homeSliderThemeOptions[0]?.value ?? "signature-ember") {
  return applyHomeSliderThemePreset(
    {
      themeKey,
      backgroundFrom: homeSliderThemeOptions[0]?.backgroundFrom ?? "#3d2219",
      backgroundVia: homeSliderThemeOptions[0]?.backgroundVia ?? "#7c5642",
      backgroundTo: homeSliderThemeOptions[0]?.backgroundTo ?? "#efe3d6",
      textColor: null,
      mutedTextColor: null,
      badgeBackground: null,
      badgeTextColor: null,
      primaryButtonLabel: "Buy now",
      secondaryButtonLabel: "View details",
      primaryButtonBackground: null,
      primaryButtonTextColor: null,
      secondaryButtonBackground: null,
      secondaryButtonTextColor: null,
      navBackground: null,
      navTextColor: null,
      frameBackground: null,
      outerFrameBorderColor: null,
      innerFrameBorderColor: null,
      imagePanelBackground: "#ffffff",
    } satisfies StorefrontHomeSliderTheme,
    themeKey
  )
}

function createSlide(index: number): StorefrontHomeSliderSlide {
  const option = homeSliderThemeOptions[index % homeSliderThemeOptions.length]
  const sequence = String(index + 1).padStart(2, "0")

  return {
    id: `home-slider:${sequence}`,
    label: `Slider ${sequence}`,
    theme: createDefaultTheme(option?.value),
  }
}

function SliderFieldRow({
  description,
  field,
  label,
}: {
  description?: string
  field: React.ReactNode
  label: string
}) {
  return (
    <div className="grid gap-2 border-b border-border/60 px-4 py-4 last:border-b-0 md:grid-cols-[180px_minmax(0,1fr)] md:gap-4">
      <div className="space-y-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </p>
        {description ? (
          <p className="text-xs leading-5 text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div>{field}</div>
    </div>
  )
}

function SliderTableCard({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden rounded-[1.5rem] border-border/70 py-0 shadow-sm">
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function ThemeColorInput({
  allowAuto = false,
  label,
  onChange,
  value,
}: {
  allowAuto?: boolean
  label: string
  onChange: (value: string | null) => void
  value: string | null
}) {
  const resolvedValue = value ?? "#ffffff"

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        aria-label={label}
        type="color"
        value={resolvedValue}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-14 rounded-md border border-input bg-background p-1"
      />
      <Input
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value.trim() || null)}
        className="max-w-[180px] font-mono"
        placeholder={allowAuto ? "Auto" : "#ffffff"}
      />
      {allowAuto ? (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange(null)}>
          Auto
        </Button>
      ) : null}
    </div>
  )
}

function HomeSliderPreview({
  slide,
}: {
  slide: StorefrontHomeSliderSlide
}) {
  const styles = resolveHomeSliderThemeStyles(slide.theme)

  return (
    <div
      className="overflow-hidden rounded-[2rem] border border-border/60 p-5 shadow-[0_24px_80px_-48px_rgba(36,18,10,0.55)]"
      style={{ background: styles.background, color: styles.textColor }}
    >
      <div className="flex items-center justify-between gap-3">
        <div
          className="rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]"
          style={{
            background: styles.badgeBackground,
            color: styles.badgeTextColor,
          }}
        >
          Featured drop
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border text-sm"
            style={{
              background: styles.navBackground,
              color: styles.navTextColor,
              borderColor: styles.innerFrameBorderColor,
            }}
          >
            {"<"}
          </button>
          <button
            type="button"
            className="flex size-9 items-center justify-center rounded-full border text-sm"
            style={{
              background: styles.navBackground,
              color: styles.navTextColor,
              borderColor: styles.innerFrameBorderColor,
            }}
          >
            {">"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_240px] lg:items-center">
        <div className="space-y-4">
          <div className="space-y-3">
            <h3 className="text-3xl font-semibold leading-tight">
              Refined hero surface for product storytelling
            </h3>
            <p className="max-w-md text-sm leading-7" style={{ color: styles.mutedTextColor }}>
              Preview this isolated slide theme before publishing it into the public storefront
              rotation.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              className="rounded-full px-5"
              style={{
                background: styles.primaryButtonBackground,
                color: styles.primaryButtonTextColor,
              }}
            >
              {styles.primaryButtonLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-full px-5"
              style={{
                background: styles.secondaryButtonBackground,
                color: styles.secondaryButtonTextColor,
                borderColor: styles.innerFrameBorderColor,
              }}
            >
              {styles.secondaryButtonLabel}
            </Button>
          </div>
        </div>
        <div
          className="rounded-[1.8rem] border p-3"
          style={{
            background: styles.frameBackground,
            borderColor: styles.outerFrameBorderColor,
          }}
        >
          <div
            className="rounded-[1.45rem] border p-3"
            style={{
              background: styles.imagePanelBackground,
              borderColor: styles.innerFrameBorderColor,
            }}
          >
            <div className="aspect-[4/5] rounded-[1.15rem] bg-[linear-gradient(160deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function HomeSliderSection() {
  const [draft, setDraft] = useState<StorefrontHomeSlider | null>(null)
  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(null)
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
        const settings = await storefrontApi.getHomeSlider(accessToken)
        if (!cancelled) {
          setDraft(settings)
          setSelectedSlideId(settings.slides[0]?.id ?? null)
          setError(null)
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Failed to load home slider settings."
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

  const selectedSlide =
    draft?.slides.find((slide) => slide.id === selectedSlideId) ?? draft?.slides[0] ?? null

  const selectedTheme = selectedSlide?.theme ?? null

  function updateSelectedSlide(
    transform: (slide: StorefrontHomeSliderSlide) => StorefrontHomeSliderSlide
  ) {
    if (!selectedSlideId) {
      return
    }

    setDraft((current) => {
      if (!current) {
        return current
      }

      return {
        ...current,
        slides: current.slides.map((slide) =>
          slide.id === selectedSlideId ? transform(slide) : slide
        ),
      }
    })
  }

  const tabs = useMemo(() => {
    if (!selectedSlide || !selectedTheme) {
      return [] as AnimatedContentTab[]
    }

    const overviewTab: AnimatedContentTab = {
      label: "Overview",
      value: "overview",
      content: (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_360px]">
          <SliderTableCard>
            <SliderFieldRow
              label="Slider Label"
              description="Internal admin label for the slide list. Public storefront UX stays unchanged."
              field={
                <Input
                  value={selectedSlide.label}
                  onChange={(event) =>
                    updateSelectedSlide((slide) => ({
                      ...slide,
                      label: event.target.value.trimStart() || slide.label,
                    }))
                  }
                />
              }
            />
            <SliderFieldRow
              label="Theme Preset"
              description="Pick a baseline for this slide only, then fine-tune the colors below."
              field={
                <Select
                  value={selectedTheme.themeKey}
                  onValueChange={(value) =>
                    updateSelectedSlide((slide) => ({
                      ...slide,
                      theme: applyHomeSliderThemePreset(slide.theme, value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select slider theme" />
                  </SelectTrigger>
                  <SelectContent>
                    {homeSliderThemeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
            />
            <SliderFieldRow
              label="Primary Button Text"
              description="Public label shown on the hero buy-now action for this slide."
              field={
                <Input
                  value={selectedTheme.primaryButtonLabel ?? ""}
                  onChange={(event) =>
                    updateSelectedSlide((slide) => ({
                      ...slide,
                      theme: {
                        ...slide.theme,
                        primaryButtonLabel: event.target.value.trim() || null,
                      },
                    }))
                  }
                />
              }
            />
            <SliderFieldRow
              label="Secondary Button Text"
              description="Public label shown on the hero detail action for this slide."
              field={
                <Input
                  value={selectedTheme.secondaryButtonLabel ?? ""}
                  onChange={(event) =>
                    updateSelectedSlide((slide) => ({
                      ...slide,
                      theme: {
                        ...slide.theme,
                        secondaryButtonLabel: event.target.value.trim() || null,
                      },
                    }))
                  }
                />
              }
            />
          </SliderTableCard>
          <HomeSliderPreview slide={selectedSlide} />
        </div>
      ),
    }

    const gradientTab: AnimatedContentTab = {
      label: "Gradient",
      value: "gradient",
      content: (
        <SliderTableCard>
          <SliderFieldRow
            label="Background Start"
            description="Dark anchor tone for this slide background."
            field={
              <ThemeColorInput
                label="Background start"
                value={selectedTheme.backgroundFrom}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: {
                      ...slide.theme,
                      backgroundFrom: value ?? slide.theme.backgroundFrom,
                    },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Background Middle"
            description="Bridge tone between the start and end colors."
            field={
              <ThemeColorInput
                label="Background middle"
                value={selectedTheme.backgroundVia}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: {
                      ...slide.theme,
                      backgroundVia: value ?? slide.theme.backgroundVia,
                    },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Background End"
            description="Light ending tone behind the image lane and CTA area."
            field={
              <ThemeColorInput
                label="Background end"
                value={selectedTheme.backgroundTo}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: {
                      ...slide.theme,
                      backgroundTo: value ?? slide.theme.backgroundTo,
                    },
                  }))
                }
              />
            }
          />
        </SliderTableCard>
      ),
    }

    const typographyTab: AnimatedContentTab = {
      label: "Typography",
      value: "typography",
      content: (
        <SliderTableCard>
          <SliderFieldRow
            label="Text Color"
            description="Main title, price, and primary content color. Leave on Auto if adaptive contrast is enough."
            field={
              <ThemeColorInput
                allowAuto
                label="Text color"
                value={selectedTheme.textColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, textColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Muted Text"
            description="Description, helper copy, and secondary text tone."
            field={
              <ThemeColorInput
                allowAuto
                label="Muted text"
                value={selectedTheme.mutedTextColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, mutedTextColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Badge Background"
            description="Pill background for the hero badge."
            field={
              <ThemeColorInput
                allowAuto
                label="Badge background"
                value={selectedTheme.badgeBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, badgeBackground: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Badge Text"
            description="Badge label color."
            field={
              <ThemeColorInput
                allowAuto
                label="Badge text"
                value={selectedTheme.badgeTextColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, badgeTextColor: value },
                  }))
                }
              />
            }
          />
        </SliderTableCard>
      ),
    }

    const actionsTab: AnimatedContentTab = {
      label: "Actions",
      value: "actions",
      content: (
        <SliderTableCard>
          <SliderFieldRow
            label="Primary Button Bg"
            description="Main CTA fill color."
            field={
              <ThemeColorInput
                allowAuto
                label="Primary button background"
                value={selectedTheme.primaryButtonBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, primaryButtonBackground: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Primary Button Text"
            description="Main CTA label color."
            field={
              <ThemeColorInput
                allowAuto
                label="Primary button text"
                value={selectedTheme.primaryButtonTextColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, primaryButtonTextColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Secondary Button Bg"
            description="Secondary CTA surface or translucent fill."
            field={
              <ThemeColorInput
                allowAuto
                label="Secondary button background"
                value={selectedTheme.secondaryButtonBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, secondaryButtonBackground: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Secondary Button Text"
            description="Secondary CTA label color."
            field={
              <ThemeColorInput
                allowAuto
                label="Secondary button text"
                value={selectedTheme.secondaryButtonTextColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, secondaryButtonTextColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Nav Background"
            description="Arrow-button surface for slider navigation."
            field={
              <ThemeColorInput
                allowAuto
                label="Navigation background"
                value={selectedTheme.navBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, navBackground: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Nav Text"
            description="Arrow icon color for the navigation controls."
            field={
              <ThemeColorInput
                allowAuto
                label="Navigation text"
                value={selectedTheme.navTextColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, navTextColor: value },
                  }))
                }
              />
            }
          />
        </SliderTableCard>
      ),
    }

    const frameTab: AnimatedContentTab = {
      label: "Frame",
      value: "frame",
      content: (
        <SliderTableCard>
          <SliderFieldRow
            label="Frame Background"
            description="Outer image-frame surface behind the product image card."
            field={
              <ThemeColorInput
                allowAuto
                label="Frame background"
                value={selectedTheme.frameBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, frameBackground: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Outer Border"
            description="Primary border tone around the product image frame."
            field={
              <ThemeColorInput
                allowAuto
                label="Outer frame border"
                value={selectedTheme.outerFrameBorderColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, outerFrameBorderColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Inner Border"
            description="Secondary border tone for the image panel."
            field={
              <ThemeColorInput
                allowAuto
                label="Inner frame border"
                value={selectedTheme.innerFrameBorderColor}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, innerFrameBorderColor: value },
                  }))
                }
              />
            }
          />
          <SliderFieldRow
            label="Image Panel Bg"
            description="Solid panel behind the actual product image."
            field={
              <ThemeColorInput
                allowAuto
                label="Image panel background"
                value={selectedTheme.imagePanelBackground}
                onChange={(value) =>
                  updateSelectedSlide((slide) => ({
                    ...slide,
                    theme: { ...slide.theme, imagePanelBackground: value },
                  }))
                }
              />
            }
          />
        </SliderTableCard>
      ),
    }

    return [overviewTab, gradientTab, typographyTab, actionsTab, frameTab]
  }, [selectedSlide, selectedTheme])

  if (isLoading) {
    return (
      <Card className="rounded-[1.5rem] border-border/70 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-muted-foreground">
          Loading home slider designer...
        </CardContent>
      </Card>
    )
  }

  if (error || !draft || !selectedSlide) {
    return (
      <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm">
        <CardContent className="p-5 text-sm text-destructive">
          {error ?? "Home slider settings are unavailable."}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-medium">
          {draft.slides.length} sliders
        </Badge>
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
              const parsedDraft = storefrontHomeSliderSchema.parse(draft)
              const saved = await storefrontApi.updateHomeSlider(accessToken, parsedDraft)
              setDraft(saved)
              setSelectedSlideId(
                saved.slides.find((slide) => slide.id === selectedSlideId)?.id ??
                  saved.slides[0]?.id ??
                  null
              )
              setSaveMessage("Home slider saved.")
              showRecordToast({
                entity: "Home Slider",
                action: "saved",
                recordName: selectedSlide.label,
                recordId: selectedSlide.id,
              })
            } catch (saveError) {
              const message =
                saveError instanceof Error
                  ? saveError.message
                  : "Failed to save home slider settings."
              setError(message)
              showAppToast({
                variant: "error",
                title: "Home slider save failed.",
                description: message,
              })
            } finally {
              setIsSaving(false)
            }
          }}
        >
          {isSaving ? "Saving..." : "Save home slider"}
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <a href={storefrontPaths.home()} target="_blank" rel="noreferrer">
            Open storefront
          </a>
        </Button>
        {saveMessage ? <p className="text-sm text-muted-foreground">{saveMessage}</p> : null}
      </div>

      {error ? (
        <Card className="rounded-[1.5rem] border-destructive/20 bg-destructive/5 py-0 shadow-sm">
          <CardContent className="p-5 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <Card className="overflow-hidden border-border/70 py-0 shadow-sm">
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center justify-between gap-3 pb-1">
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-[11px]">
                Slider list
              </Badge>
              <span className="text-xs text-muted-foreground">{draft.slides.length}</span>
            </div>
            <div className="space-y-2">
              {draft.slides.map((slide, index) => {
                const isActive = slide.id === selectedSlide.id
                const themeOption = homeSliderThemeOptions.find(
                  (option) => option.value === slide.theme.themeKey
                )

                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setSelectedSlideId(slide.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition ${
                      isActive
                        ? "border-foreground/20 bg-accent text-accent-foreground"
                        : "border-border/60 bg-background hover:border-border hover:bg-accent/40"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </p>
                      <p className="truncate text-sm font-medium">{slide.label}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {themeOption?.label ?? slide.theme.themeKey}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <span
                        className="size-2.5 rounded-full border border-black/10"
                        style={{ background: slide.theme.backgroundFrom }}
                      />
                      <span
                        className="size-2.5 rounded-full border border-black/10"
                        style={{ background: slide.theme.backgroundVia }}
                      />
                      <span
                        className="size-2.5 rounded-full border border-black/10"
                        style={{ background: slide.theme.backgroundTo }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  const nextSlide = createSlide(draft.slides.length)
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          slides: [...current.slides, nextSlide],
                        }
                      : current
                  )
                  setSelectedSlideId(nextSlide.id)
                }}
              >
                <Plus className="size-4" />
                Add slider
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={draft.slides.length <= 1}
                onClick={() => {
                  if (draft.slides.length <= 1) {
                    return
                  }

                  const nextSlides = draft.slides.filter((slide) => slide.id !== selectedSlide.id)
                  setDraft({
                    ...draft,
                    slides: nextSlides,
                  })
                  setSelectedSlideId(nextSlides[0]?.id ?? null)
                }}
              >
                <Trash2 className="size-4" />
                Remove selected
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatedTabs defaultTabValue="overview" tabs={tabs} />
      </div>
    </div>
  )
}
