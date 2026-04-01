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
import {
  toSliderThemeRecord,
  type SliderThemeRecord,
} from '@/features/store/lib/slider-theme'
import {
  SliderThemeDisplayRow,
  SliderThemePreview,
  SliderThemeTableCard,
} from '../components/slider-theme-ui'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to load slider theme.'
}

export function SliderThemeShowPage() {
  const navigate = useNavigate()
  const { themeId } = useParams()
  const [item, setItem] = useState<SliderThemeRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadTheme() {
      if (!themeId) return

      setLoading(true)
      setErrorMessage(null)

      try {
        const record = await getCommonModuleItem('sliderThemes', themeId)
        if (!cancelled) {
          setItem(toSliderThemeRecord(record))
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

  async function handleDeactivate() {
    if (!item) return
    if (!window.confirm(`Deactivate ${item.name}?`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('sliderThemes', item.id)
      setItem((current) => (current ? { ...current, isActive: false } : current))
      showStatusChangeToast({
        entityLabel: 'slider theme',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'slider theme',
        action: 'deactivate',
        detail: message,
      })
    } finally {
      setProcessing(false)
    }
  }

  async function handleDelete() {
    if (!item) return
    if (!window.confirm(`Delete ${item.name}? This uses the current soft-delete flow.`)) return

    setProcessing(true)
    setErrorMessage(null)

    try {
      await deactivateCommonModuleItem('sliderThemes', item.id)
      showStatusChangeToast({
        entityLabel: 'slider theme',
        recordName: item.name,
        referenceId: item.id,
        action: 'deactivate',
      })
      void navigate('/admin/dashboard/slider-themes')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'slider theme',
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
      await restoreCommonModuleItem('sliderThemes', item.id)
      setItem((current) => (current ? { ...current, isActive: true } : current))
      showStatusChangeToast({
        entityLabel: 'slider theme',
        recordName: item.name,
        referenceId: item.id,
        action: 'restore',
      })
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'slider theme',
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
        <CardContent className="p-8 text-sm text-muted-foreground">Loading slider theme...</CardContent>
      </Card>
    )
  }

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-destructive">{errorMessage ?? 'Slider theme not found.'}</CardContent>
      </Card>
    )
  }

  const overviewTab: AnimatedContentTab = {
    label: 'Overview',
    value: 'overview',
    content: (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.8fr)_320px]">
        <SliderThemeTableCard>
          <SliderThemeDisplayRow label="Code" value={<span className="font-mono text-xs">{item.code}</span>} />
          <SliderThemeDisplayRow label="Name" value={item.name} />
          <SliderThemeDisplayRow label="Sort Order" value={String(item.sortOrder)} />
          <SliderThemeDisplayRow label="Status" value={<ActiveStatusBadge isActive={item.isActive} />} />
          <SliderThemeDisplayRow label="Created" value={new Date(item.createdAt).toLocaleString()} />
          <SliderThemeDisplayRow label="Updated" value={new Date(item.updatedAt).toLocaleString()} />
        </SliderThemeTableCard>
        <SliderThemePreview theme={item} />
      </div>
    ),
  }

  const gradientTab: AnimatedContentTab = {
    label: 'Gradient',
    value: 'gradient',
    content: (
      <SliderThemeTableCard>
        <SliderThemeDisplayRow label="Start Color" value={item.backgroundFrom} />
        <SliderThemeDisplayRow label="Middle Color" value={item.backgroundVia} />
        <SliderThemeDisplayRow label="End Color" value={item.backgroundTo} />
        <SliderThemeDisplayRow label="Text Color" value={formatDetailValue(item.textColor)} />
        <SliderThemeDisplayRow label="Muted Text" value={formatDetailValue(item.mutedTextColor)} />
      </SliderThemeTableCard>
    ),
  }

  const actionsTab: AnimatedContentTab = {
    label: 'Actions',
    value: 'actions',
    content: (
      <SliderThemeTableCard>
        <SliderThemeDisplayRow label="Add To Cart" value={formatDetailValue(item.addToCartLabel)} />
        <SliderThemeDisplayRow label="View Details" value={formatDetailValue(item.viewDetailsLabel)} />
        <SliderThemeDisplayRow label="Primary Button Bg" value={formatDetailValue(item.primaryButtonBackground)} />
        <SliderThemeDisplayRow label="Primary Button Text" value={formatDetailValue(item.primaryButtonTextColor)} />
        <SliderThemeDisplayRow label="Secondary Button Bg" value={formatDetailValue(item.secondaryButtonBackground)} />
        <SliderThemeDisplayRow label="Secondary Button Text" value={formatDetailValue(item.secondaryButtonTextColor)} />
        <SliderThemeDisplayRow label="Nav Background" value={formatDetailValue(item.navBackground)} />
        <SliderThemeDisplayRow label="Nav Text" value={formatDetailValue(item.navTextColor)} />
      </SliderThemeTableCard>
    ),
  }

  return (
    <div className="space-y-6">
      <EntityDetailHeader
        backHref="/admin/dashboard/slider-themes"
        backLabel="Back to slider themes"
        title={item.name}
        description="Review hero-slider colors, CTA labels, adaptive contrast, and navigation styling."
        isActive={item.isActive}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to={`/admin/dashboard/slider-themes/${item.id}/edit`}>
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

      <AnimatedTabs defaultTabValue="overview" tabs={[overviewTab, gradientTab, actionsTab]} />
    </div>
  )
}
