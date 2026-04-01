import type {
  CommonModuleKey,
  CommonModuleItem,
  Media,
  Product,
  ProductAttributeInput,
  ProductAttributeValueInput,
  ProductDiscountInput,
  MediaImageUploadPayload,
  ProductOfferInput,
  ProductPriceInput,
  ProductReviewInput,
  ProductStockItemInput,
  ProductTagInput,
  ProductUpsertPayload,
  TaskSummary,
  TaskTemplateSummary,
  ProductVariantAttributeInput,
  ProductVariantImageInput,
  ProductVariantInput,
} from '@shared/index'
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PropsWithChildren } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Boxes, Expand, ImagePlus, Plus, Star, Trash2, Upload } from 'lucide-react'
import { MediaImageField } from '@/components/forms/media-image-field'
import { AnimatedTabs, type AnimatedContentTab } from '@/components/ui/animated-tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AutocompleteLookup } from '@/components/lookups/AutocompleteLookup'
import { useAuth } from '@framework-core/web/auth/components/auth-provider'
import { StatusBadge } from '@/components/ui/status-badge'
import { createFieldErrors, inputErrorClassName, isBlank, setFieldError, summarizeFieldErrors, type FieldErrors, warningCardClassName } from '@/shared/forms/validation'
import { createCommonLookupOption, toLookupOption } from '@/shared/forms/common-lookup'
import { showFailedActionToast, showSavedToast, showValidationToast } from '@/shared/notifications/toast'
import {
  createTaskFromTemplate,
  createProduct,
  getEcommerceSettings,
  getProduct,
  HttpError,
  listCommonModuleItems,
  listTaskTemplates,
  listTasksByEntity,
  listUsers,
  uploadMediaImage,
  updateProduct,
} from '@/shared/api/client'
import {
  calculatePricingFromPurchase,
  type PricingFormulaSettings,
} from '../lib/pricing-formula'

type ProductFormValues = ProductUpsertPayload
type VariantPricingDraft = {
  purchase: number
  sellPercent: number
  mrpPercent: number
}

const storefrontDepartmentOptions = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'kids', label: 'Kids' },
  { value: 'accessories', label: 'Accessories' },
]

const createClientKey = () => globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
const MAX_PRODUCT_IMAGES = 5
const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024
const PRODUCT_IMAGE_HELP = 'Up to 5 images. JPG, PNG, or WebP. Max 5 MB each. Recommended 1600 x 2000 px.'

const emptyAttribute = (): ProductAttributeInput => ({ clientKey: createClientKey(), name: '' })
const emptyAttributeValue = (attributeClientKey = ''): ProductAttributeValueInput => ({ clientKey: createClientKey(), attributeClientKey, value: '' })
const emptyVariantImage = (isPrimary = false): ProductVariantImageInput => ({ imageUrl: '', isPrimary })
const emptyVariantAttribute = (): ProductVariantAttributeInput => ({ attributeName: '', attributeValue: '' })
const ensureSingleVariantImage = (images: ProductVariantImageInput[]) => {
  if (images.length === 0) {
    return [emptyVariantImage(true)]
  }

  const firstImage = images[0]
  return [{ ...firstImage, isPrimary: true }]
}

const emptyVariant = (): ProductVariantInput => ({
  clientKey: createClientKey(),
  sku: '',
  variantName: '',
  price: 0,
  costPrice: 0,
  stockQuantity: 0,
  openingStock: 0,
  weight: null,
  barcode: null,
  isActive: true,
  images: [emptyVariantImage(true)],
  attributes: [],
})
const emptyPrice = (): ProductPriceInput => ({ variantClientKey: null, mrp: 0, sellingPrice: 0, costPrice: 0 })
const emptyDiscount = (): ProductDiscountInput => ({ variantClientKey: null, discountType: 'percentage', discountValue: 0, startDate: null, endDate: null })
const emptyOffer = (): ProductOfferInput => ({ title: '', description: null, offerPrice: 0, startDate: null, endDate: null })
const emptyStockItem = (): ProductStockItemInput => ({ variantClientKey: null, warehouseId: '', quantity: 0, reservedQuantity: 0 })
const emptyTag = (): ProductTagInput => ({ name: '' })
const emptyReview = (): ProductReviewInput => ({ userId: null, rating: 5, review: null, reviewDate: null })
const defaultPricingFormulaSettings: PricingFormulaSettings = {
  purchaseToSellPercent: 75,
  purchaseToMrpPercent: 150,
}
const emptyVariantPricingDraft = (): VariantPricingDraft => ({
  purchase: 0,
  sellPercent: defaultPricingFormulaSettings.purchaseToSellPercent,
  mrpPercent: defaultPricingFormulaSettings.purchaseToMrpPercent,
})
const createDefaultStorefront = () => ({
  department: 'women' as const,
  homeSliderEnabled: false,
  homeSliderOrder: 0,
  promoSliderEnabled: false,
  promoSliderOrder: 0,
  featureSectionEnabled: false,
  featureSectionOrder: 0,
  isNewArrival: false,
  isBestSeller: false,
  isFeaturedLabel: false,
  catalogBadge: null,
  fabric: null,
  fit: null,
  sleeve: null,
  occasion: null,
  shippingNote: null,
})

function createDefaultValues(): ProductFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    brandId: '1',
    categoryId: '1',
    productGroupId: '1',
    productTypeId: '1',
    unitId: '1',
    hsnCodeId: '1',
    styleId: '1',
    sku: '',
    hasVariants: false,
    basePrice: 0,
    costPrice: 0,
    taxId: '1',
    isFeatured: false,
    isActive: true,
    images: [],
    variants: [],
    prices: [],
    discounts: [],
    offers: [],
    attributes: [],
    attributeValues: [],
    stockItems: [],
    stockMovements: [],
    seo: {
      metaTitle: null,
      metaDescription: null,
      metaKeywords: null,
    },
    storefront: createDefaultStorefront(),
    tags: [],
    reviews: [],
  }
}

function toErrorMessage(error: unknown) {
  if (error instanceof HttpError) return error.message
  if (error instanceof Error) return error.message
  return 'Failed to save product.'
}

function formatTaskDate(value: string | null) {
  if (!value) return 'Not scheduled'
  const parsedValue = new Date(value)
  if (Number.isNaN(parsedValue.getTime())) return value
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(parsedValue)
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-[0.8rem] text-destructive">{message}</p> : null
}

function validateProduct(values: ProductFormValues) {
  const errors = createFieldErrors()

  if (isBlank(values.name)) setFieldError(errors, 'name', 'Name is required.')

  return errors
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Failed to read image file.'))
        return
      }

      resolve(reader.result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })
}

function buildMediaUploadPayload(file: File): Promise<MediaImageUploadPayload> {
  return fileToDataUrl(file).then((dataUrl) => {
    const fileName = file.name.replace(/\.[^.]+$/, '') || 'product-image'
    const readableName = fileName.replace(/[-_]+/g, ' ').trim() || 'Product image'

    return {
      fileName,
      originalName: file.name,
      dataUrl,
      folderId: null,
      storageScope: 'public',
      title: readableName,
      altText: readableName,
      isActive: true,
    }
  })
}

function slugifyProductName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function buildAutoSku(prefix: string, nextNumber: string, digits: number) {
  const normalizedPrefix = prefix.trim().toUpperCase() || 'PRD'
  const numericValue = Number.parseInt(nextNumber, 10)
  const safeNumber = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1
  const safeDigits = Math.min(Math.max(digits, 2), 8)
  return `${normalizedPrefix}-${String(safeNumber).padStart(safeDigits, '0')}`
}

function buildVariantSignature(attributes: ProductVariantAttributeInput[], optionNames?: Set<string>) {
  return attributes
    .filter((attribute) => !optionNames || optionNames.has(attribute.attributeName.trim().toLowerCase()))
    .map((attribute) => `${attribute.attributeName.trim().toLowerCase()}::${attribute.attributeValue.trim().toLowerCase()}`)
    .sort()
    .join('||')
}

function buildVariantMatrix(values: ProductFormValues) {
  const groups = values.attributes
    .map((attribute) => {
      const attributeName = attribute.name.trim()
      const entries = values.attributeValues
        .filter((entry) => entry.attributeClientKey === attribute.clientKey)
        .map((entry) => entry.value.trim())
        .filter(Boolean)

      return {
        attributeName,
        values: Array.from(new Set(entries)),
      }
    })
    .filter((group) => group.attributeName && group.values.length > 0)

  if (groups.length === 0) {
    return []
  }

  const optionNames = new Set(groups.map((group) => group.attributeName.trim().toLowerCase()))

  const combinations: ProductVariantAttributeInput[][] = []

  function visit(groupIndex: number, current: ProductVariantAttributeInput[]) {
    if (groupIndex >= groups.length) {
      combinations.push(current)
      return
    }

    const group = groups[groupIndex]
    group.values.forEach((value) => {
      visit(groupIndex + 1, [...current, { attributeName: group.attributeName, attributeValue: value }])
    })
  }

  visit(0, [])

  const existingBySignature = new Map(values.variants.map((variant) => [buildVariantSignature(variant.attributes, optionNames), variant]))

  return combinations.map((attributes) => {
    const signature = buildVariantSignature(attributes, optionNames)
    const existing = existingBySignature.get(signature)

    if (existing) {
      const customAttributes = existing.attributes.filter((attribute) => !optionNames.has(attribute.attributeName.trim().toLowerCase()))
      return {
        ...existing,
        variantName: attributes.map((attribute) => attribute.attributeValue).join(' / '),
        attributes: [...attributes, ...customAttributes],
      }
    }

    return {
      ...emptyVariant(),
      variantName: attributes.map((attribute) => attribute.attributeValue).join(' / '),
      attributes,
    }
  })
}

