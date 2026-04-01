import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeftIcon, SaveIcon } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MediaImageField } from '@/components/forms/media-image-field'
import {
  createCommonModuleItem,
  getCommonModuleItem,
  HttpError,
  updateCommonModuleItem,
} from '@/shared/api/client'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import {
  toProductCategoryFormValues,
  toProductCategoryPayload,
  toProductCategoryRecord,
  type ProductCategoryFormValues,
} from '../lib/product-category'

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save product category.'
}

function validate(values: ProductCategoryFormValues) {
  const errors: Partial<Record<keyof ProductCategoryFormValues, string>> = {}

  if (!values.code.trim()) errors.code = 'Code is required.'
  if (!values.name.trim()) errors.name = 'Name is required.'

  const parsedPositionOrder = Number(values.positionOrder)
  if (!Number.isInteger(parsedPositionOrder) || parsedPositionOrder < 0) {
    errors.positionOrder = 'Position order must be a non-negative whole number.'
  }

  return errors
}

export function ProductCategoryFormPage() {
  const navigate = useNavigate()
  const { categoryId } = useParams()
  const isEditMode = Boolean(categoryId)
  const [values, setValues] = useState<ProductCategoryFormValues>(() => toProductCategoryFormValues())
  const [loading, setLoading] = useState(isEditMode)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [errors, setErrors] = useState<Partial<Record<keyof ProductCategoryFormValues, string>>>({})

  useEffect(() => {
    if (!categoryId) {
      return
    }
    const resolvedCategoryId = categoryId

    let cancelled = false

    async function load() {
      setLoading(true)
      setErrorMessage(null)

      try {
        const item = await getCommonModuleItem('productCategories', resolvedCategoryId)
        if (!cancelled) {
          setValues(toProductCategoryFormValues(toProductCategoryRecord(item)))
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

    void load()
    return () => {
      cancelled = true
    }
  }, [categoryId])

  async function handleSubmit() {
    const validationErrors = validate(values)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length > 0) {
      showValidationToast('product category')
      return
    }

    setSubmitting(true)
    setErrorMessage(null)

    try {
      const payload = toProductCategoryPayload(values)
      const saved = categoryId
        ? await updateCommonModuleItem('productCategories', categoryId, payload)
        : await createCommonModuleItem('productCategories', payload)

      const savedRecord = toProductCategoryRecord(saved)
      showSavedToast({
        entityLabel: 'product category',
        recordName: savedRecord.name,
        referenceId: savedRecord.id,
        mode: categoryId ? 'update' : 'create',
      })
      void navigate(`/admin/dashboard/product-categories/${savedRecord.id}`)
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product category',
        action: categoryId ? 'update' : 'create',
        detail: message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">Loading product category...</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Button variant="ghost" asChild className="-ml-3 w-fit px-3">
            <Link to={categoryId ? `/admin/dashboard/product-categories/${categoryId}` : '/admin/dashboard/product-categories'}>
              <ArrowLeftIcon className="size-4" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">{isEditMode ? 'Edit Product Category' : 'Create Product Category'}</h1>
          <p className="text-sm text-muted-foreground">
            Configure the category label, storefront placement, and ordering used in the navigation rail and category section.
          </p>
        </div>
        <Button onClick={() => void handleSubmit()} disabled={submitting}>
          <SaveIcon className="size-4" />
          {submitting ? 'Saving...' : 'Save Product Category'}
        </Button>
      </div>

      {errorMessage ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">{errorMessage}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="p-5 sm:p-6">
          <Tabs defaultValue="overview" className="gap-5">
            <TabsList variant="line">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="storefront">Storefront</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="product-category-code">Code</Label>
                    <Input id="product-category-code" value={values.code} onChange={(event) => {
                      setValues((current) => ({ ...current, code: event.target.value }))
                      setErrors((current) => ({ ...current, code: undefined }))
                    }} />
                    {errors.code ? <p className="text-sm text-destructive">{errors.code}</p> : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-category-name">Name</Label>
                    <Input id="product-category-name" value={values.name} onChange={(event) => {
                      setValues((current) => ({ ...current, name: event.target.value }))
                      setErrors((current) => ({ ...current, name: undefined }))
                    }} />
                    {errors.name ? <p className="text-sm text-destructive">{errors.name}</p> : null}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-category-description">Description</Label>
                    <Textarea id="product-category-description" rows={5} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
                  </div>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Category Image</Label>
                    <MediaImageField
                      label=""
                      value={values.image}
                      onChange={(value) => setValues((current) => ({ ...current, image: value }))}
                      dialogTitle="Select Category Image"
                      dialogDescription="Attach the image used for the product category card and storefront menu."
                    />
                  </div>
                  <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                    <Checkbox checked={values.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: Boolean(checked) }))} />
                    <span>Active category</span>
                  </label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="storefront">
              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Placement</CardTitle>
                    <CardDescription>Control where this category appears in the storefront.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="product-category-position-order">Position Order</Label>
                      <Input id="product-category-position-order" type="number" min={0} value={values.positionOrder} onChange={(event) => {
                        setValues((current) => ({ ...current, positionOrder: event.target.value }))
                        setErrors((current) => ({ ...current, positionOrder: undefined }))
                      }} />
                      {errors.positionOrder ? <p className="text-sm text-destructive">{errors.positionOrder}</p> : null}
                    </div>
                    <label className="flex items-start gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm">
                      <Checkbox checked={values.showInTopMenu} onCheckedChange={(checked) => setValues((current) => ({ ...current, showInTopMenu: Boolean(checked) }))} />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Show in storefront top menu</p>
                        <p className="text-muted-foreground">Displays the category in the horizontal category rail and bottom-nav shortcuts.</p>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 rounded-xl border border-border/70 px-4 py-3 text-sm">
                      <Checkbox checked={values.showInCatalogSection} onCheckedChange={(checked) => setValues((current) => ({ ...current, showInCatalogSection: Boolean(checked) }))} />
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">Show in storefront catalog section</p>
                        <p className="text-muted-foreground">Displays the category card in the storefront home-page category section.</p>
                      </div>
                    </label>
                  </CardContent>
                </Card>

                <Card className="shadow-none">
                  <CardHeader>
                    <CardTitle>Preview Notes</CardTitle>
                    <CardDescription>These settings affect category placement without changing product assignments.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm text-muted-foreground">
                    <p>Lower position order values appear first in the storefront category rail and the catalog section.</p>
                    <p>The storefront still keeps category filters for assigned products even when a category is hidden from the home section.</p>
                    <p>Use the dedicated show page to review linked products after saving.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
