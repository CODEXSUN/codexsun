import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  createCommonModuleItem,
  getCommonModuleItem,
  HttpError,
  updateCommonModuleItem,
} from '@/shared/api/client'
import {
  createFieldErrors,
  inputErrorClassName,
  isBlank,
  setFieldError,
  summarizeFieldErrors,
  warningCardClassName,
  type FieldErrors,
} from '@/shared/forms/validation'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import {
  createDefaultSliderThemeValues,
  toSliderThemeFormValues,
  toSliderThemePayload,
  type SliderThemeFormValues,
} from '@/features/store/lib/slider-theme'
import {
  SliderThemeFieldRow,
  SliderThemePreview,
  SliderThemeTableCard,
} from '../components/slider-theme-ui'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save slider theme.'
}

function validateTheme(values: SliderThemeFormValues) {
  const errors = createFieldErrors()

  if (isBlank(values.code)) setFieldError(errors, 'code', 'Theme code is required.')
  if (isBlank(values.name)) setFieldError(errors, 'name', 'Theme name is required.')
  if (isBlank(values.backgroundFrom)) setFieldError(errors, 'backgroundFrom', 'Starting color is required.')
  if (isBlank(values.backgroundVia)) setFieldError(errors, 'backgroundVia', 'Middle color is required.')
  if (isBlank(values.backgroundTo)) setFieldError(errors, 'backgroundTo', 'Ending color is required.')

  return errors
}

function ColorInput({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-14 rounded-md border border-input bg-background p-1"
      />
      <Input value={value} onChange={(event) => onChange(event.target.value)} className="font-mono" />
    </div>
  )
}

