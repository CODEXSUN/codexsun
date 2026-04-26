import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, BoxesIcon, SparklesIcon, StarIcon, Trash2Icon } from "lucide-react"

import type {
  CommonModuleItem,
  ProductResponse,
  ProductSeoFieldKey,
  ProductSeoGenerateResponse,
  ProductSlugGenerateResponse,
} from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"
import { invalidateStorefrontShellData } from "@ecommerce/web/src/hooks/use-storefront-shell-data"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useGlobalLoading } from "@/features/dashboard/loading/global-loading-provider"
import { AnimatedTabs, type AnimatedContentTab } from "@/registry/concerns/navigation/animated-tabs"

import {
  buildVariantMatrix,
  calculatePricingFromPurchase,
  createDefaultProductFormValues,
  createEmptyProductAttribute,
  createEmptyProductAttributeValue,
  createEmptyProductImage,
  createEmptyProductPrice,
  createEmptyProductTag,
  createEmptyProductVariant,
  createEmptyProductVariantAttribute,
  toProductFormValues,
  toProductUpsertPayload,
  type ProductFormValues,
  type ProductLookupModuleKey,
} from "./product-form-state"
import {
  ProductCheckboxField,
  ProductCollectionRow,
  ProductField,
  ProductFormMessage,
  ProductFormSectionCard,
  ProductLookupField,
  ProductStatusField,
  ProductTextField,
} from "./product-form-sections"

type LookupState = Record<ProductLookupModuleKey, CommonModuleItem[]>
type ProductFieldErrors = Record<string, string>
type ProductPricingDraft = {
  purchase: number
  sellPercent: number
  mrpPercent: number
}

const lookupModules: ProductLookupModuleKey[] = [
  "brands",
  "productCategories",
  "productGroups",
  "productTypes",
  "units",
  "hsnCodes",
  "taxes",
  "styles",
]

const storefrontProductImageHelperText =
  "For clear storefront product display, upload at least 1200 x 1500 px in a 4:5 ratio."

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const accessToken = getStoredAccessToken()
  const response = await fetch(path, {
    ...init,
    headers: accessToken
      ? {
          "content-type": "application/json",
          authorization: `Bearer ${accessToken}`,
          ...(init?.headers ?? {}),
        }
      : { "content-type": "application/json", ...(init?.headers ?? {}) },
  })

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string; message?: string }
      | null
    throw new Error(payload?.error ?? payload?.message ?? `Request failed with status ${response.status}.`)
  }

  return (await response.json()) as T
}

function LoadingCard({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="p-5 text-sm text-muted-foreground">{message}</CardContent>
    </Card>
  )
}

function updateCollectionItem<T>(items: T[], index: number, recipe: (item: T) => T) {
  return items.map((item, itemIndex) => (itemIndex === index ? recipe(item) : item))
}

