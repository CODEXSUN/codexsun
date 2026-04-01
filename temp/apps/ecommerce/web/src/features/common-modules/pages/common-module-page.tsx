import type { CommonModuleMetadata } from '@shared/index'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { buildAdminPortalPath } from '@framework-core/web/auth/lib/portal-routing'
import { CommonList } from '@/components/forms/CommonList'
import { CommonUpsertDialog } from '@/components/forms/CommonUpsertDialog'
import { useCommonMasterState } from '@/components/forms/useCommonMasterState'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { getCommonModuleMetadata, HttpError } from '@/shared/api/client'
import { buildCommonModuleDefinition } from '../lib/common-module-definitions'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Failed to load the common module.'
}

export function CommonModulePage() {
  const { moduleKey } = useParams()
  const [metadata, setMetadata] = useState<CommonModuleMetadata | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const redirectTarget =
    moduleKey === 'productCategories'
      ? buildAdminPortalPath('/product-categories')
      : moduleKey === 'storefrontTemplates'
      ? buildAdminPortalPath('/storefront-designer')
      : moduleKey === 'sliderThemes'
        ? buildAdminPortalPath('/slider-themes')
        : null

  useEffect(() => {
    if (redirectTarget) {
      return
    }

    let cancelled = false

    async function loadMetadata() {
      if (!moduleKey) {
        setErrorMessage('Module key is missing.')
        setLoading(false)
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const nextMetadata = await getCommonModuleMetadata(moduleKey as never)
        if (!cancelled) {
          setMetadata(nextMetadata)
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

    void loadMetadata()

    return () => {
      cancelled = true
    }
  }, [moduleKey, redirectTarget])

  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace />
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading module configuration...</CardContent>
      </Card>
    )
  }

  if (!metadata || errorMessage) {
    return (
      <Card>
        <CardContent className="flex items-center justify-between gap-4 p-8">
          <div>
            <p className="font-medium text-foreground">Unable to open this module.</p>
            <p className="mt-1 text-sm text-muted-foreground">{errorMessage ?? 'Module metadata was not found.'}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return <CommonModuleWorkspace metadata={metadata} />
}

function CommonModuleWorkspace({ metadata }: { metadata: CommonModuleMetadata }) {
  const definition = buildCommonModuleDefinition(metadata)
  const state = useCommonMasterState(definition)

  return (
    <div className="space-y-4">
      <CommonList
        header={{
          pageTitle: definition.pageTitle,
          pageDescription: definition.pageDescription,
          addLabel: state.addLabel,
          onAddClick: state.openCreateDialog,
        }}
        search={state.search}
        filters={state.filters}
        table={state.table}
        footer={{ content: state.footerContent }}
        pagination={state.pagination}
      />

      <CommonUpsertDialog
        open={state.dialog.open}
        mode={state.dialog.mode}
        entityLabel={definition.entityLabel}
        fields={state.resolvedFields}
        initialValues={state.dialog.initialValues}
        onOpenChange={state.dialog.onOpenChange}
        onSubmit={state.dialog.onSubmit}
        errorMessage={state.dialogError}
      />
    </div>
  )
}
