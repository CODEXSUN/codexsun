import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { StorefrontTemplateFieldRow, StorefrontTemplatePreview, StorefrontTemplateTableCard } from '../components/storefront-template-ui'
import {
  createDefaultStorefrontTemplateValues,
  getStorefrontTemplateSlotMeta,
  storefrontIconOptions,
  storefrontTemplateSlots,
  storefrontThemeOptions,
  toStorefrontTemplateFormValues,
  toStorefrontTemplatePayload,
  type StorefrontTemplateFormValues,
} from '../lib/storefront-template'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save storefront template.'
}

function validateTemplate(values: StorefrontTemplateFormValues) {
  const errors = createFieldErrors()

  if (isBlank(values.code)) setFieldError(errors, 'code', 'Template code is required.')
  if (isBlank(values.name)) setFieldError(errors, 'name', 'Template name is required.')
  if (isBlank(values.title)) setFieldError(errors, 'title', 'Title is required.')

  return errors
}

function UsageCard({ code }: { code: string }) {
  const slotMeta = getStorefrontTemplateSlotMeta(code)

  return (
    <div className="rounded-md border border-border/70 bg-background/70 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">Frontend Slot</p>
      <h3 className="mt-2 text-lg font-semibold text-foreground">{slotMeta.label}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{slotMeta.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-md border border-border/60 px-2 py-1 text-xs text-muted-foreground">{slotMeta.kind}</span>
        <span className="rounded-md border border-border/60 px-2 py-1 font-mono text-xs text-muted-foreground">
          {code || 'select a slot'}
        </span>
      </div>
    </div>
  )
}

export function StorefrontTemplateFormPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const isEditMode = Boolean(templateId)
  const [values, setValues] = useState<StorefrontTemplateFormValues>(createDefaultStorefrontTemplateValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())

  useEffect(() => {
    let cancelled = false

    async function loadTemplate() {
      if (!templateId) return

      setLoading(true)
      setErrorMessage(null)

      try {
        const item = await getCommonModuleItem('storefrontTemplates', templateId)
        if (!cancelled) {
          setValues(toStorefrontTemplateFormValues(item))
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

    void loadTemplate()
    return () => {
      cancelled = true
    }
  }, [templateId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextFieldErrors = validateTemplate(values)
    setFieldErrors(nextFieldErrors)

    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('storefront template')
      return
    }

    setSaving(true)
    setErrorMessage(null)

    try {
      const savedTemplate = templateId
        ? await updateCommonModuleItem('storefrontTemplates', templateId, toStorefrontTemplatePayload(values))
        : await createCommonModuleItem('storefrontTemplates', toStorefrontTemplatePayload(values))

      showSavedToast({
        entityLabel: 'storefront template',
        recordName: String(savedTemplate.name ?? values.name),
        referenceId: savedTemplate.id,
        mode: templateId ? 'update' : 'create',
      })

      void navigate(`/admin/dashboard/storefront-designer/${savedTemplate.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'storefront template',
        action: templateId ? 'update' : 'save',
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
        <StorefrontTemplateTableCard className="rounded-md">
          <StorefrontTemplateFieldRow
            label="Template Slot"
            description="Choose the exact storefront position this record drives."
            error={fieldErrors.code}
            field={(
              <select
                value={values.code}
                onChange={(event) => setValues((current) => ({ ...current, code: event.target.value }))}
                className={`h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${inputErrorClassName(Boolean(fieldErrors.code))}`}
              >
                <option value="">Select a storefront slot</option>
                {storefrontTemplateSlots.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            )}
          />
          <StorefrontTemplateFieldRow
            label="Internal Name"
            description="Admin-facing label used in the designer workspace."
            error={fieldErrors.name}
            field={(
              <Input
                className={inputErrorClassName(Boolean(fieldErrors.name))}
                value={values.name}
                onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))}
              />
            )}
          />
          <StorefrontTemplateFieldRow
            label="Sort Order"
            description="Lower values render first within the same content group."
            field={(
              <Input
                type="number"
                value={values.sort_order}
                onChange={(event) =>
                  setValues((current) => ({ ...current, sort_order: Number(event.target.value || 0) }))
                }
              />
            )}
          />
          <StorefrontTemplateFieldRow
            label="Status"
            description="Inactive templates stay in admin but are ignored by the storefront fetch."
            field={(
              <label className="flex items-center gap-3 pt-2">
                <Checkbox
                  checked={values.isActive}
                  onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: Boolean(checked) }))}
                />
                <span className="text-sm font-medium text-foreground">Active template</span>
              </label>
            )}
          />
        </StorefrontTemplateTableCard>
        <UsageCard code={values.code} />
      </div>
    ),
  }

  const copyTab: AnimatedContentTab = {
    label: 'Copy',
    value: 'copy',
    content: (
      <StorefrontTemplateTableCard>
        <StorefrontTemplateFieldRow
          label="Badge"
          description="Optional small badge shown above the section title."
          field={(
            <Input
              value={values.badge_text}
              onChange={(event) => setValues((current) => ({ ...current, badge_text: event.target.value }))}
            />
          )}
        />
        <StorefrontTemplateFieldRow
          label="Title"
          description="Primary section headline shown on the storefront."
          error={fieldErrors.title}
          field={(
            <Input
              className={inputErrorClassName(Boolean(fieldErrors.title))}
              value={values.title}
              onChange={(event) => setValues((current) => ({ ...current, title: event.target.value }))}
            />
          )}
        />
        <StorefrontTemplateFieldRow
          label="Description"
          description="Supporting paragraph. Leave blank to let fallback copy appear."
          field={(
            <Textarea
              rows={5}
              value={values.description}
              onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))}
            />
          )}
        />
      </StorefrontTemplateTableCard>
    ),
  }

  const actionsTab: AnimatedContentTab = {
    label: 'Actions',
    value: 'actions',
    content: (
      <StorefrontTemplateTableCard>
        <StorefrontTemplateFieldRow
          label="Primary CTA Label"
          description="Button text for the main action."
          field={(
            <Input
              value={values.cta_primary_label}
              onChange={(event) => setValues((current) => ({ ...current, cta_primary_label: event.target.value }))}
            />
          )}
        />
        <StorefrontTemplateFieldRow
          label="Primary CTA Link"
          description="Relative storefront path such as /search or /cart."
          field={(
            <Input
              value={values.cta_primary_href}
              onChange={(event) => setValues((current) => ({ ...current, cta_primary_href: event.target.value }))}
            />
          )}
        />
        <StorefrontTemplateFieldRow
          label="Secondary CTA Label"
          description="Optional secondary button text."
          field={(
            <Input
              value={values.cta_secondary_label}
              onChange={(event) => setValues((current) => ({ ...current, cta_secondary_label: event.target.value }))}
            />
          )}
        />
        <StorefrontTemplateFieldRow
          label="Secondary CTA Link"
          description="Relative storefront path for the secondary button."
          field={(
            <Input
              value={values.cta_secondary_href}
              onChange={(event) => setValues((current) => ({ ...current, cta_secondary_href: event.target.value }))}
            />
          )}
        />
      </StorefrontTemplateTableCard>
    ),
  }

  const presentationTab: AnimatedContentTab = {
    label: 'Presentation',
    value: 'presentation',
    className: 'hidden md:flex',
    contentClassName: 'hidden md:block',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_320px]">
        <StorefrontTemplateTableCard>
          <StorefrontTemplateFieldRow
            label="Theme"
            description="Visual tone used by the storefront preview surface."
            field={(
              <select
                value={values.theme_key}
                onChange={(event) => setValues((current) => ({ ...current, theme_key: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {storefrontThemeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          <StorefrontTemplateFieldRow
            label="Icon"
            description="Optional icon used primarily by trust-note cards."
            field={(
              <select
                value={values.icon_key}
                onChange={(event) => setValues((current) => ({ ...current, icon_key: event.target.value }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {storefrontIconOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          />
          <StorefrontTemplateFieldRow
            label="Fallback"
            description="Frontend defaults are used if this record is missing or fields stay blank."
            field={<p className="text-sm text-muted-foreground">Fallback content remains active as a guardrail for the store home page.</p>}
          />
        </StorefrontTemplateTableCard>
        <StorefrontTemplatePreview template={values} />
      </div>
    ),
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading storefront template...</CardContent>
      </Card>
    )
  }

  return (
    <form className="space-y-6 pt-2" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/storefront-designer">
              <ArrowLeft className="size-4" />
              Back to storefront designer
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Maintain dynamic storefront home-page copy, CTA labels, trust-note content, and design metadata in a dedicated editor.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/storefront-designer') }}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
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

      <AnimatedTabs defaultTabValue="overview" tabs={[overviewTab, copyTab, actionsTab, presentationTab]} />
    </form>
  )
}