function resolveLookupDefault(currentValue: string | null | undefined, options: CommonModuleItem[]) {
  if (options.length === 0) {
    return currentValue ?? '1'
  }

  if (currentValue && options.some((option) => option.id === currentValue)) {
    return currentValue
  }

  return options[0]?.id ?? '1'
}

function Section({
  title,
  description,
  addLabel,
  onAdd,
  headerAction,
  className,
  contentClassName,
  children,
}: PropsWithChildren<{
  title?: string
  description?: string
  addLabel?: string
  onAdd?: () => void
  headerAction?: React.ReactNode
  className?: string
  contentClassName?: string
}>) {
  const defaultHeaderAction = addLabel && onAdd ? (
    <Button type="button" variant="outline" size="sm" onClick={onAdd}>
      <Plus className="size-4" />
      {addLabel}
    </Button>
  ) : null
  const resolvedHeaderAction = headerAction ?? defaultHeaderAction
  const hasHeader = Boolean(title || description || resolvedHeaderAction)

  return (
    <Card className={className ?? 'rounded-md border-border/70 shadow-none'}>
      {hasHeader ? (
        <CardHeader className="flex flex-row items-start justify-between gap-3 px-4 py-3">
          <div>
            {title ? <CardTitle className="text-base">{title}</CardTitle> : null}
            {description ? <CardDescription className="mt-1 text-xs">{description}</CardDescription> : null}
          </div>
          {resolvedHeaderAction}
        </CardHeader>
      ) : null}
      <CardContent className={contentClassName ?? 'grid gap-3 px-4 pb-4 pt-3'}>{children}</CardContent>
    </Card>
  )
}