export function SliderThemeFormPage() {
  const navigate = useNavigate()
  const { themeId } = useParams()
  const isEditMode = Boolean(themeId)
  const [values, setValues] = useState<SliderThemeFormValues>(createDefaultSliderThemeValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())

  useEffect(() => {
    let cancelled = false

    async function loadTheme() {
      if (!themeId) return

      setLoading(true)
      setErrorMessage(null)

      try {
        const item = await getCommonModuleItem('sliderThemes', themeId)
        if (!cancelled) {
          setValues(toSliderThemeFormValues(item))
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

    void loadTheme()
    return () => {
      cancelled = true
    }
  }, [themeId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextFieldErrors = validateTheme(values)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('slider theme')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const savedTheme = themeId
        ? await updateCommonModuleItem('sliderThemes', themeId, toSliderThemePayload(values))
        : await createCommonModuleItem('sliderThemes', toSliderThemePayload(values))

      showSavedToast({
        entityLabel: 'slider theme',
        recordName: String(savedTheme.name ?? values.name),
        referenceId: savedTheme.id,
        mode: themeId ? 'update' : 'create',
      })

      void navigate(`/admin/dashboard/slider-themes/${savedTheme.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'slider theme',
        action: themeId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  const overviewTab: AnimatedContentTab = {
    label: 'Overview',
    value: 'overview',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_320px]">
        <SliderThemeTableCard>
          <SliderThemeFieldRow
            label="Theme Code"
            description="Stable internal key used in theme records and storefront fallback mapping."
            error={fieldErrors.code}
            field={
              <Input
                className={inputErrorClassName(Boolean(fieldErrors.code))}
                value={values.code}
                onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
              />
            }
          />
          <SliderThemeFieldRow
            label="Theme Name"
            description="Admin-facing label shown in the slider-theme workspace."
            error={fieldErrors.name}
            field={
              <Input
                className={inputErrorClassName(Boolean(fieldErrors.name))}
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              />
            }
          />
          <SliderThemeFieldRow
            label="Sort Order"
            description="Lower values appear first in the designer list and theme rotation."
            field={
              <Input
                type="number"
                value={values.sortOrder}
                onChange={(event) =>
                  setValues((current) => ({ ...current, sortOrder: Number(event.target.value || 0) }))
                }
              />
            }
          />
          <SliderThemeFieldRow
            label="Status"
            description="Inactive themes remain in admin but are ignored by the storefront fetch."
            field={
              <label className="flex items-center gap-3 pt-2">
                <Checkbox
                  checked={values.isActive}
                  onCheckedChange={(checked) =>
                    setValues((current) => ({ ...current, isActive: Boolean(checked) }))
                  }
                />
                <span className="text-sm font-medium text-foreground">Active theme</span>
              </label>
            }
          />
        </SliderThemeTableCard>
        <SliderThemePreview theme={values} />
      </div>
    ),
  }

  const gradientTab: AnimatedContentTab = {
    label: 'Gradient',
    value: 'gradient',
    content: (
      <SliderThemeTableCard>
        <SliderThemeFieldRow
          label="Background Start"
          description="Dark anchor tone for the hero background."
          error={fieldErrors.backgroundFrom}
          field={<ColorInput value={values.backgroundFrom} onChange={(value) => setValues((current) => ({ ...current, backgroundFrom: value }))} />}
        />
        <SliderThemeFieldRow
          label="Background Middle"
          description="Bridge tone between the start and end colors."
          error={fieldErrors.backgroundVia}
          field={<ColorInput value={values.backgroundVia} onChange={(value) => setValues((current) => ({ ...current, backgroundVia: value }))} />}
        />
        <SliderThemeFieldRow
          label="Background End"
          description="Light ending tone to match the product image and CTA contrast."
          error={fieldErrors.backgroundTo}
          field={<ColorInput value={values.backgroundTo} onChange={(value) => setValues((current) => ({ ...current, backgroundTo: value }))} />}
        />
      </SliderThemeTableCard>
    ),
  }

  const textTab: AnimatedContentTab = {
    label: 'Typography',
    value: 'typography',
    content: (
      <SliderThemeTableCard>
        <SliderThemeFieldRow
          label="Text Color"
          description="Main heading and value color. Keep blank only if you want auto-contrast fallback."
          field={<ColorInput value={values.textColor} onChange={(value) => setValues((current) => ({ ...current, textColor: value }))} />}
        />
        <SliderThemeFieldRow
          label="Muted Text"
          description="Helper copy, separators, and supporting text tone."
          field={<ColorInput value={values.mutedTextColor} onChange={(value) => setValues((current) => ({ ...current, mutedTextColor: value }))} />}
        />
        <SliderThemeFieldRow
          label="Badge Background"
          description="Pill background for the product/category badge."
          field={<ColorInput value={values.badgeBackground} onChange={(value) => setValues((current) => ({ ...current, badgeBackground: value }))} />}
        />
        <SliderThemeFieldRow
          label="Badge Text"
          description="Text color for the badge pill."
          field={<ColorInput value={values.badgeTextColor} onChange={(value) => setValues((current) => ({ ...current, badgeTextColor: value }))} />}
        />
      </SliderThemeTableCard>
    ),
  }

  const actionsTab: AnimatedContentTab = {
    label: 'Actions',
    value: 'actions',
    content: (
      <SliderThemeTableCard>
        <SliderThemeFieldRow
          label="Add To Cart Text"
          description="Primary button label in the hero slider."
          field={
            <Input
              value={values.addToCartLabel}
              onChange={(event) => setValues((current) => ({ ...current, addToCartLabel: event.target.value }))}
            />
          }
        />
        <SliderThemeFieldRow
          label="View Details Text"
          description="Secondary button label in the hero slider."
          field={
            <Input
              value={values.viewDetailsLabel}
              onChange={(event) => setValues((current) => ({ ...current, viewDetailsLabel: event.target.value }))}
            />
          }
        />
        <SliderThemeFieldRow
          label="Primary Button Bg"
          description="Main CTA fill color."
          field={<ColorInput value={values.primaryButtonBackground} onChange={(value) => setValues((current) => ({ ...current, primaryButtonBackground: value }))} />}
        />
        <SliderThemeFieldRow
          label="Primary Button Text"
          description="Main CTA label color."
          field={<ColorInput value={values.primaryButtonTextColor} onChange={(value) => setValues((current) => ({ ...current, primaryButtonTextColor: value }))} />}
        />
        <SliderThemeFieldRow
          label="Secondary Button Bg"
          description="Outline/secondary CTA surface color."
          field={<ColorInput value={values.secondaryButtonBackground} onChange={(value) => setValues((current) => ({ ...current, secondaryButtonBackground: value }))} />}
        />
        <SliderThemeFieldRow
          label="Secondary Button Text"
          description="Secondary CTA label color."
          field={<ColorInput value={values.secondaryButtonTextColor} onChange={(value) => setValues((current) => ({ ...current, secondaryButtonTextColor: value }))} />}
        />
        <SliderThemeFieldRow
          label="Nav Background"
          description="Arrow-button surface for slider navigation."
          field={<ColorInput value={values.navBackground} onChange={(value) => setValues((current) => ({ ...current, navBackground: value }))} />}
        />
        <SliderThemeFieldRow
          label="Nav Text"
          description="Arrow icon color for the navigation controls."
          field={<ColorInput value={values.navTextColor} onChange={(value) => setValues((current) => ({ ...current, navTextColor: value }))} />}
        />
      </SliderThemeTableCard>
    ),
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading slider theme...</CardContent>
      </Card>
    )
  }

  return (
    <form className="space-y-6 pt-2" onSubmit={(event) => void handleSubmit(event)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/slider-themes">
              <ArrowLeft className="size-4" />
              Back to slider themes
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Maintain hero-slider gradients, CTA contrast, button tone, text color, and navigation styling in a dedicated tabbed editor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => void navigate('/admin/dashboard/slider-themes')}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Theme'}
          </Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-4 text-sm">
            <p className="font-medium">{errorMessage}</p>
            {Object.keys(fieldErrors).length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {summarizeFieldErrors(fieldErrors).map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <AnimatedTabs
        defaultTabValue="overview"
        tabs={[overviewTab, gradientTab, textTab, actionsTab]}
      />
    </form>
  )
}
