import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeftIcon, BoxesIcon, StarIcon, Trash2Icon } from "lucide-react"

import type { CommonModuleItem, ProductResponse } from "@core/shared"
import { getStoredAccessToken } from "@cxapp/web/src/auth/session-storage"
import { FrameworkMediaPickerField } from "@cxapp/web/src/features/framework-media/media-picker-field"

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
  createEmptyProductStockItem,
  createEmptyProductTag,
  createEmptyProductVariant,
  createEmptyProductVariantAttribute,
  storefrontDepartmentOptions,
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
  ProductSelectField,
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
  "warehouses",
]

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
  commonRouteBase = "/dashboard/apps/core",
  productId,
  routeBase = "/dashboard/apps/core/products",
}: {
  commonRouteBase?: string
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
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<ProductFieldErrors>({})
  useGlobalLoading(isLoading || isSaving)

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
              <ProductField label="Slug">
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
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, productGroupId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-productGroups`)}
                createActionLabel='Create new "Product Group"'
              />
              <ProductLookupField
                label="Category"
                items={lookupState.productCategories}
                value={form.categoryId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, categoryId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-productCategories`)}
                createActionLabel='Create new "Category"'
              />
              <ProductLookupField
                label="Brand"
                items={lookupState.brands}
                value={form.brandId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, brandId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-brands`)}
                createActionLabel='Create new "Brand"'
              />
              <ProductLookupField
                label="Product Type"
                items={lookupState.productTypes}
                value={form.productTypeId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, productTypeId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-productTypes`)}
                createActionLabel='Create new "Product Type"'
              />
              <ProductLookupField
                label="Unit"
                items={lookupState.units}
                value={form.unitId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, unitId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-units`)}
                createActionLabel='Create new "Unit"'
              />
              <ProductLookupField
                label="HSN Code"
                items={lookupState.hsnCodes}
                value={form.hsnCodeId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, hsnCodeId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-hsnCodes`)}
                createActionLabel='Create new "HSN Code"'
              />
              <ProductLookupField
                label="Tax"
                items={lookupState.taxes}
                value={form.taxId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, taxId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-taxes`)}
                createActionLabel='Create new "Tax"'
              />
              <ProductLookupField
                label="Style"
                items={lookupState.styles}
                value={form.styleId ?? ""}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, styleId: value }))
                }
                onCreateNew={() => void navigate(`${commonRouteBase}/common-styles`)}
                createActionLabel='Create new "Style"'
              />
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
                      stockItems: current.stockItems.map((entry) =>
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
                    stockItems: current.stockItems.map((entry) =>
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
                    <ProductField label="Opening Stock">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.openingStock}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              openingStock: Number(event.target.value || 0),
                            })),
                          }))
                        }
                      />
                    </ProductField>
                    <ProductField label="Stock Quantity">
                      <Input
                        type="number"
                        step="0.01"
                        value={variant.stockQuantity}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            variants: updateCollectionItem(current.variants, index, (item) => ({
                              ...item,
                              stockQuantity: Number(event.target.value || 0),
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
              title="Apply Pricing"
              description="Enter purchase price and percentages once, then calculate product and variant selling or MRP values together."
            >
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                <ProductField label="Purchase Price">
                  <Input
                    type="number"
                    step="0.01"
                    value={pricingDraft.purchase}
                    onChange={(event) =>
                      setPricingDraft((current) => ({
                        ...current,
                        purchase: Number(event.target.value || 0),
                      }))
                    }
                  />
                </ProductField>
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
                Example: purchase 100 with {pricingDraft.sellPercent}% selling and{" "}
                {pricingDraft.mrpPercent}% MRP gives{" "}
                {
                  calculatePricingFromPurchase(100, {
                    purchaseToSellPercent: pricingDraft.sellPercent,
                    purchaseToMrpPercent: pricingDraft.mrpPercent,
                  }).sellingPrice
                }{" "}
                selling and{" "}
                {
                  calculatePricingFromPurchase(100, {
                    purchaseToSellPercent: pricingDraft.sellPercent,
                    purchaseToMrpPercent: pricingDraft.mrpPercent,
                  }).mrp
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
            <ProductFormSectionCard
              title="Tags"
              description="Shared product tags."
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
        label: "Inventory",
        value: "inventory",
        content: (
          <ProductFormSectionCard
            title="Stock Items"
            description="Warehouse-wise availability."
            onAdd={() =>
              setForm((current) => ({
                ...current,
                stockItems: [...current.stockItems, createEmptyProductStockItem()],
              }))
            }
          >
            {form.stockItems.map((stockItem, index) => (
              <ProductCollectionRow
                key={`stock-${index}`}
                onRemove={() =>
                  setForm((current) => ({
                    ...current,
                    stockItems: current.stockItems.filter((_, itemIndex) => itemIndex !== index),
                  }))
                }
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <VariantScopeField
                    label="Variant Scope"
                    value={stockItem.variantClientKey}
                    variants={form.variants}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        stockItems: updateCollectionItem(current.stockItems, index, (item) => ({
                          ...item,
                          variantClientKey: value,
                        })),
                      }))
                    }
                  />
                  <ProductLookupField
                    label="Warehouse"
                    items={lookupState.warehouses}
                    value={stockItem.warehouseId}
                    onValueChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        stockItems: updateCollectionItem(current.stockItems, index, (item) => ({
                          ...item,
                          warehouseId: value,
                        })),
                      }))
                    }
                    onCreateNew={() => void navigate(`${commonRouteBase}/common-warehouses`)}
                    createActionLabel='Create new "Warehouse"'
                  />
                  <ProductField label="Quantity">
                    <Input
                      type="number"
                      step="0.01"
                      value={stockItem.quantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          stockItems: updateCollectionItem(
                            current.stockItems,
                            index,
                            (item) => ({
                              ...item,
                              quantity: Number(event.target.value || 0),
                            })
                          ),
                        }))
                      }
                    />
                  </ProductField>
                  <ProductField label="Reserved Quantity">
                    <Input
                      type="number"
                      step="0.01"
                      value={stockItem.reservedQuantity}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          stockItems: updateCollectionItem(
                            current.stockItems,
                            index,
                            (item) => ({
                              ...item,
                              reservedQuantity: Number(event.target.value || 0),
                            })
                          ),
                        }))
                      }
                    />
                  </ProductField>
                </div>
              </ProductCollectionRow>
            ))}
          </ProductFormSectionCard>
        ),
      },
      {
        label: "Storefront",
        value: "storefront",
        content: (
          <div className="space-y-5">
            <ProductFormSectionCard
              title="Storefront Profile"
              description="Flags consumed by ecommerce and storefront."
            >
              <div className="grid gap-4 md:grid-cols-2">
                <ProductSelectField
                  label="Department"
                  value={form.storefront?.department ?? ""}
                  options={storefrontDepartmentOptions}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      storefrontDepartment: value as ProductFormValues["storefrontDepartment"],
                      storefront: {
                        ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                        department: value as NonNullable<ProductFormValues["storefront"]>["department"],
                      },
                    }))
                  }
                />
                <ProductField label="Catalog Badge">
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
                <ProductField label="Fabric">
                  <ProductTextField
                    value={form.storefront?.fabric ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          fabric: event.target.value,
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductField label="Fit">
                  <ProductTextField
                    value={form.storefront?.fit ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          fit: event.target.value,
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductField label="Sleeve">
                  <ProductTextField
                    value={form.storefront?.sleeve ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          sleeve: event.target.value,
                        },
                      }))
                    }
                  />
                </ProductField>
                <ProductField label="Occasion">
                  <ProductTextField
                    value={form.storefront?.occasion ?? ""}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        storefront: {
                          ...(current.storefront ?? createDefaultProductFormValues().storefront!),
                          occasion: event.target.value,
                        },
                      }))
                    }
                  />
                </ProductField>
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
                  checked={form.promoSliderEnabled}
                  label="Promo slider"
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
            <ProductFormSectionCard title="SEO" description="Search metadata for public product surfaces.">
              <div className="grid gap-4">
                <ProductField label="Meta Title">
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
                <ProductField label="Meta Description">
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
                <ProductField label="Meta Keywords">
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
          </div>
        ),
      },
    ],
    [fieldErrors.name, fieldErrors.sku, form, lookupState, navigate]
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
            {isEditing ? "Update Product" : "Create Product"}
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