function Row({ children, onRemove, badge, removePosition = 'top' }: PropsWithChildren<{ onRemove: () => void; badge?: React.ReactNode; removePosition?: 'top' | 'bottom-left' | 'none' }>) {
  return (
    <div className="relative rounded-md border border-border/70 bg-background/80 p-3">
      {badge ? (
        <div className="absolute -left-3 -top-3 flex size-9 items-center justify-center rounded-full border border-primary/25 bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
          {badge}
        </div>
      ) : null}
      {removePosition === 'top' ? (
        <div className="mb-2 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      ) : null}
      {children}
      {removePosition === 'bottom-left' ? (
        <div className="mt-2 flex justify-start">
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function LookupSelect({
  label,
  value,
  options,
  moduleKey,
  placeholder = '-',
  onItemsChange,
  compact = false,
  onChange,
}: {
  label: string
  value: string | null
  options: CommonModuleItem[]
  moduleKey?: CommonModuleKey
  placeholder?: string
  onItemsChange?: (items: CommonModuleItem[]) => void
  compact?: boolean
  onChange: (value: string | null) => void
}) {
  const field = (
    <AutocompleteLookup
      value={value ?? ''}
      onChange={(nextValue) => onChange(nextValue || null)}
      options={options.map(toLookupOption)}
      allowEmptyOption
      emptyOptionLabel={placeholder}
      placeholder={`Search ${label.toLowerCase()}`}
      createOption={moduleKey ? async (labelValue) => {
        const { item, option } = await createCommonLookupOption(moduleKey, labelValue)
        onItemsChange?.([...options, item])
        return option
      } : undefined}
    />
  )

  if (compact) {
    return field
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {field}
    </div>
  )
}

function VariantSelect({
  label,
  value,
  variants,
  compact = false,
  onChange,
}: {
  label: string
  value: string | null
  variants: ProductVariantInput[]
  compact?: boolean
  onChange: (value: string | null) => void
}) {
  const field = (
    <select
      value={value ?? ''}
      onChange={(event) => onChange(event.target.value || null)}
      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      <option value="">Product level</option>
      {variants.map((variant) => (
        <option key={variant.clientKey} value={variant.clientKey}>
          {variant.variantName || variant.sku || variant.clientKey}
        </option>
      ))}
    </select>
  )

  if (compact) {
    return field
  }

  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {field}
    </div>
  )
}

function toFormValues(product: Product): ProductFormValues {
  const variantClientKeyById = new Map<string, string>()
  const attributes = product.attributes.map((attribute) => ({
    clientKey: attribute.id,
    name: attribute.name,
  }))

  product.variants.forEach((variant) => {
    variantClientKeyById.set(variant.id, variant.id)
  })

  return {
    name: product.name,
    slug: product.slug,
    description: product.description ?? '',
    shortDescription: product.shortDescription ?? '',
    brandId: product.brandId ?? '1',
    categoryId: product.categoryId ?? '1',
    productGroupId: product.productGroupId ?? '1',
    productTypeId: product.productTypeId ?? '1',
    unitId: product.unitId ?? '1',
    hsnCodeId: product.hsnCodeId ?? '1',
    styleId: product.styleId ?? '1',
    sku: product.sku,
    hasVariants: product.hasVariants,
    basePrice: product.basePrice,
    costPrice: product.costPrice,
    taxId: product.taxId ?? '1',
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    images: product.images.map((image) => ({ imageUrl: image.imageUrl, isPrimary: image.isPrimary, sortOrder: image.sortOrder })),
    variants: product.variants.map((variant) => ({
      clientKey: variant.id,
      sku: variant.sku,
      variantName: variant.variantName,
      price: variant.price,
      costPrice: variant.costPrice,
      stockQuantity: variant.stockQuantity,
      openingStock: variant.openingStock,
      weight: variant.weight,
      barcode: variant.barcode,
      isActive: variant.isActive,
      images: ensureSingleVariantImage(variant.images.map((image) => ({ imageUrl: image.imageUrl, isPrimary: image.isPrimary }))),
      attributes: variant.attributes.map((attribute) => ({ attributeName: attribute.attributeName, attributeValue: attribute.attributeValue })),
    })),
    prices: product.prices.map((price) => ({ variantClientKey: price.variantId ? variantClientKeyById.get(price.variantId) ?? null : null, mrp: price.mrp, sellingPrice: price.sellingPrice, costPrice: price.costPrice })),
    discounts: product.discounts.map((discount) => ({ variantClientKey: discount.variantId ? variantClientKeyById.get(discount.variantId) ?? null : null, discountType: discount.discountType, discountValue: discount.discountValue, startDate: discount.startDate, endDate: discount.endDate })),
    offers: product.offers.map((offer) => ({ title: offer.title, description: offer.description, offerPrice: offer.offerPrice, startDate: offer.startDate, endDate: offer.endDate })),
    attributes,
    attributeValues: product.attributeValues.map((value) => ({ clientKey: value.id, attributeClientKey: value.attributeId, value: value.value })),
    stockItems: product.stockItems.map((item) => ({ variantClientKey: item.variantId ? variantClientKeyById.get(item.variantId) ?? null : null, warehouseId: item.warehouseId, quantity: item.quantity, reservedQuantity: item.reservedQuantity })),
    stockMovements: product.stockMovements.map((movement) => ({ variantClientKey: movement.variantId ? variantClientKeyById.get(movement.variantId) ?? null : null, warehouseId: movement.warehouseId, movementType: movement.movementType, quantity: movement.quantity, referenceType: movement.referenceType, referenceId: movement.referenceId, movementAt: movement.movementAt.slice(0, 16) })),
    seo: product.seo ? { metaTitle: product.seo.metaTitle, metaDescription: product.seo.metaDescription, metaKeywords: product.seo.metaKeywords } : { metaTitle: null, metaDescription: null, metaKeywords: null },
    storefront: product.storefront ? {
      department: product.storefront.department,
      homeSliderEnabled: product.storefront.homeSliderEnabled,
      homeSliderOrder: product.storefront.homeSliderOrder,
      promoSliderEnabled: product.storefront.promoSliderEnabled,
      promoSliderOrder: product.storefront.promoSliderOrder,
      featureSectionEnabled: product.storefront.featureSectionEnabled,
      featureSectionOrder: product.storefront.featureSectionOrder,
      isNewArrival: product.storefront.isNewArrival,
      isBestSeller: product.storefront.isBestSeller,
      isFeaturedLabel: product.storefront.isFeaturedLabel,
      catalogBadge: product.storefront.catalogBadge,
      fabric: product.storefront.fabric,
      fit: product.storefront.fit,
      sleeve: product.storefront.sleeve,
      occasion: product.storefront.occasion,
      shippingNote: product.storefront.shippingNote,
    } : createDefaultStorefront(),
    tags: product.tags.map((tag) => ({ name: tag.name })),
    reviews: product.reviews.map((review) => ({ userId: review.userId, rating: review.rating, review: review.review, reviewDate: review.reviewDate.slice(0, 16) })),
  }
}

export function ProductFormPage() {
  const navigate = useNavigate()
  const { productId } = useParams()
  const { session } = useAuth()
  const isEditMode = Boolean(productId)
  const accessToken = session?.accessToken ?? null
  const [values, setValues] = useState<ProductFormValues>(createDefaultValues())
  const [loading, setLoading] = useState(isEditMode)
  const [saving, setSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(createFieldErrors())
  const [brands, setBrands] = useState<CommonModuleItem[]>([])
  const [categories, setCategories] = useState<CommonModuleItem[]>([])
  const [productGroups, setProductGroups] = useState<CommonModuleItem[]>([])
  const [productTypes, setProductTypes] = useState<CommonModuleItem[]>([])
  const [units, setUnits] = useState<CommonModuleItem[]>([])
  const [hsnCodes, setHsnCodes] = useState<CommonModuleItem[]>([])
  const [taxes, setTaxes] = useState<CommonModuleItem[]>([])
  const [styles, setStyles] = useState<CommonModuleItem[]>([])
  const [warehouses, setWarehouses] = useState<CommonModuleItem[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const productImageInputRef = useRef<HTMLInputElement | null>(null)
  const [autoSlugEnabled, setAutoSlugEnabled] = useState(!isEditMode)
  const [autoSkuEnabled, setAutoSkuEnabled] = useState(!isEditMode)
  const [skuPrefix, setSkuPrefix] = useState('PRD')
  const [skuNextNumber, setSkuNextNumber] = useState('1')
  const [skuDigits, setSkuDigits] = useState(4)
  const [variantPricingDraft, setVariantPricingDraft] = useState<VariantPricingDraft>(emptyVariantPricingDraft())
  const [productTasks, setProductTasks] = useState<TaskSummary[]>([])
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplateSummary[]>([])
  const [taskUsers, setTaskUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState('')
  const [selectedTaskAssigneeId, setSelectedTaskAssigneeId] = useState('')
  const [selectedTaskDueDate, setSelectedTaskDueDate] = useState('')
  const [creatingProductTask, setCreatingProductTask] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadLookups() {
      const [brandItems, categoryItems, productGroupItems, productTypeItems, unitItems, hsnItems, taxItems, styleItems, warehouseItems] = await Promise.all([
        listCommonModuleItems('brands', false),
        listCommonModuleItems('productCategories', false),
        listCommonModuleItems('productGroups', false),
        listCommonModuleItems('productTypes', false),
        listCommonModuleItems('units', false),
        listCommonModuleItems('hsnCodes', false),
        listCommonModuleItems('taxes', false),
        listCommonModuleItems('styles', false),
        listCommonModuleItems('warehouses', false),
      ])

      if (!cancelled) {
        setBrands(brandItems)
        setCategories(categoryItems)
        setProductGroups(productGroupItems)
        setProductTypes(productTypeItems)
        setUnits(unitItems)
        setHsnCodes(hsnItems)
        setTaxes(taxItems)
        setStyles(styleItems)
        setWarehouses(warehouseItems)
      }
    }

    void loadLookups()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!accessToken) {
      return
    }
    const authToken = accessToken

    let cancelled = false

    async function loadPricingSettings() {
      try {
        const settings = await getEcommerceSettings(authToken)
        if (cancelled) {
          return
        }

        const nextSettings = {
          purchaseToSellPercent: settings.purchaseToSellPercent,
          purchaseToMrpPercent: settings.purchaseToMrpPercent,
        }

        setVariantPricingDraft((current) => ({
          ...current,
          sellPercent: nextSettings.purchaseToSellPercent,
          mrpPercent: nextSettings.purchaseToMrpPercent,
        }))
      } catch {
        // Keep the local default formula when settings cannot be loaded.
      }
    }

    void loadPricingSettings()

    return () => {
      cancelled = true
    }
  }, [accessToken])

  useEffect(() => {
    if (!accessToken || !productId) {
      setProductTasks([])
      return
    }

    const taskAccessToken = accessToken
    const activeProductId = productId
    let cancelled = false

    async function loadProductTasks() {
      try {
        const items = await listTasksByEntity(taskAccessToken, 'product', activeProductId)
        if (!cancelled) {
          setProductTasks(items)
        }
      } catch {
        if (!cancelled) {
          setProductTasks([])
        }
      }
    }

    void loadProductTasks()
    return () => { cancelled = true }
  }, [accessToken, productId])

  useEffect(() => {
    if (!accessToken) {
      setTaskTemplates([])
      setTaskUsers([])
      return
    }

    const taskAccessToken = accessToken
    let cancelled = false

    async function loadTaskSupport() {
      try {
        const [templates, users] = await Promise.all([
          listTaskTemplates(taskAccessToken, 'product'),
          listUsers(taskAccessToken),
        ])

        if (!cancelled) {
          setTaskTemplates(templates)
          setTaskUsers(users.map((user) => ({ id: user.id, name: user.displayName || user.email })))
          if (!selectedTaskTemplateId) {
            const defaultTemplate = templates.find((template) => template.id === 'task-template:verify-product-price') ?? templates[0]
            setSelectedTaskTemplateId(defaultTemplate?.id ?? '')
          }
        }
      } catch {
        if (!cancelled) {
          setTaskTemplates([])
          setTaskUsers([])
        }
      }
    }

    void loadTaskSupport()
    return () => { cancelled = true }
  }, [accessToken, selectedTaskTemplateId])

  useEffect(() => {
    if (loading) {
      return
    }

    setValues((current) => {
      const nextProductGroupId = resolveLookupDefault(current.productGroupId, productGroups)
      const nextUnitId = resolveLookupDefault(current.unitId, units)
      const nextTaxId = resolveLookupDefault(current.taxId, taxes)

      if (
        current.productGroupId === nextProductGroupId &&
        current.unitId === nextUnitId &&
        current.taxId === nextTaxId
      ) {
        return current
      }

      return {
        ...current,
        productGroupId: nextProductGroupId,
        unitId: nextUnitId,
        taxId: nextTaxId,
      }
    })
  }, [loading, productGroups, taxes, units])

  useEffect(() => {
    let cancelled = false

    async function loadProduct() {
      if (!productId) {
        return
      }

      setLoading(true)
      setErrorMessage(null)

      try {
        const product = await getProduct(productId)
        if (!cancelled) {
          setValues(toFormValues(product))
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

    void loadProduct()
    return () => { cancelled = true }
  }, [productId])

  useEffect(() => {
    if (!autoSlugEnabled) {
      return
    }

    const nextSlug = slugifyProductName(values.name)
    setValues((current) => current.slug === nextSlug ? current : { ...current, slug: nextSlug })
  }, [autoSlugEnabled, values.name])

  useEffect(() => {
    if (!autoSkuEnabled) {
      return
    }

    const nextSku = buildAutoSku(skuPrefix, skuNextNumber, skuDigits)
    setValues((current) => current.sku === nextSku ? current : { ...current, sku: nextSku })
  }, [autoSkuEnabled, skuDigits, skuNextNumber, skuPrefix])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextFieldErrors = validateProduct(values)
    setFieldErrors(nextFieldErrors)
    if (Object.keys(nextFieldErrors).length > 0) {
      setErrorMessage('Validation failed.')
      showValidationToast('product')
      return
    }
    setSaving(true)
    setErrorMessage(null)

    try {
      const savedProduct = productId
        ? await updateProduct(productId, values)
        : await createProduct(values)

      showSavedToast({
        entityLabel: 'product',
        recordName: savedProduct.name,
        referenceId: savedProduct.id,
        mode: productId ? 'update' : 'create',
      })

      void navigate('/admin/dashboard/products')
    } catch (error) {
      const message = toErrorMessage(error)
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'product',
        action: productId ? 'update' : 'save',
        detail: message,
      })
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateProductTask() {
    if (!accessToken || !productId || !selectedTaskTemplateId) {
      return
    }

    setCreatingProductTask(true)
    setErrorMessage(null)

    try {
      const createdTask = await createTaskFromTemplate(accessToken, {
        templateId: selectedTaskTemplateId,
        assigneeId: selectedTaskAssigneeId || null,
        dueDate: selectedTaskDueDate || null,
        entityType: 'product',
        entityId: productId,
        entityLabel: values.name.trim() || values.slug.trim() || productId,
        title: values.name.trim() ? `Verify ${values.name.trim()} price update` : null,
      })

      setProductTasks((current) => [...current, createdTask].sort((left, right) => left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)))
      setSelectedTaskAssigneeId('')
      setSelectedTaskDueDate('')
      showSavedToast({
        entityLabel: 'task',
        recordName: createdTask.title,
        referenceId: createdTask.id,
        mode: 'create',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create product task.'
      setErrorMessage(message)
      showFailedActionToast({
        entityLabel: 'task',
        action: 'create',
        detail: message,
      })
    } finally {
      setCreatingProductTask(false)
    }
  }

  async function handleProductImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''

    if (files.length === 0) {
      return
    }

    const availableSlots = MAX_PRODUCT_IMAGES - values.images.length
    if (availableSlots <= 0) {
      setErrorMessage(`Only ${MAX_PRODUCT_IMAGES} product images are allowed.`)
      return
    }

    const limitedFiles = files.slice(0, availableSlots)
    const oversizeFile = limitedFiles.find((file) => file.size > MAX_PRODUCT_IMAGE_BYTES)
    if (oversizeFile) {
      setErrorMessage(`${oversizeFile.name} is larger than 5 MB.`)
      return
    }

    setUploadingImages(true)
    setErrorMessage(null)

    try {
      const uploadedAssets: Media[] = []
      for (const file of limitedFiles) {
        const payload = await buildMediaUploadPayload(file)
        uploadedAssets.push(await uploadMediaImage(payload))
      }

      setValues((current) => {
        const hasPrimary = current.images.some((image) => image.isPrimary)
        const appended = uploadedAssets.map((asset, index) => ({
          imageUrl: asset.fileUrl,
          isPrimary: !hasPrimary && index === 0 && current.images.length === 0,
          sortOrder: current.images.length + index,
        }))

        return {
          ...current,
          images: [...current.images, ...appended],
        }
      })
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setUploadingImages(false)
    }
  }

  function applyPricingToVariantRows() {
    setValues((current) => {
      const variantKeys = current.variants.map((variant) => variant.clientKey)
      const nextPrices = [...current.prices]
      const purchasePrice = variantPricingDraft.purchase
      const formula = calculatePricingFromPurchase(purchasePrice, {
        purchaseToSellPercent: variantPricingDraft.sellPercent,
        purchaseToMrpPercent: variantPricingDraft.mrpPercent,
      })

      const upsertPriceRow = (variantClientKey: string | null) => {
        const rowIndex = nextPrices.findIndex((entry) => entry.variantClientKey === variantClientKey)
        const nextRow: ProductPriceInput = {
          variantClientKey,
          costPrice: formula.purchasePrice,
          sellingPrice: formula.sellingPrice,
          mrp: formula.mrp,
        }

        if (rowIndex >= 0) {
          nextPrices[rowIndex] = {
            ...nextPrices[rowIndex],
            ...nextRow,
          }
          return
        }

        nextPrices.push(nextRow)
      }

      upsertPriceRow(null)

      variantKeys.forEach((variantKey) => {
        upsertPriceRow(variantKey)
      })

      return {
        ...current,
        basePrice: formula.sellingPrice,
        costPrice: formula.purchasePrice,
        prices: nextPrices,
      }
    })
  }

  useEffect(() => {
    if (isEditMode) {
      return
    }

    if (variantPricingDraft.purchase <= 0) {
      return
    }

    const formula = calculatePricingFromPurchase(variantPricingDraft.purchase, {
      purchaseToSellPercent: variantPricingDraft.sellPercent,
      purchaseToMrpPercent: variantPricingDraft.mrpPercent,
    })

    setValues((current) => {
      const variantKeys = current.variants.map((variant) => variant.clientKey)
      const nextPrices = [...current.prices]

      const upsertPriceRow = (variantClientKey: string | null) => {
        const rowIndex = nextPrices.findIndex((entry) => entry.variantClientKey === variantClientKey)
        const nextRow: ProductPriceInput = {
          variantClientKey,
          costPrice: formula.purchasePrice,
          sellingPrice: formula.sellingPrice,
          mrp: formula.mrp,
        }

        if (rowIndex >= 0) {
          nextPrices[rowIndex] = {
            ...nextPrices[rowIndex],
            ...nextRow,
          }
          return
        }

        nextPrices.push(nextRow)
      }

      upsertPriceRow(null)

      variantKeys.forEach((variantKey) => {
        upsertPriceRow(variantKey)
      })

      return {
        ...current,
        basePrice: formula.sellingPrice,
        costPrice: formula.purchasePrice,
        prices: nextPrices,
      }
    })
  }, [
    isEditMode,
    variantPricingDraft.mrpPercent,
    variantPricingDraft.sellPercent,
    variantPricingDraft.purchase,
  ])

  const overviewTab: AnimatedContentTab = {
    label: 'Overview',
    value: 'overview',
    content: (
      <>
        <Section className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <div className="grid min-h-[4.75rem] gap-2"><Label className={fieldErrors.name ? 'text-destructive' : undefined}>Name</Label><Input className={inputErrorClassName(Boolean(fieldErrors.name))} value={values.name} onChange={(event) => setValues((current) => ({ ...current, name: event.target.value }))} /><FieldError message={fieldErrors.name} /></div>
            <div className="grid gap-2"><Label>Slug</Label><Input value={values.slug} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} /></div>
            <div className="grid gap-2"><Label>SKU</Label><Input value={values.sku} onChange={(event) => setValues((current) => ({ ...current, sku: event.target.value }))} /></div>
            <LookupSelect label="Brand" value={values.brandId} options={brands} moduleKey="brands" onItemsChange={setBrands} onChange={(value) => setValues((current) => ({ ...current, brandId: value ?? '1' }))} />
            <LookupSelect label="Category" value={values.categoryId} options={categories} moduleKey="productCategories" onItemsChange={setCategories} onChange={(value) => setValues((current) => ({ ...current, categoryId: value ?? '1' }))} />
            <LookupSelect label="Product Group" value={values.productGroupId} options={productGroups} moduleKey="productGroups" onItemsChange={setProductGroups} onChange={(value) => setValues((current) => ({ ...current, productGroupId: value ?? '1' }))} />
            <LookupSelect label="Product Type" value={values.productTypeId} options={productTypes} moduleKey="productTypes" onItemsChange={setProductTypes} onChange={(value) => setValues((current) => ({ ...current, productTypeId: value ?? '1' }))} />
            <LookupSelect label="Unit" value={values.unitId} options={units} moduleKey="units" onItemsChange={setUnits} onChange={(value) => setValues((current) => ({ ...current, unitId: value ?? '1' }))} />
            <LookupSelect label="HSN Code" value={values.hsnCodeId} options={hsnCodes} moduleKey="hsnCodes" onItemsChange={setHsnCodes} onChange={(value) => setValues((current) => ({ ...current, hsnCodeId: value ?? '1' }))} />
            <LookupSelect label="Tax" value={values.taxId} options={taxes} moduleKey="taxes" onItemsChange={setTaxes} onChange={(value) => setValues((current) => ({ ...current, taxId: value ?? '1' }))} />
            <LookupSelect label="Style" value={values.styleId} options={styles} moduleKey="styles" onItemsChange={setStyles} onChange={(value) => setValues((current) => ({ ...current, styleId: value ?? '1' }))} />
          </div>
        </Section>
        <Section title="Images" description="Compact product gallery for storefront and merchandising." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <input
            ref={productImageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            className="hidden"
            onChange={(event) => { void handleProductImageUpload(event) }}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.05rem] border border-border/70 bg-muted/15 px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-foreground">Product gallery</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{PRODUCT_IMAGE_HELP}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => productImageInputRef.current?.click()}
              disabled={uploadingImages || values.images.length >= MAX_PRODUCT_IMAGES}
            >
              {uploadingImages ? <Upload className="size-4 animate-pulse" /> : <ImagePlus className="size-4" />}
              {uploadingImages ? 'Uploading...' : 'Media'}
            </Button>
          </div>

          {values.images.length > 0 ? (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-5">
              {values.images.map((image, index) => (
                <div key={`image-${index}`} className="overflow-hidden rounded-[1rem] border border-border/70 bg-background/80">
                  <button
                    type="button"
                    className="group relative block h-28 w-full overflow-hidden bg-muted/30"
                    onClick={() => setPreviewImageUrl(image.imageUrl)}
                  >
                    <img src={image.imageUrl} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs text-white">
                      <span>{image.isPrimary ? 'Primary' : `Image ${index + 1}`}</span>
                      <Expand className="size-3.5 opacity-90" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between gap-2 px-2.5 py-2.5">
                    <Button
                      type="button"
                      variant={image.isPrimary ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setValues((current) => ({
                        ...current,
                        images: current.images.map((entry, rowIndex) => ({
                          ...entry,
                          isPrimary: rowIndex === index,
                          sortOrder: rowIndex,
                        })),
                      }))}
                    >
                      <Star className="size-4" />
                      {image.isPrimary ? 'Primary' : 'Set primary'}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setValues((current) => {
                        const nextImages = current.images.filter((_, rowIndex) => rowIndex !== index).map((entry, rowIndex) => ({
                          ...entry,
                          sortOrder: rowIndex,
                        }))

                        if (nextImages.length > 0 && !nextImages.some((entry) => entry.isPrimary)) {
                          nextImages[0] = { ...nextImages[0], isPrimary: true }
                        }

                        return { ...current, images: nextImages }
                      })}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-[1.2rem] border border-dashed border-border/70 bg-background/60 px-4 text-sm text-muted-foreground">
              No product images added yet.
            </div>
          )}
        </Section>
      </>
    ),
  }

  const attributesTab: AnimatedContentTab = {
    label: 'Attributes',
    value: 'attributes',
    content: (
      <Section
        title="Attributes"
        description="Keep the base attribute list simple for color, size, fabric, and other option groups."
        onAdd={() => setValues((current) => ({ ...current, attributes: [...current.attributes, emptyAttribute()] }))}
        addLabel="Add Attribute"
        headerAction={(
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValues((current) => ({
                ...current,
                hasVariants: true,
                variants: buildVariantMatrix(current),
              }))}
            >
              <Boxes className="size-4" />
              Set Variables
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setValues((current) => ({ ...current, attributes: [...current.attributes, emptyAttribute()] }))}>
              <Plus className="size-4" />
              Add Attribute
            </Button>
          </div>
        )}
      >
        {values.attributes.map((attribute, index) => (
          <Row removePosition="none" badge={index + 1} key={attribute.clientKey} onRemove={() => setValues((current) => ({ ...current, attributes: current.attributes.filter((entry) => entry.clientKey !== attribute.clientKey), attributeValues: current.attributeValues.filter((entry) => entry.attributeClientKey !== attribute.clientKey) }))}>
            <div className="grid items-start gap-1.5 lg:grid-cols-2">
              <div className="self-start overflow-hidden rounded-md border border-border/60 bg-white">
                <div className="grid grid-cols-[110px_minmax(0,1fr)] text-sm">
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Name</div>
                  <div className="bg-white px-2 py-1.5">
                    <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" placeholder="Color" value={attribute.name} onChange={(event) => setValues((current) => ({ ...current, attributes: current.attributes.map((entry, rowIndex) => rowIndex === index ? { ...entry, name: event.target.value } : entry) }))} />
                  </div>
                </div>
                <div className="flex justify-start border-t border-border/60 bg-white px-2 py-1.5">
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setValues((current) => ({ ...current, attributes: current.attributes.filter((entry) => entry.clientKey !== attribute.clientKey), attributeValues: current.attributeValues.filter((entry) => entry.attributeClientKey !== attribute.clientKey) }))}>
                    <Trash2 className="size-4" />
                    Remove
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="overflow-hidden rounded-md bg-white">
                  <div className="flex items-center justify-end bg-white px-2 py-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => setValues((current) => ({ ...current, attributeValues: [...current.attributeValues, emptyAttributeValue(attribute.clientKey)] }))}>
                      <Plus className="size-4" />
                      Add Value
                    </Button>
                  </div>
                  <div className="space-y-1 p-1">
                    {values.attributeValues.filter((entry) => entry.attributeClientKey === attribute.clientKey).map((value) => (
                      <div key={value.clientKey} className="overflow-hidden rounded-md border border-border/60 bg-white">
                        <div className="grid grid-cols-[110px_minmax(0,1fr)_48px]">
                          <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium text-muted-foreground">Value</div>
                          <div className="bg-white px-2 py-1.5">
                            <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" placeholder="Red" value={value.value} onChange={(event) => setValues((current) => ({ ...current, attributeValues: current.attributeValues.map((entry) => entry.clientKey === value.clientKey ? { ...entry, value: event.target.value } : entry) }))} />
                          </div>
                          <div className="flex items-center justify-center border-l border-border/60 bg-white px-1.5 py-1.5">
                            <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setValues((current) => ({ ...current, attributeValues: current.attributeValues.filter((entry) => entry.clientKey !== value.clientKey) }))}>
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Row>
        ))}
      </Section>
    ),
  }

  const contentTab: AnimatedContentTab = {
    label: 'Content',
    value: 'content',
    content: (
      <Section title="Descriptions" description="Short and full product copy for catalog and detail pages." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label>Short Description</Label>
            <Input value={values.shortDescription} onChange={(event) => setValues((current) => ({ ...current, shortDescription: event.target.value }))} />
          </div>
          <div className="grid gap-2">
            <Label>Description</Label>
            <Textarea rows={5} value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} />
          </div>
        </div>
      </Section>
    ),
  }

  const settingsTab: AnimatedContentTab = {
    label: 'Settings',
    value: 'settings',
    content: (
      <>
        <Section title="Slug" description="Keep URL naming automatic or override it manually." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="grid gap-2">
              <Label>New Slug</Label>
              <Input value={values.slug} onChange={(event) => setValues((current) => ({ ...current, slug: event.target.value }))} />
            </div>
            <div className="flex items-end gap-3">
              <label className="flex h-9 items-center gap-2 rounded-md border border-border/70 px-3 text-sm text-muted-foreground">
                <Checkbox checked={autoSlugEnabled} onCheckedChange={(checked) => setAutoSlugEnabled(Boolean(checked))} />
                Auto slug
              </label>
              <Button type="button" variant="outline" onClick={() => setValues((current) => ({ ...current, slug: slugifyProductName(current.name) }))}>
                New Slug
              </Button>
            </div>
          </div>
        </Section>
        <Section title="SKU" description="Use automatic numbering or maintain the product code directly." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_140px_120px_100px]">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label>SKU</Label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Checkbox checked={autoSkuEnabled} onCheckedChange={(checked) => setAutoSkuEnabled(Boolean(checked))} />
                  Auto numbering
                </label>
              </div>
              <Input value={values.sku} onChange={(event) => setValues((current) => ({ ...current, sku: event.target.value }))} />
            </div>
            <div className="grid gap-2">
              <Label>Prefix</Label>
              <Input value={skuPrefix} onChange={(event) => setSkuPrefix(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Next No.</Label>
              <Input value={skuNextNumber} onChange={(event) => setSkuNextNumber(event.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Digits</Label>
              <Input type="number" min="2" max="8" value={skuDigits} onChange={(event) => setSkuDigits(Number(event.target.value || 4))} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="button" variant="outline" onClick={() => setValues((current) => ({ ...current, sku: buildAutoSku(skuPrefix, skuNextNumber, skuDigits) }))}>
              New SKU
            </Button>
          </div>
        </Section>
        <Section title="Product Settings" description="Control product status and sales structure." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-2 px-4 pb-4 pt-3 md:grid-cols-3">
          <label className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2.5">
            <Checkbox checked={values.hasVariants} onCheckedChange={(checked) => setValues((current) => ({ ...current, hasVariants: Boolean(checked) }))} />
            <span className="text-sm font-medium">Has variants</span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2.5">
            <Checkbox checked={values.isFeatured} onCheckedChange={(checked) => setValues((current) => ({ ...current, isFeatured: Boolean(checked) }))} />
            <span className="text-sm font-medium">Featured product</span>
          </label>
          <label className="flex items-center gap-3 rounded-md border border-border/70 px-3 py-2.5">
            <Checkbox checked={values.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, isActive: Boolean(checked) }))} />
            <span className="text-sm font-medium">Active product</span>
          </label>
        </Section>
      </>
    ),
  }

  const variantsTab: AnimatedContentTab = {
    label: 'Variants',
    value: 'variants',
    content: (
      <Section title="Variants" description="Keep variants focused on option identity, media, and active state." addLabel="Add Variant" onAdd={() => setValues((current) => ({ ...current, variants: [...current.variants, emptyVariant()] }))} className="border-0 bg-transparent shadow-none" contentClassName="grid gap-3 px-0 pb-0 pt-2">
        {values.variants.map((variant, index) => (
          <Row key={variant.clientKey} badge={index + 1} onRemove={() => setValues((current) => ({ ...current, variants: current.variants.filter((entry) => entry.clientKey !== variant.clientKey), prices: current.prices.map((entry) => entry.variantClientKey === variant.clientKey ? { ...entry, variantClientKey: null } : entry), discounts: current.discounts.map((entry) => entry.variantClientKey === variant.clientKey ? { ...entry, variantClientKey: null } : entry), stockItems: current.stockItems.map((entry) => entry.variantClientKey === variant.clientKey ? { ...entry, variantClientKey: null } : entry), stockMovements: current.stockMovements.map((entry) => entry.variantClientKey === variant.clientKey ? { ...entry, variantClientKey: null } : entry) }))}>
            <div className="grid gap-2 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1fr)]">
              <div className="grid content-start gap-2">
                <div className="overflow-hidden rounded-md border border-border/60 bg-white">
                  <div className="grid grid-cols-[132px_minmax(0,1fr)] divide-y divide-border/60 text-sm">
                    <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Variant Name</div>
                    <div className="bg-white px-2 py-1.5"><Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" value={variant.variantName} onChange={(event) => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, variantName: event.target.value } : entry) }))} /></div>
                    <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">SKU</div>
                    <div className="bg-white px-2 py-1.5"><Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" value={variant.sku} onChange={(event) => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, sku: event.target.value } : entry) }))} /></div>
                    <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Status</div>
                    <div className="bg-white px-2 py-1.5">
                      <label className="flex items-center gap-2 px-2 py-1.5">
                        <Checkbox checked={variant.isActive} onCheckedChange={(checked) => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, isActive: Boolean(checked) } : entry) }))} />
                        <span className="text-sm font-medium">Active variant</span>
                      </label>
                    </div>
                  </div>
                </div>
                {variant.images.slice(0, 1).map((image, imageIndex) => (
                  <div key={`${variant.clientKey}-image-${imageIndex}`} className="rounded-md border border-border/60 bg-background/80 p-2">
                    <div className="grid gap-2 md:grid-cols-[190px_minmax(0,1fr)]">
                      <div>
                        {image.imageUrl ? (
                          <button
                            type="button"
                            className="group relative block aspect-square w-full overflow-hidden rounded-[0.9rem] border border-border/60 bg-muted/30"
                            onClick={() => setPreviewImageUrl(image.imageUrl)}
                          >
                            <img src={image.imageUrl} alt="Variant image" className="h-full w-full object-cover" loading="lazy" decoding="async" />
                            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/55 to-transparent px-3 py-2 text-xs text-white">
                              <span>Primary</span>
                              <Expand className="size-3.5 opacity-90" />
                            </div>
                          </button>
                        ) : (
                          <div className="flex aspect-square w-full items-center justify-center rounded-[0.9rem] border border-dashed border-border/60 bg-muted/15 px-3 text-xs text-muted-foreground">
                            Add image
                          </div>
                        )}
                      </div>
                      <div className="grid content-start gap-2">
                        <MediaImageField
                          label=""
                          value={image.imageUrl}
                          showPreview={false}
                          onChange={(value) => setValues((current) => ({
                            ...current,
                            variants: current.variants.map((entry, rowIndex) => rowIndex === index ? {
                              ...entry,
                              images: [{ ...(entry.images[0] ?? emptyVariantImage(true)), imageUrl: value, isPrimary: true }],
                            } : entry),
                          }))}
                        />
                        <div className="flex items-center gap-2">
                          <Button type="button" size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Star className="size-4" />
                            Primary
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="overflow-hidden rounded-md border border-border/60 bg-white">
                <div className="flex items-center justify-end bg-white px-2 py-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, attributes: [...entry.attributes, emptyVariantAttribute()] } : entry) }))}>
                    <Plus className="size-4" />
                    Add Variant Name
                  </Button>
                </div>
                <div className="space-y-1 p-1">
                  {variant.attributes.map((attribute, attributeIndex) => (
                    <div key={`${variant.clientKey}-attribute-${attributeIndex}`} className="overflow-hidden rounded-md border border-border/60 bg-white">
                      <div className="grid grid-cols-[110px_minmax(0,1fr)_48px]">
                        <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium text-muted-foreground">Name</div>
                        <div className="bg-white px-2 py-1.5">
                          <Input
                            className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0"
                            placeholder="Weight"
                            value={attribute.attributeName}
                            onChange={(event) => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, attributes: entry.attributes.map((attributeEntry, nestedIndex) => nestedIndex === attributeIndex ? { ...attributeEntry, attributeName: event.target.value } : attributeEntry) } : entry) }))}
                          />
                        </div>
                        <div className="row-span-2 flex items-center justify-center border-l border-border/60 bg-white px-1.5 py-1.5">
                          <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, attributes: entry.attributes.filter((_, nestedIndex) => nestedIndex !== attributeIndex) } : entry) }))}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="flex items-center border-r border-t border-border/60 bg-muted/30 px-3 py-1.5 text-sm font-medium text-muted-foreground">Value</div>
                        <div className="border-t border-border/60 bg-white px-2 py-1.5">
                          <Input
                            className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0"
                            placeholder="12"
                            value={attribute.attributeValue}
                            onChange={(event) => setValues((current) => ({ ...current, variants: current.variants.map((entry, rowIndex) => rowIndex === index ? { ...entry, attributes: entry.attributes.map((attributeEntry, nestedIndex) => nestedIndex === attributeIndex ? { ...attributeEntry, attributeValue: event.target.value } : attributeEntry) } : entry) }))}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Row>
        ))}
      </Section>
    ),
  }

  const pricingTab: AnimatedContentTab = {
    label: 'Pricing',
    value: 'pricing',
    content: (
      <>
        <Section title="Apply Pricing" description="Set a purchase price and formula percentages once, then apply the computed sell and MRP to every variant scope." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
            <div className="grid gap-2">
              <Label>Purchase</Label>
              <Input
                type="number"
                step="0.01"
                value={variantPricingDraft.purchase}
                onChange={(event) => setVariantPricingDraft((current) => ({ ...current, purchase: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>Sell %</Label>
              <Input
                type="number"
                step="0.01"
                value={variantPricingDraft.sellPercent}
                onChange={(event) => setVariantPricingDraft((current) => ({ ...current, sellPercent: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="grid gap-2">
              <Label>MRP %</Label>
              <Input
                type="number"
                step="0.01"
                value={variantPricingDraft.mrpPercent}
                onChange={(event) => setVariantPricingDraft((current) => ({ ...current, mrpPercent: Number(event.target.value || 0) }))}
              />
            </div>
            <div className="flex items-end">
              <Button type="button" className="w-full md:w-auto" onClick={() => applyPricingToVariantRows()}>
                Calculate all product prices
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            Preview: 100 to {calculatePricingFromPurchase(100, { purchaseToSellPercent: variantPricingDraft.sellPercent, purchaseToMrpPercent: variantPricingDraft.mrpPercent }).sellingPrice} sell and {calculatePricingFromPurchase(100, { purchaseToSellPercent: variantPricingDraft.sellPercent, purchaseToMrpPercent: variantPricingDraft.mrpPercent }).mrp} MRP, rounded up.
          </div>
        </Section>
        <Section title="Product Pricing" description="Keep product-level pricing separate from variant identity." className="rounded-md border-border/70 shadow-none" contentClassName="grid gap-3 px-4 pb-4 pt-3">
          <div className="overflow-hidden rounded-md border border-border/60 bg-white">
            <div className="grid grid-cols-[132px_minmax(0,1fr)] border-b border-border/60 text-sm lg:grid-cols-[132px_minmax(0,1fr)_132px_minmax(0,1fr)]">
              <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Base Price</div>
              <div className="bg-white px-2 py-1.5 lg:border-r lg:border-border/60">
                <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" type="number" step="0.01" value={values.basePrice} onChange={(event) => setValues((current) => ({ ...current, basePrice: Number(event.target.value || 0) }))} />
              </div>
              <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground lg:border-l lg:border-border/60">Purchase Price</div>
              <div className="bg-white px-2 py-1.5">
                <Input
                  className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0"
                  type="number"
                  step="0.01"
                  value={values.costPrice}
                  onChange={(event) => {
                    const nextPurchase = Number(event.target.value || 0)
                    setValues((current) => ({ ...current, costPrice: nextPurchase }))
                    if (!isEditMode) {
                      setVariantPricingDraft((current) => ({ ...current, purchase: nextPurchase }))
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </Section>
        <Section title="Prices" description="List, sell, and cost price rows for product or variant scope." addLabel="Add Price" onAdd={() => setValues((current) => ({ ...current, prices: [...current.prices, emptyPrice()] }))}>
          <div className="overflow-hidden rounded-md border border-border/60 bg-white">
            <div className="hidden grid-cols-[minmax(0,1.25fr)_140px_140px_140px_56px] border-b border-border/60 bg-muted/20 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
              <div className="px-3 py-2">Variant Scope</div>
              <div className="border-l border-border/60 px-3 py-2">Purchase</div>
              <div className="border-l border-border/60 px-3 py-2">Sell</div>
              <div className="border-l border-border/60 px-3 py-2">MRP</div>
              <div className="border-l border-border/60 px-3 py-2 text-center">Action</div>
            </div>
            {values.prices.map((price, index) => (
              <div key={`price-${index}`} className="border-b border-border/60 last:border-b-0">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_140px_140px_140px_56px]">
                  <div className="border-border/60 bg-white px-2 py-2 lg:border-r">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Variant Scope</Label>
                    <select
                      value={price.variantClientKey ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, prices: current.prices.map((entry, rowIndex) => rowIndex === index ? { ...entry, variantClientKey: event.target.value || null } : entry) }))}
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 lg:h-8 lg:border-0 lg:bg-white lg:px-2 lg:shadow-none lg:focus-visible:ring-0"
                    >
                      <option value="">Product level</option>
                      {values.variants.map((variant) => (
                        <option key={variant.clientKey} value={variant.clientKey}>
                          {variant.variantName || variant.sku || variant.clientKey}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Purchase</Label>
                    <Input className="h-8 w-full border-input bg-white px-2 lg:border-0 lg:shadow-none lg:focus-visible:ring-0" type="number" step="0.01" value={price.costPrice} onChange={(event) => setValues((current) => ({ ...current, prices: current.prices.map((entry, rowIndex) => rowIndex === index ? { ...entry, costPrice: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Sell</Label>
                    <Input className="h-8 w-full border-input bg-white px-2 lg:border-0 lg:shadow-none lg:focus-visible:ring-0" type="number" step="0.01" value={price.sellingPrice} onChange={(event) => setValues((current) => ({ ...current, prices: current.prices.map((entry, rowIndex) => rowIndex === index ? { ...entry, sellingPrice: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">MRP</Label>
                    <Input className="h-8 w-full border-input bg-white px-2 lg:border-0 lg:shadow-none lg:focus-visible:ring-0" type="number" step="0.01" value={price.mrp} onChange={(event) => setValues((current) => ({ ...current, prices: current.prices.map((entry, rowIndex) => rowIndex === index ? { ...entry, mrp: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                  <div className="flex items-center justify-end border-t border-border/60 bg-white px-2 py-2 lg:justify-center lg:border-l lg:border-t-0">
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setValues((current) => ({ ...current, prices: current.prices.filter((_, rowIndex) => rowIndex !== index) }))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Discounts" description="Discount windows by product or variant scope." addLabel="Add Discount" onAdd={() => setValues((current) => ({ ...current, discounts: [...current.discounts, emptyDiscount()] }))}>
          {values.discounts.map((discount, index) => (
            <Row key={`discount-${index}`} onRemove={() => setValues((current) => ({ ...current, discounts: current.discounts.filter((_, rowIndex) => rowIndex !== index) }))}>
              <div className="overflow-hidden rounded-md border border-border/60 bg-white">
                <div className="grid grid-cols-[132px_minmax(0,1fr)] border-b border-border/60 text-sm lg:grid-cols-[132px_minmax(0,1fr)_132px_minmax(0,1fr)]">
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Variant Scope</div>
                  <div className="bg-white px-2 py-1.5 lg:border-r lg:border-border/60">
                    <select
                      value={discount.variantClientKey ?? ''}
                      onChange={(event) => setValues((current) => ({ ...current, discounts: current.discounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, variantClientKey: event.target.value || null } : entry) }))}
                      className="h-8 w-full rounded-md border-0 bg-white px-2 text-sm shadow-none outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
                    >
                      <option value="">Product level</option>
                      {values.variants.map((variant) => (
                        <option key={variant.clientKey} value={variant.clientKey}>
                          {variant.variantName || variant.sku || variant.clientKey}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground lg:border-l lg:border-border/60">Discount Type</div>
                  <div className="bg-white px-2 py-1.5">
                    <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" value={discount.discountType} onChange={(event) => setValues((current) => ({ ...current, discounts: current.discounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, discountType: event.target.value } : entry) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-[132px_minmax(0,1fr)] border-b border-border/60 text-sm lg:grid-cols-[132px_minmax(0,1fr)_132px_minmax(0,1fr)]">
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">Start Date</div>
                  <div className="bg-white px-2 py-1.5 lg:border-r lg:border-border/60">
                    <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" type="date" value={discount.startDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, discounts: current.discounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, startDate: event.target.value || null } : entry) }))} />
                  </div>
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground lg:border-l lg:border-border/60">Discount Value</div>
                  <div className="bg-white px-2 py-1.5">
                    <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" type="number" step="0.01" value={discount.discountValue} onChange={(event) => setValues((current) => ({ ...current, discounts: current.discounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, discountValue: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                </div>
                <div className="grid grid-cols-[132px_minmax(0,1fr)] text-sm">
                  <div className="flex items-center border-r border-border/60 bg-muted/30 px-3 py-1.5 font-medium text-muted-foreground">End Date</div>
                  <div className="bg-white px-2 py-1.5">
                    <Input className="h-8 w-full border-0 bg-white px-2 shadow-none focus-visible:ring-0" type="date" value={discount.endDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, discounts: current.discounts.map((entry, rowIndex) => rowIndex === index ? { ...entry, endDate: event.target.value || null } : entry) }))} />
                  </div>
                </div>
              </div>
            </Row>
          ))}
        </Section>
      </>
    ),
  }

  const stockTab: AnimatedContentTab = {
    label: 'Stock',
    value: 'stock',
    content: (
      <>
        <Section title="Opening Stock" description="Keep only starting stock by warehouse and variant scope." addLabel="Add Stock Item" onAdd={() => setValues((current) => ({ ...current, stockItems: [...current.stockItems, emptyStockItem()] }))}>
          <div className="overflow-hidden rounded-md border border-border/60 bg-white">
            <div className="hidden grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_120px_120px_56px] border-b border-border/60 bg-muted/20 text-xs font-semibold uppercase tracking-wide text-muted-foreground lg:grid">
              <div className="px-3 py-2">Variant</div>
              <div className="border-l border-border/60 px-3 py-2">Warehouse</div>
              <div className="border-l border-border/60 px-3 py-2">Qty</div>
              <div className="border-l border-border/60 px-3 py-2">Reserved</div>
              <div className="border-l border-border/60 px-3 py-2 text-center">Action</div>
            </div>
            {values.stockItems.map((item, index) => (
              <div key={`stock-item-${index}`} className="border-b border-border/60 last:border-b-0">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.15fr)_120px_120px_56px]">
                  <div className="border-border/60 bg-white px-2 py-2 lg:border-r">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Variant Scope</Label>
                    <VariantSelect label="Variant Scope" compact value={item.variantClientKey} variants={values.variants} onChange={(value) => setValues((current) => ({ ...current, stockItems: current.stockItems.map((entry, rowIndex) => rowIndex === index ? { ...entry, variantClientKey: value } : entry) }))} />
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Warehouse</Label>
                    <LookupSelect label="Warehouse" compact value={item.warehouseId} options={warehouses} moduleKey="warehouses" onItemsChange={setWarehouses} placeholder="Select warehouse" onChange={(value) => setValues((current) => ({ ...current, stockItems: current.stockItems.map((entry, rowIndex) => rowIndex === index ? { ...entry, warehouseId: value ?? '' } : entry) }))} />
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Quantity</Label>
                    <Input className="h-8 w-full border-input bg-white px-2 lg:border-0 lg:shadow-none lg:focus-visible:ring-0" type="number" step="0.01" value={item.quantity} onChange={(event) => setValues((current) => ({ ...current, stockItems: current.stockItems.map((entry, rowIndex) => rowIndex === index ? { ...entry, quantity: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                  <div className="border-t border-border/60 bg-white px-2 py-2 lg:border-l lg:border-t-0">
                    <Label className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground lg:hidden">Reserved</Label>
                    <Input className="h-8 w-full border-input bg-white px-2 lg:border-0 lg:shadow-none lg:focus-visible:ring-0" type="number" step="0.01" value={item.reservedQuantity} onChange={(event) => setValues((current) => ({ ...current, stockItems: current.stockItems.map((entry, rowIndex) => rowIndex === index ? { ...entry, reservedQuantity: Number(event.target.value || 0) } : entry) }))} />
                  </div>
                  <div className="flex items-center justify-end border-t border-border/60 bg-white px-2 py-2 lg:justify-center lg:border-l lg:border-t-0">
                    <Button type="button" variant="ghost" size="icon" className="size-8" onClick={() => setValues((current) => ({ ...current, stockItems: current.stockItems.filter((_, rowIndex) => rowIndex !== index) }))}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </>
    ),
  }

  const publishingTab: AnimatedContentTab = {
    label: 'Publishing',
    value: 'publishing',
    content: (
      <>
        <Section title="Storefront Publishing" description="Backend merchandising, home placements, and storefront filter metadata.">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="grid gap-2">
              <Label>Department</Label>
              <select
                value={values.storefront?.department ?? 'women'}
                onChange={(event) => setValues((current) => ({
                  ...current,
                  storefront: {
                    ...(current.storefront ?? createDefaultStorefront()),
                    department: event.target.value as NonNullable<ProductFormValues['storefront']>['department'],
                  },
                }))}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {storefrontDepartmentOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label>Catalog Badge</Label>
              <Input value={values.storefront?.catalogBadge ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), catalogBadge: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Shipping Note</Label>
              <Input value={values.storefront?.shippingNote ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), shippingNote: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Fabric</Label>
              <Input value={values.storefront?.fabric ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), fabric: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Fit</Label>
              <Input value={values.storefront?.fit ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), fit: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Sleeve</Label>
              <Input value={values.storefront?.sleeve ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), sleeve: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Occasion</Label>
              <Input value={values.storefront?.occasion ?? ''} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), occasion: event.target.value || null },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Home Slider Order</Label>
              <Input type="number" value={values.storefront?.homeSliderOrder ?? 0} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), homeSliderOrder: Number(event.target.value || 0) },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Promo Slider Order</Label>
              <Input type="number" value={values.storefront?.promoSliderOrder ?? 0} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), promoSliderOrder: Number(event.target.value || 0) },
              }))} />
            </div>
            <div className="grid gap-2">
              <Label>Feature Section Order</Label>
              <Input type="number" value={values.storefront?.featureSectionOrder ?? 0} onChange={(event) => setValues((current) => ({
                ...current,
                storefront: { ...(current.storefront ?? createDefaultStorefront()), featureSectionOrder: Number(event.target.value || 0) },
              }))} />
            </div>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.homeSliderEnabled ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), homeSliderEnabled: Boolean(checked) },
            }))} /><span className="text-sm font-medium">Home slider</span></label>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.promoSliderEnabled ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), promoSliderEnabled: Boolean(checked) },
            }))} /><span className="text-sm font-medium">Promo slider</span></label>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.featureSectionEnabled ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), featureSectionEnabled: Boolean(checked) },
            }))} /><span className="text-sm font-medium">Feature section</span></label>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.isNewArrival ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), isNewArrival: Boolean(checked) },
            }))} /><span className="text-sm font-medium">New arrival</span></label>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.isBestSeller ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), isBestSeller: Boolean(checked) },
            }))} /><span className="text-sm font-medium">Best seller</span></label>
            <label className="flex items-center gap-3 rounded-md border border-border/60 bg-muted/15 px-3 py-2"><Checkbox checked={values.storefront?.isFeaturedLabel ?? false} onCheckedChange={(checked) => setValues((current) => ({
              ...current,
              storefront: { ...(current.storefront ?? createDefaultStorefront()), isFeaturedLabel: Boolean(checked) },
            }))} /><span className="text-sm font-medium">Featured label</span></label>
          </div>
        </Section>
        <Section title="Offers" description="Promotional offers attached to the product." addLabel="Add Offer" onAdd={() => setValues((current) => ({ ...current, offers: [...current.offers, emptyOffer()] }))}>
          {values.offers.map((offer, index) => (
            <Row key={`offer-${index}`} onRemove={() => setValues((current) => ({ ...current, offers: current.offers.filter((_, rowIndex) => rowIndex !== index) }))}>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-2"><Label>Title</Label><Input value={offer.title} onChange={(event) => setValues((current) => ({ ...current, offers: current.offers.map((entry, rowIndex) => rowIndex === index ? { ...entry, title: event.target.value } : entry) }))} /></div>
                <div className="grid gap-2"><Label>Offer Price</Label><Input type="number" step="0.01" value={offer.offerPrice} onChange={(event) => setValues((current) => ({ ...current, offers: current.offers.map((entry, rowIndex) => rowIndex === index ? { ...entry, offerPrice: Number(event.target.value || 0) } : entry) }))} /></div>
                <div className="grid gap-2"><Label>Start Date</Label><Input type="date" value={offer.startDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, offers: current.offers.map((entry, rowIndex) => rowIndex === index ? { ...entry, startDate: event.target.value || null } : entry) }))} /></div>
                <div className="grid gap-2"><Label>End Date</Label><Input type="date" value={offer.endDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, offers: current.offers.map((entry, rowIndex) => rowIndex === index ? { ...entry, endDate: event.target.value || null } : entry) }))} /></div>
                <div className="grid gap-2 md:col-span-2"><Label>Description</Label><Textarea rows={3} value={offer.description ?? ''} onChange={(event) => setValues((current) => ({ ...current, offers: current.offers.map((entry, rowIndex) => rowIndex === index ? { ...entry, description: event.target.value || null } : entry) }))} /></div>
              </div>
            </Row>
          ))}
        </Section>
        <Section title="SEO and Tags" description="Search metadata and tag assignments for discoverability." addLabel="Add Tag" onAdd={() => setValues((current) => ({ ...current, tags: [...current.tags, emptyTag()] }))}>
          <div className="grid gap-3 md:grid-cols-4">
            <div className="grid gap-2"><Label>Meta Title</Label><Input value={values.seo?.metaTitle ?? ''} onChange={(event) => setValues((current) => ({ ...current, seo: { metaTitle: event.target.value || null, metaDescription: current.seo?.metaDescription ?? null, metaKeywords: current.seo?.metaKeywords ?? null } }))} /></div>
            <div className="grid gap-2"><Label>Meta Keywords</Label><Input value={values.seo?.metaKeywords ?? ''} onChange={(event) => setValues((current) => ({ ...current, seo: { metaTitle: current.seo?.metaTitle ?? null, metaDescription: current.seo?.metaDescription ?? null, metaKeywords: event.target.value || null } }))} /></div>
            <div className="grid gap-2 md:col-span-2"><Label>Meta Description</Label><Textarea rows={3} value={values.seo?.metaDescription ?? ''} onChange={(event) => setValues((current) => ({ ...current, seo: { metaTitle: current.seo?.metaTitle ?? null, metaDescription: event.target.value || null, metaKeywords: current.seo?.metaKeywords ?? null } }))} /></div>
          </div>
          {values.tags.map((tag, index) => (
            <Row key={`tag-${index}`} onRemove={() => setValues((current) => ({ ...current, tags: current.tags.filter((_, rowIndex) => rowIndex !== index) }))}>
              <div className="grid gap-2"><Label>Tag</Label><Input value={tag.name} onChange={(event) => setValues((current) => ({ ...current, tags: current.tags.map((entry, rowIndex) => rowIndex === index ? { ...entry, name: event.target.value } : entry) }))} /></div>
            </Row>
          ))}
        </Section>
        <Section title="Reviews" description="Seed or maintain review records stored against this product." addLabel="Add Review" onAdd={() => setValues((current) => ({ ...current, reviews: [...current.reviews, emptyReview()] }))}>
          {values.reviews.map((review, index) => (
            <Row key={`review-${index}`} onRemove={() => setValues((current) => ({ ...current, reviews: current.reviews.filter((_, rowIndex) => rowIndex !== index) }))}>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-2"><Label>User ID</Label><Input value={review.userId ?? ''} onChange={(event) => setValues((current) => ({ ...current, reviews: current.reviews.map((entry, rowIndex) => rowIndex === index ? { ...entry, userId: event.target.value || null } : entry) }))} /></div>
                <div className="grid gap-2"><Label>Rating</Label><Input type="number" min="1" max="5" value={review.rating} onChange={(event) => setValues((current) => ({ ...current, reviews: current.reviews.map((entry, rowIndex) => rowIndex === index ? { ...entry, rating: Number(event.target.value || 5) } : entry) }))} /></div>
                <div className="grid gap-2"><Label>Review Time</Label><Input type="datetime-local" value={review.reviewDate ?? ''} onChange={(event) => setValues((current) => ({ ...current, reviews: current.reviews.map((entry, rowIndex) => rowIndex === index ? { ...entry, reviewDate: event.target.value || null } : entry) }))} /></div>
                <div className="grid gap-2 md:col-span-3"><Label>Review</Label><Textarea rows={3} value={review.review ?? ''} onChange={(event) => setValues((current) => ({ ...current, reviews: current.reviews.map((entry, rowIndex) => rowIndex === index ? { ...entry, review: event.target.value || null } : entry) }))} /></div>
              </div>
            </Row>
          ))}
        </Section>
      </>
    ),
  }

  const tasksTab: AnimatedContentTab = {
    label: 'Tasks',
    value: 'tasks',
    content: !isEditMode ? (
      <Card className="rounded-md border-border/70 shadow-none">
        <CardContent className="p-4 text-sm text-muted-foreground">Save the product first to start assigning verification tasks.</CardContent>
      </Card>
    ) : (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Assign Product Task</CardTitle>
            <CardDescription>Create a checklist-driven verification task for this product.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label>Task Template</Label>
              <AutocompleteLookup
                value={selectedTaskTemplateId}
                onChange={setSelectedTaskTemplateId}
                options={taskTemplates.map((template) => ({ value: template.id, label: template.name }))}
                placeholder="Select product task template"
              />
            </div>
            <div className="grid gap-2">
              <Label>Assign To</Label>
              <AutocompleteLookup
                value={selectedTaskAssigneeId}
                onChange={setSelectedTaskAssigneeId}
                options={taskUsers.map((user) => ({ value: user.id, label: user.name }))}
                placeholder="Select staff user"
                allowEmptyOption
                emptyOptionLabel="Unassigned"
              />
              {session?.user.id ? (
                <div className="flex justify-start">
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTaskAssigneeId(session.user.id)}>
                    My Self
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={selectedTaskDueDate} onChange={(event) => setSelectedTaskDueDate(event.target.value)} />
            </div>
            <Button type="button" onClick={() => { void handleCreateProductTask() }} disabled={creatingProductTask || !selectedTaskTemplateId}>
              {creatingProductTask ? 'Creating task...' : 'Create Product Task'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-md border-border/70 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle>Linked Tasks</CardTitle>
            <CardDescription>Tasks created specifically for this product verification and follow-through.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {productTasks.length === 0 ? (
              <div className="rounded-md border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">No product-linked tasks yet.</div>
            ) : productTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className="rounded-md border border-border/60 bg-background p-4 text-left transition-colors hover:bg-muted/10"
                onClick={() => { void navigate(`/admin/dashboard/task/tasks/${task.id}`) }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{task.templateName ?? 'Linked task'}</p>
                    <p className="font-medium text-foreground">{task.title}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">{task.description ?? 'No description added.'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge tone={task.status === 'finalized' ? 'active' : task.status === 'review' ? 'featured' : task.status === 'in_progress' ? 'publishing' : 'manual'}>
                      {task.status.replace('_', ' ')}
                    </StatusBadge>
                    <StatusBadge tone={task.priority === 'urgent' ? 'active' : task.priority === 'high' ? 'featured' : task.priority === 'medium' ? 'publishing' : 'manual'}>
                      {task.priority}
                    </StatusBadge>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 pt-3 text-sm text-muted-foreground">
                  <span>Assignee <span className="font-medium text-foreground">{task.assigneeName ?? 'Unassigned'}</span></span>
                  <span>Checklist <span className="font-medium text-foreground">{task.checklistCompletionCount}/{task.checklistTotalCount}</span></span>
                  <span>Due <span className="font-medium text-foreground">{formatTaskDate(task.dueDate)}</span></span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>
    ),
  }

  const productTabs = [overviewTab, settingsTab, contentTab, attributesTab, variantsTab, pricingTab, stockTab, publishingTab, tasksTab]

  if (loading) {
    return <Card><CardContent className="p-8 text-sm text-muted-foreground">Loading product...</CardContent></Card>
  }

  return (
    <form className="space-y-4 pt-1" onSubmit={(event) => { void handleSubmit(event) }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="-ml-3 mb-2">
            <Link to="/admin/dashboard/products">
              <ArrowLeft className="size-4" />
              Back to products
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Capture product identity, variants, pricing, stock, SEO, and catalog presentation.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" onClick={() => { void navigate('/admin/dashboard/products') }}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</Button>
        </div>
      </div>

      {errorMessage ? (
        <Card className={`${warningCardClassName} rounded-md`}>
          <CardContent className="rounded-md p-3 text-sm">
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

      <AnimatedTabs defaultTabValue="overview" tabs={productTabs} />
      <Dialog open={Boolean(previewImageUrl)} onOpenChange={(open) => { if (!open) setPreviewImageUrl(null) }}>
        <DialogContent className="w-[min(92vw,42rem)] max-w-2xl overflow-hidden border border-border/70 bg-background p-0">
          {previewImageUrl ? (
            <div className="bg-muted/20 p-4">
              <div className="overflow-hidden rounded-[1.2rem] border border-border/70 bg-background">
                <img src={previewImageUrl} alt="Product preview" className="h-[24rem] w-full object-contain" loading="lazy" decoding="async" />
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </form>
  )
}
