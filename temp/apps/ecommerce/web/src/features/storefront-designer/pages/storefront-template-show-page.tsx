import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EditIcon, Trash2 } from 'lucide-react'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ActiveStatusBadge } from '@/components/ui/status-badge'
import { EntityDetailHeader, formatDetailValue } from '@/components/entity/entity-detail'
import {
  deactivateCommonModuleItem,
  getCommonModuleItem,
  HttpError,
  restoreCommonModuleItem,
} from '@/shared/api/client'
import { showFailedActionToast, showStatusChangeToast } from '@/shared/notifications/toast'
import { StorefrontTemplateDisplayRow, StorefrontTemplatePreview, StorefrontTemplateTableCard } from '../components/storefront-template-ui'
import {
  formatStorefrontTemplateIcon,
  formatStorefrontTemplateTheme,
  getStorefrontTemplateSlotMeta,
  toStorefrontTemplateRecord,
  type StorefrontTemplateRecord,
} from '../lib/storefront-template'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load storefront template.'
}

export function StorefrontTemplateShowPage() {
  const navigate = useNavigate()
  const { templateId } = useParams()
  const [item, setItem] = useState<StorefrontTemplateRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTemplate() {
      if (!templateId) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const record = await getCommonModuleItem('storefrontTemplates', templateId)
        if (!cancelled) {
          setItem(toStorefrontTemplateRecord(record))
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

  async function handleDelete() {
    if (!item) return
    if (!window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('storefrontTemplates', item.id)
      showStatusChangeToast({
        entityLabel: 'storefront template',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/storefront-designer')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'storefront template',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDeactivate() {
    if (!item) return
    if (!window.confirm(`Deactivate ${item.name}?`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('storefrontTemplates', item.id)
      setItem((current) => (current ? { ...current, isActive: false } : current))
      showStatusChangeToast({
        entityLabel: 'storefront template',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'storefront template',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleRestore() {
    if (!item) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await restoreCommonModuleItem('storefrontTemplates', item.id)
      setItem((current) => (current ? { ...current, isActive: true } : current))
      showStatusChangeToast({
        entityLabel: 'storefront template',
        recordName: item.name,
        referenceId: item.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'storefront template',
        action: 'restore',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading storefront template...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Storefront template not found.'}</CardContent>
      </Card>
    )
  }

  const slotMeta = getStorefrontTemplateSlotMeta(item.code)

  const overviewTab: AnimatedContentTab = {
    label: 'Overview',
    value: 'overview',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_320px]">
        <StorefrontTemplateTableCard>
          <StorefrontTemplateDisplayRow label="Code" value={<span className="font-mono text-xs">{item.code}</span>} />
          <StorefrontTemplateDisplayRow label="Name" value={item.name} />
          <StorefrontTemplateDisplayRow label="Section" value={slotMeta.label} />
          <StorefrontTemplateDisplayRow label="Section Type" value={slotMeta.kind} />
          <StorefrontTemplateDisplayRow label="Sort Order" value={String(item.sort_order)} />
          <StorefrontTemplateDisplayRow label="Status" value={<ActiveStatusBadge isActive={item.isActive} />} />
          <StorefrontTemplateDisplayRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
          <StorefrontTemplateDisplayRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
        </StorefrontTemplateTableCard>
        <StorefrontTemplatePreview template={item} />
      </div>
    ),
  }

  const copyTab: AnimatedContentTab = {
    label: 'Copy',
    value: 'copy',
    content: (
      <StorefrontTemplateTableCard>
        <StorefrontTemplateDisplayRow label="Badge" value={formatDetailValue(item.badge_text)} />
        <StorefrontTemplateDisplayRow label="Title" value={formatDetailValue(item.title)} />
        <StorefrontTemplateDisplayRow label="Description" value={formatDetailValue(item.description)} />
      </StorefrontTemplateTableCard>
    ),
  }

  const actionsTab: AnimatedContentTab = {
    label: 'Actions',
    value: 'actions',
    content: (
      <StorefrontTemplateTableCard>
        <StorefrontTemplateDisplayRow label="Primary Label" value={formatDetailValue(item.cta_primary_label)} />
        <StorefrontTemplateDisplayRow label="Primary Link" value={formatDetailValue(item.cta_primary_href)} />
        <StorefrontTemplateDisplayRow label="Secondary Label" value={formatDetailValue(item.cta_secondary_label)} />
        <StorefrontTemplateDisplayRow label="Secondary Link" value={formatDetailValue(item.cta_secondary_href)} />
      </StorefrontTemplateTableCard>
    ),
  }

  const presentationTab: AnimatedContentTab = {
    label: 'Presentation',
    value: 'presentation',
    className: 'hidden md:flex',
    contentClassName: 'hidden md:block',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <StorefrontTemplateTableCard>
          <StorefrontTemplateDisplayRow label="Theme" value={formatStorefrontTemplateTheme(item.theme_key)} />
          <StorefrontTemplateDisplayRow label="Icon" value={formatStorefrontTemplateIcon(item.icon_key)} />
          <StorefrontTemplateDisplayRow label="Frontend Slot" value={slotMeta.label} />
          <StorefrontTemplateDisplayRow label="Fallback Behavior" value="If this record is missing or blank, the storefront home page falls back to built-in default copy." />
          <StorefrontTemplateDisplayRow label="Usage Note" value={slotMeta.description} />
        </StorefrontTemplateTableCard>
        <StorefrontTemplatePreview template={item} />
      </div>
    ),
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/storefront-designer"
        backLabel="Back to storefront designer"
        title={item.name}
        description="Review storefront home-page copy, CTA labels, trust-note content, and presentation metadata."
        isActive={item.isActive}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/storefront-designer/${item.id}/edit`}>
                <EditIcon className="size-4" />
                Edit
              </Link>
            </Button>
            {item.isActive ? (
              <>
                <Button variant="outline" onClick={() => void handleDeactivate()} disabled={processing}>
                  Deactivate
                </Button>
                <Button variant="destructive" onClick={() => void handleDelete()} disabled={processing}>
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => void handleRestore()} disabled={processing}>
                Restore
              </Button>
            )}
          </>
        }
      />

      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <AnimatedTabs defaultTabValue="overview" tabs={[overviewTab, copyTab, actionsTab, presentationTab]} />
    </div>
  )
}