function getCommonModulePrimaryText(item: CommonModuleItem | null | undefined) {
  return (
    [item?.name, item?.title, item?.code]
      .find((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
      ?.trim() ?? ""
  )
}

function buildInlineCommonModuleCode(value: string) {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return normalized.length > 0 ? normalized.slice(0, 20) : "NEW"
}

function formatPricingPreview(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "0.00"
}

function getNextCommonModulePosition(items: CommonModuleItem[]) {
  return items.reduce((maxValue, item) => {
    const currentValue =
      typeof item.position_order === "number"
        ? item.position_order
        : Number(item.position_order ?? 0)

    return Number.isFinite(currentValue) ? Math.max(maxValue, currentValue) : maxValue
  }, 0) + 1
}

async function createLookupItemWithPayload(
  path: string,
  payload: Record<string, string | number | boolean | null>
) {
  return requestJson<{ item: CommonModuleItem }>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

function VariantScopeField({
  label,
  value,
  variants,
  onChange,
}: {
  label: string
  value: string | null
  variants: ProductFormValues["variants"]
  onChange: (value: string | null) => void
}) {
  return (
    <ProductField label={label}>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20"
      >
        <option value="">Product level</option>
        {variants.map((variant) => (
          <option key={variant.clientKey} value={variant.clientKey}>
            {variant.variantName || variant.sku || variant.clientKey}
          </option>
        ))}
      </select>
    </ProductField>
  )
}

export function ProductUpsertSection({
  productId,
  routeBase = "/dashboard/apps/core/products",
}: {
  productId?: string
  routeBase?: string
}) {
  const navigate = useNavigate()
  const isEditing = Boolean(productId)
  const [form, setForm] = useState<ProductFormValues>(createDefaultProductFormValues())
  const [pricingDraft, setPricingDraft] = useState<ProductPricingDraft>({
    purchase: 0,
    sellPercent: 50,
    mrpPercent: 75,
  })
  const [lookupState, setLookupState] = useState<LookupState>({
    brands: [],
    productCategories: [],
    productGroups: [],
    productTypes: [],
    units: [],
    hsnCodes: [],
    taxes: [],
    styles: [],
    warehouses: [],
  })
  const [isLoading, setIsLoading] = useState(isEditing)
  const [isSaving, setIsSaving] = useState(false)
  const [isSlugGenerating, setIsSlugGenerating] = useState(false)
  const [activeSeoField, setActiveSeoField] = useState<ProductSeoFieldKey | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)

  const resolvedProductLabel = useMemo(() => {
    const name = form.name.trim()
    const code = form.code.trim()

    if (isEditing && name && code) {
      return `${name} -: ${code}`
    }

    return isEditing ? "Update Product" : "Create Product"
  }, [form.code, form.name, isEditing])

  async function handleGenerateSlug() {
    if (form.name.trim().length === 0) {
      setFormError("Enter a product name before generating a slug.")
      return
    }

    setIsSlugGenerating(true)

    try {
      const response = await requestJson<ProductSlugGenerateResponse>(
        "/internal/v1/core/products/generate-slug",
        {
          method: "POST",
          body: JSON.stringify({ text: form.name }),
        }
      )

      setForm((current) => ({
        ...current,
        slug: response.slug,
      }))
      setFormError((current) =>
        current === "Enter a product name before generating a slug." ? null : current
      )
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to generate slug.")
    } finally {
      setIsSlugGenerating(false)
    }
  }

  async function handleGenerateSeoField(field: ProductSeoFieldKey) {
    if (form.name.trim().length === 0) {
      setFormError("Enter a product name before generating SEO fields.")
      return
    }

    setActiveSeoField(field)

    try {
      const response = await requestJson<ProductSeoGenerateResponse>(
        "/internal/v1/core/products/generate-seo-field",
        {
          method: "POST",
          body: JSON.stringify({
            field,
            name: form.name,
            description: form.description,
            shortDescription: form.shortDescription,
            brandName: form.brandName,
            categoryName: form.categoryName,
            productGroupName: form.productGroupName,
            tagNames: form.tags.map((tag) => tag.name).filter(Boolean),
          }),
        }
      )

      setForm((current) => ({
        ...current,
        seo: {
          ...(current.seo ?? createDefaultProductFormValues().seo!),
          [response.field]: response.value,
        },
      }))
      setFormError((current) =>
        current === "Enter a product name before generating SEO fields." ? null : current
      )
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to generate SEO field.")
    } finally {
      setActiveSeoField(null)
    }
  }

  function handleGenerateItemBadgeFromStyle() {
    const selectedStyle = lookupState.styles.find((item) => item.id === form.styleId)
    const styleLabel = getCommonModulePrimaryText(selectedStyle)

    if (styleLabel.length === 0) {
      setFormError("Select a style before generating an item badge.")
      return
    }

    setForm((current) => ({
      ...current,
      storefront: {
        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
        catalogBadge: styleLabel,
      },
    }))
    setFormError((current) =>
      current === "Select a style before generating an item badge." ? null : current
    )
  }

  async function createProductGroupLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.productGroups.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await requestJson<{ item: CommonModuleItem; module: "productGroups" }>(
      "/internal/v1/core/common-modules/items?module=productGroups",
      {
        method: "POST",
        body: JSON.stringify({
          code: buildInlineCommonModuleCode(normalizedQuery),
          name: normalizedQuery,
          description: "-",
          isActive: true,
        }),
      }
    )

    setLookupState((current) => ({
      ...current,
      productGroups: [...current.productGroups, response.item],
    }))

    return response.item
  }

  async function createProductCategoryLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.productCategories.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await requestJson<{ item: CommonModuleItem; module: "productCategories" }>(
      "/internal/v1/core/common-modules/items?module=productCategories",
      {
        method: "POST",
        body: JSON.stringify({
          code: buildInlineCommonModuleCode(normalizedQuery),
          name: normalizedQuery,
          description: "-",
          image: null,
          position_order: getNextCommonModulePosition(lookupState.productCategories),
          show_on_storefront_top_menu: false,
          show_on_storefront_catalog: true,
          isActive: true,
        }),
      }
    )

    setLookupState((current) => ({
      ...current,
      productCategories: [...current.productCategories, response.item],
    }))

    return response.item
  }

  async function createBrandLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.brands.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=brands",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        description: "-",
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      brands: [...current.brands, response.item],
    }))

    return response.item
  }

  async function createProductTypeLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.productTypes.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=productTypes",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        description: "-",
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      productTypes: [...current.productTypes, response.item],
    }))

    return response.item
  }

  async function createUnitLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.units.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=units",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        symbol: null,
        description: "-",
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      units: [...current.units, response.item],
    }))

    return response.item
  }

  async function createHsnCodeLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.hsnCodes.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=hsnCodes",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        description: normalizedQuery,
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      hsnCodes: [...current.hsnCodes, response.item],
    }))

    return response.item
  }

  async function createTaxLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.taxes.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=taxes",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        tax_type: "gst",
        rate_percent: 0,
        description: "-",
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      taxes: [...current.taxes, response.item],
    }))

    return response.item
  }

  async function createStyleLookupItem(query: string) {
    const normalizedQuery = query.trim()
    if (!normalizedQuery) {
      return null
    }

    const existingItem = lookupState.styles.find(
      (item) => getCommonModulePrimaryText(item).toLowerCase() === normalizedQuery.toLowerCase()
    )

    if (existingItem) {
      return existingItem
    }

    const response = await createLookupItemWithPayload(
      "/internal/v1/core/common-modules/items?module=styles",
      {
        code: buildInlineCommonModuleCode(normalizedQuery),
        name: normalizedQuery,
        description: "-",
        isActive: true,
      }
    )

    setLookupState((current) => ({
      ...current,
      styles: [...current.styles, response.item],
    }))

    return response.item
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsLoading(true)
      try {
        const lookupEntries = await Promise.all(
          lookupModules.map(async (moduleKey) => {
            const response = await requestJson<{ items: CommonModuleItem[] }>(
              `/internal/v1/core/common-modules/items?module=${moduleKey}`
            )
            return [moduleKey, response.items] as const
          })
        )

        if (cancelled) return
        setLookupState(Object.fromEntries(lookupEntries) as LookupState)

        if (!productId) {
          setIsLoading(false)
          return
        }

        const product = await requestJson<ProductResponse>(
          `/internal/v1/core/product?id=${encodeURIComponent(productId)}`
        )

        if (!cancelled) {
          setForm(toProductFormValues(product.item))
          setPricingDraft((current) => ({
            ...current,
            purchase: product.item.costPrice,
          }))
          setIsLoading(false)
        }
      } catch (error) {
        if (!cancelled) {
          setFormError(error instanceof Error ? error.message : "Failed to load product.")
          setIsLoading(false)
        }
      }
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [productId])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    document.title = `${resolvedProductLabel} | Codexsun`
  }, [resolvedProductLabel])

  function handleApplyPricingFormula() {
    setForm((current) => {
      const formulaSettings = {
        purchaseToSellPercent: pricingDraft.sellPercent,
        purchaseToMrpPercent: pricingDraft.mrpPercent,
      }
      const productPurchase =
        pricingDraft.purchase > 0 ? pricingDraft.purchase : current.costPrice
      const productFormula = calculatePricingFromPurchase(productPurchase, formulaSettings)
      const nextPrices = [...current.prices]

      const upsertPriceRow = (
        variantClientKey: string | null,
        purchasePrice: number
      ) => {
        const formula = calculatePricingFromPurchase(purchasePrice, formulaSettings)
        const rowIndex = nextPrices.findIndex(
          (entry) => (entry.variantClientKey ?? null) === variantClientKey
        )
        const nextRow = {
          variantClientKey,
          costPrice: formula.purchasePrice,
          sellingPrice: formula.sellingPrice,
          mrp: formula.mrp,
          isActive: true,
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

      upsertPriceRow(null, productFormula.purchasePrice)

      const nextVariants = current.variants.map((variant) => {
        const scopedRow = current.prices.find(
          (entry) => entry.variantClientKey === variant.clientKey
        )
        const variantPurchase =
          scopedRow && scopedRow.costPrice > 0
            ? scopedRow.costPrice
            : variant.costPrice > 0
              ? variant.costPrice
              : productFormula.purchasePrice
        const variantFormula = calculatePricingFromPurchase(
          variantPurchase,
          formulaSettings
        )

        upsertPriceRow(variant.clientKey, variantFormula.purchasePrice)

        return {
          ...variant,
          costPrice: variantFormula.purchasePrice,
          price: variantFormula.sellingPrice,
        }
      })

      return {
        ...current,
        basePrice: productFormula.sellingPrice,
        costPrice: productFormula.purchasePrice,
        variants: nextVariants,
        prices: nextPrices,
      }
    })
  }

  const tabs = useMemo<AnimatedContentTab[]>(
    () => [
      {
        label: "Details",
        value: "details",
        content: (
          <ProductFormSectionCard>
            <div className="grid gap-4 md:grid-cols-2">
              <ProductField label="Product Name" error={fieldErrors.name}>
                <ProductTextField
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
              </ProductField>
              <ProductField label="Product Code">
                <ProductTextField
                  value={form.code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))
                  }
                />
              </ProductField>
              <ProductField label="SKU" error={fieldErrors.sku}>
                <ProductTextField
                  value={form.sku}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sku: event.target.value.toUpperCase() }))
                  }
                />
              </ProductField>
              <ProductField
                label={
                  <div className="flex items-center justify-between gap-2">
                    <span>Slug</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => void handleGenerateSlug()}
                      disabled={isSlugGenerating}
                      title="Generate slug from product name"
                      aria-label="Generate slug from product name"
                    >
                      <SparklesIcon className="size-3.5" />
                    </Button>
                  </div>
                }
              >
                <ProductTextField
                  value={form.slug}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, slug: event.target.value }))
                  }
                />
              </ProductField>
              <ProductLookupField
                label="Product Group"
                items={lookupState.productGroups}
                value={form.productGroupId ?? ""}
                onValueChange={(value) => {
                  const selectedGroup = lookupState.productGroups.find((item) => item.id === value)
                  const selectedGroupName = getCommonModulePrimaryText(selectedGroup)

                  setForm((current) => ({
                    ...current,
                    productGroupId: value || null,
                    productGroupName: selectedGroupName,
                  }))
                }}
                onCreateNew={(query) => {
                  void createProductGroupLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      productGroupId: item.id,
                      productGroupName: getCommonModulePrimaryText(item),
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Category"
                items={lookupState.productCategories}
                value={form.categoryId ?? ""}
                onValueChange={(value) => {
                  const selectedCategory = lookupState.productCategories.find(
                    (item) => item.id === value
                  )
                  const selectedCategoryName = getCommonModulePrimaryText(selectedCategory)

                  setForm((current) => ({
                    ...current,
                    categoryId: value || null,
                    categoryName: selectedCategoryName,
                  }))
                }}
                onCreateNew={(query) => {
                  void createProductCategoryLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      categoryId: item.id,
                      categoryName: getCommonModulePrimaryText(item),
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Brand"
                items={lookupState.brands}
                value={form.brandId ?? ""}
                onValueChange={(value) => {
                  const selectedBrand = lookupState.brands.find((item) => item.id === value)
                  const selectedBrandName = getCommonModulePrimaryText(selectedBrand)

                  setForm((current) => ({
                    ...current,
                    brandId: value || null,
                    brandName: selectedBrandName,
                  }))
                }}
                onCreateNew={(query) => {
                  void createBrandLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      brandId: item.id,
                      brandName: getCommonModulePrimaryText(item),
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Product Type"
                items={lookupState.productTypes}
                value={form.productTypeId ?? ""}
                onValueChange={(value) => {
                  const selectedProductType = lookupState.productTypes.find(
                    (item) => item.id === value
                  )
                  const selectedProductTypeName = getCommonModulePrimaryText(selectedProductType)

                  setForm((current) => ({
                    ...current,
                    productTypeId: value || null,
                    productTypeName: selectedProductTypeName,
                  }))
                }}
                onCreateNew={(query) => {
                  void createProductTypeLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      productTypeId: item.id,
                      productTypeName: getCommonModulePrimaryText(item),
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Unit"
                items={lookupState.units}
                value={form.unitId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, unitId: value || null }))
                }
                onCreateNew={(query) => {
                  void createUnitLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      unitId: item.id,
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="HSN Code"
                items={lookupState.hsnCodes}
                value={form.hsnCodeId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, hsnCodeId: value || null }))
                }
                onCreateNew={(query) => {
                  void createHsnCodeLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      hsnCodeId: item.id,
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Tax"
                items={lookupState.taxes}
                value={form.taxId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, taxId: value || null }))
                }
                onCreateNew={(query) => {
                  void createTaxLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      taxId: item.id,
                    }))
                  })
                }}
              />
              <ProductLookupField
                label="Style"
                items={lookupState.styles}
                value={form.styleId ?? ""}
                onValueChange={(value) => {
                  const selectedStyle = lookupState.styles.find((item) => item.id === value)
                  const selectedStyleName = getCommonModulePrimaryText(selectedStyle)

                  setForm((current) => ({
                    ...current,
                    styleId: value || null,
                    storefrontDepartment: selectedStyleName || null,
                    storefront: {
                      ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                      department: selectedStyleName || null,
                    },
                  }))
                }}
                onCreateNew={(query) => {
                  void createStyleLookupItem(query).then((item) => {
                    if (!item) {
                      return
                    }

                    setForm((current) => ({
                      ...current,
                      styleId: item.id,
                      storefrontDepartment: getCommonModulePrimaryText(item) || null,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        department: getCommonModulePrimaryText(item) || null,
                      },
                    }))
                  })
                }}
              />
              <ProductCheckboxField
                checked={form.hasVariants}
                label="This product has variants"
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, hasVariants: checked }))
                }
              />
              <ProductCheckboxField
                checked={form.isFeatured}
                label="Featured product"
                onCheckedChange={(checked) =>
                  setForm((current) => ({ ...current, isFeatured: checked }))
                }
              />
              <div className="md:col-span-2">
                <ProductStatusField
                  id="product-status"
                  checked={form.isActive}
                  onCheckedChange={(checked) =>
                    setForm((current) => ({ ...current, isActive: checked }))
                  }
                />
              </div>
            </div>
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Attributes",
        value: "attributes",
        content: (
          <ProductFormSectionCard
            title="Attributes"
            description="Keep option groups simple and generate variants from the captured values."
            onAdd={() =>
              setForm((current) => ({
                ...current,
                attributes: [...current.attributes, createEmptyProductAttribute()],
              }))
            }
          >
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((current) => {
                    const variants = buildVariantMatrix(current)

                    return {
                      ...current,
                      hasVariants: true,
                      variants,
                      prices: current.prices.map((entry) =>
                        entry.variantClientKey == null
                          ? entry
                          : { ...entry, variantClientKey: null }
                      ),
                    }
                  })
                }
              >
                <BoxesIcon className="size-4" />
                Set Variants
              </Button>
            </div>
            {form.attributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attributes added yet.</p>
            ) : null}
            {form.attributes.map((attribute, index) => (
              <ProductCollectionRow
                key={attribute.clientKey}
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    attributes: current.attributes.filter(
                      (entry) => entry.clientKey !== attribute.clientKey
                    ),
                    attributeValues: current.attributeValues.filter(
                      (entry) => entry.attributeClientKey !== attribute.clientKey
                    ),
                  }))
                }
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                  <ProductField
                    label={`Attribute ${index + 1}`}
                    description="Add attribute as COLOUR, SIZE, PACKING and value as Red, S, Gift."
                  >
                    <ProductTextField
                      value={attribute.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          attributes: updateCollectionItem(current.attributes, index, (item) => ({
                            ...item,
                            name: event.target.value,
                          })),
                        }))
                      }
                    />
                  </ProductField>
                  <div className="space-y-3">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            attributeValues: [
                              ...current.attributeValues,
                              createEmptyProductAttributeValue(attribute.clientKey),
                            ],
                          }))
                        }
                      >
                        Add Value
                      </Button>
                    </div>
                    {form.attributeValues
                      .filter((entry) => entry.attributeClientKey === attribute.clientKey)
                      .map((value) => (
                        <div
                          key={value.clientKey}
                          className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 md:grid-cols-[minmax(0,1fr)_auto]"
                        >
                          <ProductTextField
                            value={value.value}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                attributeValues: current.attributeValues.map((entry) =>
                                  entry.clientKey === value.clientKey
                                    ? { ...entry, value: event.target.value }
                                    : entry
                                ),
                              }))
                            }
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setForm((current) => ({
                                ...current,
                                attributeValues: current.attributeValues.filter(
                                  (entry) => entry.clientKey !== value.clientKey
                                ),
                              }))
                            }
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              </ProductCollectionRow>
            ))}
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Variants",
        value: "variants",
        content: (
          <ProductFormSectionCard
            title="Variants"
            description="Variant identity is generated from attribute values and can be refined per row."
            onAdd={() =>
              setForm((current) => ({
                ...current,
                hasVariants: true,
                variants: [...current.variants, createEmptyProductVariant()],
              }))
            }
          >
            {form.variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No variants generated yet. Add attributes and values, then use Set Variants.
              </p>
            ) : null}
            {form.variants.map((variant, index) => (
              <ProductCollectionRow
                key={variant.clientKey}
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    variants: current.variants.filter(
                      (entry) => entry.clientKey !== variant.clientKey
                    ),
                    prices: current.prices.map((entry) =>
                      entry.variantClientKey === variant.clientKey
                        ? { ...entry, variantClientKey: null }
                        : entry
                    ),
                  }))
                }
              >
                <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                  <div className="grid gap-4 md:grid-cols-2">
                    <ProductField label="Variant Name">
                      <ProductTextField
                        value={variant.variantName}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              variantName: event.target.value,
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="Variant SKU">
                      <ProductTextField
                        value={variant.sku}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              sku: event.target.value.toUpperCase(),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="Selling Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.price}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              price: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="Purchase Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.costPrice}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              costPrice: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <div className="md:col-span-2">
                      <ProductCheckboxField
                        checked={variant.isActive}
                        label="Active variant"
                        onCheckedChange={(checked) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              isActive: checked,
                            })),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <ProductFormSectionCard
                      title="Variant Attributes"
                      description="Keep option attributes and any extra variant-specific details together."
                      onAdd={() =>
                        setForm((current) => ({
                          ...current,
                          variants: updateCollectionItem(current.variants, index, (item) => ({
                            ...item,
                            attributes: [...item.attributes, createEmptyProductVariantAttribute()],
                          })),
                        }))
                      }
                    >
                      {variant.attributes.map((attribute, attributeIndex) => (
                        <div
                          key={`${variant.clientKey}-${attributeIndex}`}
                          className="grid gap-3 rounded-xl border border-border/70 bg-background/70 p-3 md:grid-cols-2"
                        >
                          <ProductTextField
                            placeholder="Weight"
                            value={attribute.attributeName}
                            onChange={(event) =>
                              setForm((current) => ({
                                ...current,
                                variants: updateCollectionItem(current.variants, index, (item) => ({
                                  ...item,
                                  attributes: updateCollectionItem(
                                    item.attributes,
                                    attributeIndex,
                                    (entry) => ({
                                      ...entry,
                                      attributeName: event.target.value,
                                    })
                                  ),
                                })),
                              }))
                            }
                          />
                          <div className="flex gap-2">
                            <ProductTextField
                              placeholder="12"
                              value={attribute.attributeValue}
                              onChange={(event) =>
                                setForm((current) => ({
                                  ...current,
                                  variants: updateCollectionItem(current.variants, index, (item) => ({
                                    ...item,
                                    attributes: updateCollectionItem(
                                      item.attributes,
                                      attributeIndex,
                                      (entry) => ({
                                        ...entry,
                                        attributeValue: event.target.value,
                                      })
                                    ),
                                  })),
                                }))
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  variants: updateCollectionItem(current.variants, index, (item) => ({
                                    ...item,
                                    attributes: item.attributes.filter(
                                      (_, nestedIndex) => nestedIndex !== attributeIndex
                                    ),
                                  })),
                                }))
                              }
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ProductFormSectionCard>
                    <ProductFormSectionCard
                      title="Variant Images"
                      description="Attach variant-specific images when the base gallery is not enough."
                    >
                      <div className="grid gap-4 md:grid-cols-3">
                        {variant.images.map((image, imageIndex) => (
                          <FrameworkMediaPickerField
                            key={`${variant.clientKey}-image-${imageIndex}`}
                            value={image.imageUrl}
                            previewAlt={`${variant.variantName || form.name || "Variant"} image ${imageIndex + 1}`}
                            clearLabel="Clear"
                            helperText={storefrontProductImageHelperText}
                            onChange={(value) =>
                              setForm((current) => ({
                                ...current,
                                variants: updateCollectionItem(current.variants, index, (item) => ({
                                  ...item,
                                  images: updateCollectionItem(item.images, imageIndex, (entry) => ({
                                    ...entry,
                                    imageUrl: value,
                                  })),
                                })),
                              }))
                            }
                          />
                        ))}
                      </div>
                    </ProductFormSectionCard>
                  </div>
                </div>
              </ProductCollectionRow>
            ))}
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Content",
        value: "content",
        content: (
          <ProductFormSectionCard
            title="Content"
            description="Short and long descriptions used across internal and storefront product surfaces."
          >
            <div className="grid gap-4">
              <ProductField label="Short Description">
                <Textarea
                  rows={3}
                  value={form.shortDescription}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, shortDescription: event.target.value }))
                  }
                />
              </ProductField>
              <ProductField label="Description">
                <Textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                />
              </ProductField>
            </div>
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Media",
        value: "media",
        content: (
          <ProductFormSectionCard
            title="Product Images"
            onAdd={() =>
              setForm((current) => ({
                ...current,
                images: [
                  ...current.images,
                  createEmptyProductImage(
                    Math.max(0, ...current.images.map((item) => item.sortOrder || 0)) + 1
                  ),
                ],
              }))
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {form.images.map((image, index) => (
                <FrameworkMediaPickerField
                  key={`image-${index}`}
                  value={image.imageUrl}
                  previewAlt={`${form.name || "Product"} image ${index + 1}`}
                  clearLabel="Clear"
                  helperText={storefrontProductImageHelperText}
                  orderValue={image.sortOrder}
                  orderLabel="Order"
                  onOrderChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      images: updateCollectionItem(current.images, index, (item) => ({
                        ...item,
                        sortOrder: Math.max(1, Number(value || 1)),
                      })),
                    }))
                  }
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      images: updateCollectionItem(current.images, index, (item) => ({
                        ...item,
                        imageUrl: value,
                      })),
                    }))
                  }
                  footer={
                    <div className="grid grid-cols-2 gap-1.5">
                      <Button
                        type="button"
                        variant={image.isPrimary ? "default" : "outline"}
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            images: current.images.map((item, itemIndex) => ({
                              ...item,
                              isPrimary: itemIndex === index,
                            })),
                          }))
                        }
                      >
                        <StarIcon
                          className="size-4"
                          fill={image.isPrimary ? "currentColor" : "none"}
                        />
                        {image.isPrimary ? "Primary" : "Make Primary"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() =>
                          setForm((current) => ({
                            ...current,
                            images: current.images.filter((_, itemIndex) => itemIndex !== index),
                          }))
                        }
                      >
                        <Trash2Icon className="size-4" />
                        Remove
                      </Button>
                    </div>
                  }
                />
              ))}
            </div>
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Pricing",
        value: "pricing",
        content: (
          <div className="space-y-5">
            <ProductFormSectionCard
              title="Base Pricing"
              description="Primary product selling and purchase price before variant-level overrides."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ProductField label="Selling Price">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.basePrice}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        basePrice: Number(event.target.value || 0),
                      }))
                    }
                  />
                </ProductField>
                <ProductField label="Purchase Price">
                  <Input
                    type="number"
                    step="0.01"
                    value={form.costPrice}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        costPrice: Number(event.target.value || 0),
                      }))
                    }
                  />
                </ProductField>
              </div>
            </ProductFormSectionCard>
            <ProductFormSectionCard
              title="Apply Pricing"
              description="Use the base purchase price with editable selling and MRP percentages to calculate product and variant pricing together."
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <ProductField label="Selling %">
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingDraft.sellPercent}
                    onChange={(event) =>
                      setPricingDraft((current) => ({
                        ...current,
                        sellPercent: Number(event.target.value || 0),
                      }))
                    }
                  />
                </ProductField>
                <ProductField label="MRP %">
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingDraft.mrpPercent}
                    onChange={(event) =>
                      setPricingDraft((current) => ({
                        ...current,
                        mrpPercent: Number(event.target.value || 0),
                      }))
                    }
                  />
                </ProductField>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="w-full md:w-auto"
                    onClick={() => handleApplyPricingFormula()}
                  >
                    Calculate
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                Base purchase {formatPricingPreview(form.costPrice)} with {pricingDraft.sellPercent}% selling and{" "}
                {pricingDraft.mrpPercent}% MRP gives{" "}
                {
                  formatPricingPreview(
                    calculatePricingFromPurchase(form.costPrice, {
                      purchaseToSellPercent: pricingDraft.sellPercent,
                      purchaseToMrpPercent: pricingDraft.mrpPercent,
                    }).sellingPrice
                  )
                }{" "}
                selling and{" "}
                {
                  formatPricingPreview(
                    calculatePricingFromPurchase(form.costPrice, {
                      purchaseToSellPercent: pricingDraft.sellPercent,
                      purchaseToMrpPercent: pricingDraft.mrpPercent,
                    }).mrp
                  )
                }{" "}
                MRP. Variant rows use their own purchase price when available, otherwise the main purchase price.
              </div>
            </ProductFormSectionCard>
            <ProductFormSectionCard
              title="Price Rows"
              description="Commercial pricing for product or variant scope."
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  prices: [...current.prices, createEmptyProductPrice()],
                }))
              }
            >
              {form.prices.map((price, index) => (
                <ProductCollectionRow
                  key={`price-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      prices: current.prices.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <VariantScopeField
                      label="Variant Scope"
                      value={price.variantClientKey}
                      variants={form.variants}
                      onChange={(value) =>
                        setForm((current) => ({
                          ...current,
                          prices: updateCollectionItem(current.prices, index, (item) => ({
                            ...item,
                            variantClientKey: value,
                          })),
                        }))
                      }
                    />
                    <ProductField label="Purchase Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={price.costPrice}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            prices: updateCollectionItem(current.prices, index, (item) => ({
                              ...item,
                              costPrice: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="Selling Price">
                      <Input
                        type="number"
                        step="0.01"
                        value={price.sellingPrice}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            prices: updateCollectionItem(current.prices, index, (item) => ({
                              ...item,
                              sellingPrice: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="MRP">
                      <Input
                        type="number"
                        step="0.01"
                        value={price.mrp}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            prices: updateCollectionItem(current.prices, index, (item) => ({
                              ...item,
                              mrp: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                  </div>
                </ProductCollectionRow>
              ))}
            </ProductFormSectionCard>
          </div>
        ),
      },
      {
        label: "Storefront",
        value: "storefront",
        content: (
          <div className="space-y-5">
            <ProductFormSectionCard
              title="Storefront Profile"
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ProductField
                  label={
                    <div className="flex items-center justify-between gap-2">
                      <span>Item Badge</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-6 rounded-md"
                        onClick={handleGenerateItemBadgeFromStyle}
                        title="Generate item badge from style"
                        aria-label="Generate item badge from style"
                      >
                        <SparklesIcon className="size-3.5" />
                      </Button>
                    </div>
                  }
                >
                  <ProductTextField
                    value={form.storefront?.catalogBadge ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          catalogBadge: event.target.value,
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductCheckboxField
                  checked={form.featureSectionEnabled}
                  label="Feature section"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      featureSectionEnabled: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        featureSectionEnabled: checked,
                      },
                    }))
                  }
                />
                <ProductCheckboxField
                  checked={form.discoveryBoardEnabled}
                  label="Discovery board"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      discoveryBoardEnabled: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        discoveryBoardEnabled: checked,
                      },
                    }))
                  }
                />
                <ProductField label="Discovery board order">
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    max="8"
                    value={form.storefront?.discoveryBoardOrder ?? 0}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        discoveryBoardOrder: Number(event.target.value || 0),
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          discoveryBoardOrder: Number(event.target.value || 0),
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductCheckboxField
                  checked={form.visualStripEnabled}
                  label="Visual strip"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      visualStripEnabled: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        visualStripEnabled: checked,
                      },
                    }))
                  }
                />
                <ProductField label="Visual strip order">
                  <Input
                    type="number"
                    step="1"
                    value={form.storefront?.visualStripOrder ?? 0}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        visualStripOrder: Number(event.target.value || 0),
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          visualStripOrder: Number(event.target.value || 0),
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductCheckboxField
                  checked={form.homeSliderEnabled}
                  label="Home slider"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      homeSliderEnabled: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        homeSliderEnabled: checked,
                      },
                    }))
                  }
                />
                <ProductCheckboxField
                  checked={form.isNewArrival}
                  label="New arrival"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isNewArrival: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        isNewArrival: checked,
                      },
                    }))
                  }
                />
                <ProductCheckboxField
                  checked={form.isBestSeller}
                  label="Best seller"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isBestSeller: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        isBestSeller: checked,
                      },
                    }))
                  }
                />
                <ProductCheckboxField
                  checked={form.isFeaturedLabel}
                  label="Featured label"
                  onCheckedChange={(checked) =>
                    setForm((current) => ({
                      ...current,
                      isFeaturedLabel: checked,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        isFeaturedLabel: checked,
                      },
                    }))
                  }
                />
              </div>
            </ProductFormSectionCard>
            <ProductFormSectionCard
              title="Storefront Tags"
              onAdd={() =>
                setForm((current) => ({
                  ...current,
                  tags: [...current.tags, createEmptyProductTag()],
                }))
              }
            >
              {form.tags.map((tag, index) => (
                <ProductCollectionRow
                  key={`tag-${index}`}
                  onRemove={() =>
                    setForm((current) => ({
                      ...current,
                      tags: current.tags.filter((_, itemIndex) => itemIndex !== index),
                    }))
                  }
                >
                  <ProductField label="Tag Name">
                    <ProductTextField
                      value={tag.name}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          tags: updateCollectionItem(current.tags, index, (item) => ({
                            ...item,
                            name: event.target.value,
                          })),
                        }))
                      }
                    />
                  </ProductField>
                </ProductCollectionRow>
              ))}
            </ProductFormSectionCard>
          </div>
        ),
      },
      {
        label: "Shipping",
        value: "shipping",
        content: (
          <ProductFormSectionCard
            title="Shipping"
            description="Delivery note and product-level shipping or handling overrides."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ProductField label="Shipping Note" className="md:col-span-2">
                <Textarea
                  rows={3}
                  value={form.storefront?.shippingNote ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        shippingNote: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField label="Shipping Charge">
                <Input
                  type="number"
                  step="0.01"
                  value={form.storefront?.shippingCharge ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        shippingCharge:
                          event.target.value.trim().length > 0
                            ? Number(event.target.value)
                            : null,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField label="Handling Charge">
                <Input
                  type="number"
                  step="0.01"
                  value={form.storefront?.handlingCharge ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        handlingCharge:
                          event.target.value.trim().length > 0
                            ? Number(event.target.value)
                            : null,
                      },
                    }))
                  }
                />
              </ProductField>
            </div>
          </ProductFormSectionCard>
        ),
      },
      {
        label: "SEO",
        value: "seo",
        content: (
          <ProductFormSectionCard
            title="SEO"
            description="Search metadata for public product surfaces."
          >
            <div className="grid gap-4">
              <ProductField
                label={
                  <div className="flex items-center justify-between gap-2">
                    <span>Meta Title</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => void handleGenerateSeoField("metaTitle")}
                      disabled={activeSeoField === "metaTitle"}
                      title="Generate meta title"
                      aria-label="Generate meta title"
                    >
                      <SparklesIcon className="size-3.5" />
                    </Button>
                  </div>
                }
              >
                <ProductTextField
                  value={form.seo?.metaTitle ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      seo: {
                        ...(current.seo ?? createDefaultProductFormValues().seo!),
                        metaTitle: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label={
                  <div className="flex items-center justify-between gap-2">
                    <span>Meta Description</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => void handleGenerateSeoField("metaDescription")}
                      disabled={activeSeoField === "metaDescription"}
                      title="Generate meta description"
                      aria-label="Generate meta description"
                    >
                      <SparklesIcon className="size-3.5" />
                    </Button>
                  </div>
                }
              >
                <Textarea
                  rows={3}
                  value={form.seo?.metaDescription ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      seo: {
                        ...(current.seo ?? createDefaultProductFormValues().seo!),
                        metaDescription: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label={
                  <div className="flex items-center justify-between gap-2">
                    <span>Meta Keywords</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 rounded-md"
                      onClick={() => void handleGenerateSeoField("metaKeywords")}
                      disabled={activeSeoField === "metaKeywords"}
                      title="Generate meta keywords"
                      aria-label="Generate meta keywords"
                    >
                      <SparklesIcon className="size-3.5" />
                    </Button>
                  </div>
                }
              >
                <ProductTextField
                  value={form.seo?.metaKeywords ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      seo: {
                        ...(current.seo ?? createDefaultProductFormValues().seo!),
                        metaKeywords: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
            </div>
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Promo",
        value: "promo",
        content: (
          <ProductFormSectionCard
            title="Promo Slider"
            description="Campaign copy and ordering used when this product appears in promo-led storefront surfaces."
          >
            <div className="grid gap-4 md:grid-cols-2">
              <ProductCheckboxField
                checked={form.promoSliderEnabled}
                label="Enable promo slider"
                onCheckedChange={(checked) =>
                  setForm((current) => ({
                    ...current,
                    promoSliderEnabled: checked,
                    storefront: {
                      ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                      promoSliderEnabled: checked,
                    },
                  }))
                }
              />
              <ProductField
                label="Promo Order"
                description="Lower numbers appear earlier in promo-led product rails."
              >
                <Input
                  type="number"
                  step="1"
                  value={form.storefront?.promoSliderOrder ?? 0}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        promoSliderOrder: Number(event.target.value || 0),
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label="Promo Title"
                description='Example: "Starting ₹199"'
              >
                <ProductTextField
                  value={form.storefront?.promoTitle ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        promoTitle: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label="Promo Subtitle"
                description='Example: "Deals on summer fashion"'
              >
                <ProductTextField
                  value={form.storefront?.promoSubtitle ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        promoSubtitle: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label="Promo Badge"
                description='Optional short marker like "Hot Deal" or "Limited Drop".'
              >
                <ProductTextField
                  value={form.storefront?.promoBadge ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        promoBadge: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
              <ProductField
                label="Promo CTA Label"
                description='Optional action label like "Shop Offer" or "Explore Now".'
              >
                <ProductTextField
                  value={form.storefront?.promoCtaLabel ?? ""}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        promoCtaLabel: event.target.value,
                      },
                    }))
                  }
                />
              </ProductField>
            </div>
          </ProductFormSectionCard>
        ),
      },
    ],
    [
      activeSeoField,
      fieldErrors.name,
      fieldErrors.sku,
      form,
      isSlugGenerating,
      lookupState,
      navigate,
      pricingDraft,
    ]
  )

  async function handleSave() {
    const errors: ProductFieldErrors = {}
    if (form.name.trim().length < 2) {
      errors.name = "Product name is required."
    }
    if (form.sku.trim().length < 1) {
      errors.sku = "SKU is required."
    }

    setFieldErrors(errors)

    if (Object.keys(errors).length > 0) {
      setFormError("Validation failed. Fix the highlighted fields and save again.")
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      const payload = toProductUpsertPayload(form)

      if (productId) {
        await requestJson<ProductResponse>(
          `/internal/v1/core/product?id=${encodeURIComponent(productId)}`,
          { method: "PATCH", body: JSON.stringify(payload) }
        )
      } else {
        await requestJson<ProductResponse>("/internal/v1/core/products", {
          method: "POST",
          body: JSON.stringify(payload),
        })
      }
      invalidateStorefrontShellData()
      void navigate(routeBase)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Failed to save product.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <LoadingCard message="Loading product form..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="-ml-3 w-fit">
            <Link to={routeBase}>
              <ArrowLeftIcon className="size-4" />
              Back to products
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {resolvedProductLabel}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => void navigate(routeBase)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? "Saving..." : isEditing ? "Update Product" : "Save Product"}
          </Button>
        </div>
      </div>
      {formError ? <ProductFormMessage>{formError}</ProductFormMessage> : null}
      <AnimatedTabs defaultTabValue="details" tabs={tabs} />
    </div>
  )
}
