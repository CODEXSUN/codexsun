import type {
  Product,
  ProductDiscountInput,
  ProductImageInput,
  ProductOfferInput,
  ProductReviewInput,
  ProductSeoInput,
  ProductStockMovementInput,
  ProductStorefrontInput,
  ProductTagInput,
  ProductUpsertPayload,
} from "@core/shared"

export type ProductLookupModuleKey = Extract<
  | "brands"
  | "productCategories"
  | "productGroups"
  | "productTypes"
  | "units"
  | "hsnCodes"
  | "taxes"
  | "styles"
  | "warehouses",
  string
>

export type LocalOption = {
  label: string
  value: string
}

const VARIANT_IMAGE_LIMIT = 3

export type PricingFormulaSettings = {
  purchaseToSellPercent: number
  purchaseToMrpPercent: number
}

export type PricingFormulaValues = {
  purchasePrice: number
  sellingPrice: number
  mrp: number
}

export type ProductAttributeFormValue = {
  clientKey: string
  name: string
  isActive: boolean
}

export type ProductAttributeValueFormValue = {
  clientKey: string
  attributeClientKey: string
  value: string
  isActive: boolean
}

export type ProductVariantAttributeFormValue = {
  attributeName: string
  attributeValue: string
  isActive: boolean
}

export type ProductVariantImageFormValue = {
  imageUrl: string
  isPrimary: boolean
  isActive: boolean
}

export type ProductVariantFormValue = {
  clientKey: string
  sku: string
  variantName: string
  price: number
  costPrice: number
  stockQuantity: number
  openingStock: number
  weight: number | null
  barcode: string
  isActive: boolean
  images: ProductVariantImageFormValue[]
  attributes: ProductVariantAttributeFormValue[]
}

export type ProductPriceFormValue = {
  variantClientKey: string | null
  mrp: number
  sellingPrice: number
  costPrice: number
  isActive: boolean
}

export type ProductStockItemFormValue = {
  variantClientKey: string | null
  warehouseId: string
  quantity: number
  reservedQuantity: number
  isActive: boolean
}

export type ProductFormValues = Omit<
  ProductUpsertPayload,
  "variants" | "attributes" | "attributeValues" | "prices" | "stockItems" | "variantMap"
> & {
  variants: ProductVariantFormValue[]
  attributes: ProductAttributeFormValue[]
  attributeValues: ProductAttributeValueFormValue[]
  variantMap: ProductUpsertPayload["variantMap"]
  prices: ProductPriceFormValue[]
  stockItems: ProductStockItemFormValue[]
}

export const storefrontDepartmentOptions: LocalOption[] = [
  { label: "Women", value: "women" },
  { label: "Men", value: "men" },
  { label: "Kids", value: "kids" },
  { label: "Accessories", value: "accessories" },
]

function createClientKey() {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

export function roundUpPrice(value: number) {
  return Math.ceil(value)
}

export function calculatePricingFromPurchase(
  purchasePrice: number,
  settings: PricingFormulaSettings
) {
  const sellingPrice = roundUpPrice(
    purchasePrice * (1 + settings.purchaseToSellPercent / 100)
  )
  const mrp = roundUpPrice(
    purchasePrice * (1 + settings.purchaseToMrpPercent / 100)
  )

  return {
    purchasePrice,
    sellingPrice,
    mrp,
  } satisfies PricingFormulaValues
}

export function createEmptyProductImage(sortOrder = 1): ProductImageInput {
  return {
    imageUrl: "",
    isPrimary: false,
    sortOrder,
    isActive: true,
  }
}

export function createEmptyProductVariantImage(): ProductVariantImageFormValue {
  return {
    imageUrl: "",
    isPrimary: false,
    isActive: true,
  }
}

export function createDefaultProductVariantImages(): ProductVariantImageFormValue[] {
  return Array.from({ length: VARIANT_IMAGE_LIMIT }, (_, index) => ({
    ...createEmptyProductVariantImage(),
    isPrimary: index === 0,
  }))
}

export function createEmptyProductVariantAttribute(): ProductVariantAttributeFormValue {
  return {
    attributeName: "",
    attributeValue: "",
    isActive: true,
  }
}

export function createEmptyProductAttribute(): ProductAttributeFormValue {
  return {
    clientKey: createClientKey(),
    name: "",
    isActive: true,
  }
}

export function createEmptyProductAttributeValue(
  attributeClientKey = ""
): ProductAttributeValueFormValue {
  return {
    clientKey: createClientKey(),
    attributeClientKey,
    value: "",
    isActive: true,
  }
}

export function createEmptyProductVariant(): ProductVariantFormValue {
  return {
    clientKey: createClientKey(),
    sku: "",
    variantName: "",
    price: 0,
    costPrice: 0,
    stockQuantity: 0,
    openingStock: 0,
    weight: null,
    barcode: "",
    isActive: true,
    images: createDefaultProductVariantImages(),
    attributes: [],
  }
}

export function createEmptyProductPrice(): ProductPriceFormValue {
  return {
    variantClientKey: null,
    mrp: 0,
    sellingPrice: 0,
    costPrice: 0,
    isActive: true,
  }
}

export function createEmptyProductStockItem(): ProductStockItemFormValue {
  return {
    variantClientKey: null,
    warehouseId: "",
    quantity: 0,
    reservedQuantity: 0,
    isActive: true,
  }
}

export function createEmptyProductTag(): ProductTagInput {
  return {
    name: "",
    isActive: true,
  }
}

export function createDefaultProductFormValues(): ProductFormValues {
  return {
    code: "",
    name: "",
    slug: "",
    description: "",
    shortDescription: "",
    brandId: null,
    brandName: "",
    categoryId: null,
    categoryName: "",
    productGroupId: null,
    productGroupName: "",
    productTypeId: null,
    productTypeName: "",
    unitId: null,
    hsnCodeId: null,
    styleId: null,
    sku: "",
    hasVariants: false,
    basePrice: 0,
    costPrice: 0,
    taxId: null,
    isFeatured: false,
    isActive: true,
    storefrontDepartment: null,
    homeSliderEnabled: false,
    promoSliderEnabled: false,
    featureSectionEnabled: false,
    isNewArrival: false,
    isBestSeller: false,
    isFeaturedLabel: false,
    images: [createEmptyProductImage()],
    variants: [],
    prices: [createEmptyProductPrice()],
    discounts: [],
    offers: [],
    attributes: [],
    attributeValues: [],
    variantMap: [],
    stockItems: [createEmptyProductStockItem()],
    stockMovements: [],
    seo: {
      metaTitle: "",
      metaDescription: "",
      metaKeywords: "",
      isActive: true,
    },
    storefront: {
      department: null,
      homeSliderEnabled: false,
      homeSliderOrder: 0,
      promoSliderEnabled: false,
      promoSliderOrder: 0,
      featureSectionEnabled: false,
      featureSectionOrder: 0,
      isNewArrival: false,
      isBestSeller: false,
      isFeaturedLabel: false,
      catalogBadge: "",
      promoBadge: "",
      promoTitle: "",
      promoSubtitle: "",
      promoCtaLabel: "",
      fabric: "",
      fit: "",
      sleeve: "",
      occasion: "",
      shippingNote: "",
      isActive: true,
    },
    tags: [createEmptyProductTag()],
    reviews: [],
  }
}

function toEditableString(value: string | null | undefined) {
  return value ?? ""
}

function hasValue(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0
}

function isMeaningfulVariant(
  variant: ProductVariantFormValue
) {
  return (
    hasValue(variant.sku) ||
    hasValue(variant.variantName) ||
    variant.images.some((image) => hasValue(image.imageUrl)) ||
    variant.attributes.some(
      (attribute) =>
        hasValue(attribute.attributeName) && hasValue(attribute.attributeValue)
    )
  )
}

function buildVariantLabel(
  productName: string,
  attributes: ProductVariantAttributeFormValue[]
) {
  const optionLabel = attributes.map((attribute) => attribute.attributeValue.trim()).join(" / ")

  if (productName.trim().length > 0 && optionLabel.length > 0) {
    return `${productName.trim()} - ${optionLabel}`
  }

  return optionLabel || productName.trim()
}

function buildVariantSku(
  productSku: string,
  productCode: string,
  attributes: ProductVariantAttributeFormValue[]
) {
  const base = productSku.trim() || productCode.trim()
  const suffix = attributes
    .map((attribute) =>
      attribute.attributeValue
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toUpperCase()
    )
    .filter(Boolean)
    .join("-")

  if (base.length > 0 && suffix.length > 0) {
    return `${base.toUpperCase()}-${suffix}`
  }

  return (base || suffix).toUpperCase()
}

export function buildVariantMatrix(values: ProductFormValues): ProductVariantFormValue[] {
  const groups = values.attributes
    .map((attribute) => ({
      attributeName: attribute.name.trim(),
      values: Array.from(
        new Set(
          values.attributeValues
            .filter((entry) => entry.attributeClientKey === attribute.clientKey)
            .map((entry) => entry.value.trim())
            .filter(Boolean)
        )
      ),
    }))
    .filter((group) => group.attributeName.length > 0 && group.values.length > 0)

  if (groups.length === 0) {
    return []
  }
  const combinations: ProductVariantAttributeFormValue[][] = []

  function visit(index: number, current: ProductVariantAttributeFormValue[]) {
    if (index >= groups.length) {
      combinations.push(current)
      return
    }

    const group = groups[index]
    group.values.forEach((value) => {
      visit(index + 1, [
        ...current,
        {
          attributeName: group.attributeName,
          attributeValue: value,
          isActive: true,
        },
      ])
    })
  }

  visit(0, [])

  return combinations.map((attributes) => {
    return {
      ...createEmptyProductVariant(),
      sku: buildVariantSku(values.sku, values.code, attributes),
      variantName: buildVariantLabel(values.name, attributes),
      price: values.basePrice,
      costPrice: values.costPrice,
      attributes,
    }
  })
}

export function toProductFormValues(product: Product): ProductFormValues {
  const variantClientKeyById = new Map<string, string>()

  product.variants.forEach((variant) => {
    variantClientKeyById.set(variant.id, variant.id)
  })

  return {
    code: product.code,
    name: product.name,
    slug: product.slug,
    description: toEditableString(product.description),
    shortDescription: toEditableString(product.shortDescription),
    brandId: product.brandId,
    brandName: toEditableString(product.brandName),
    categoryId: product.categoryId,
    categoryName: toEditableString(product.categoryName),
    productGroupId: product.productGroupId,
    productGroupName: toEditableString(product.productGroupName),
    productTypeId: product.productTypeId,
    productTypeName: toEditableString(product.productTypeName),
    unitId: product.unitId,
    hsnCodeId: product.hsnCodeId,
    styleId: product.styleId,
    sku: product.sku,
    hasVariants: product.hasVariants,
    basePrice: product.basePrice,
    costPrice: product.costPrice,
    taxId: product.taxId,
    isFeatured: product.isFeatured,
    isActive: product.isActive,
    storefrontDepartment: product.storefrontDepartment,
    homeSliderEnabled: product.homeSliderEnabled,
    promoSliderEnabled: product.promoSliderEnabled,
    featureSectionEnabled: product.featureSectionEnabled,
    isNewArrival: product.isNewArrival,
    isBestSeller: product.isBestSeller,
    isFeaturedLabel: product.isFeaturedLabel,
    images:
      product.images.length > 0
        ? product.images.map((item, index) => ({
            imageUrl: item.imageUrl,
            isPrimary: item.isPrimary,
            sortOrder: item.sortOrder >= 1 ? item.sortOrder : index + 1,
            isActive: item.isActive,
          }))
        : [createEmptyProductImage()],
    variants: product.variants.map((item) => ({
      clientKey: item.id,
      sku: item.sku,
      variantName: item.variantName,
      price: item.price,
      costPrice: item.costPrice,
      stockQuantity: item.stockQuantity,
      openingStock: item.openingStock,
      weight: item.weight,
      barcode: toEditableString(item.barcode),
      isActive: item.isActive,
      images:
        item.images.length > 0
          ? [
              ...item.images.slice(0, VARIANT_IMAGE_LIMIT).map((image) => ({
                imageUrl: image.imageUrl,
                isPrimary: image.isPrimary,
                isActive: image.isActive,
              })),
              ...createDefaultProductVariantImages(),
            ]
              .slice(0, VARIANT_IMAGE_LIMIT)
              .map((image, index) => ({
                ...image,
                isPrimary:
                  index ===
                  Math.max(
                    0,
                    Math.min(
                      VARIANT_IMAGE_LIMIT - 1,
                      item.images.findIndex((entry) => entry.isPrimary)
                    )
                  ),
              }))
          : createDefaultProductVariantImages(),
      attributes: item.attributes.map((attribute) => ({
        attributeName: attribute.attributeName,
        attributeValue: attribute.attributeValue,
        isActive: attribute.isActive,
      })),
    })),
    prices:
      product.prices.length > 0
        ? product.prices.map((item) => ({
            variantClientKey: item.variantId
              ? variantClientKeyById.get(item.variantId) ?? item.variantId
              : null,
            mrp: item.mrp,
            sellingPrice: item.sellingPrice,
            costPrice: item.costPrice,
            isActive: item.isActive,
          }))
        : [createEmptyProductPrice()],
    discounts: product.discounts.map((item) => ({
      variantId: item.variantId,
      variantClientKey: item.variantId
        ? variantClientKeyById.get(item.variantId) ?? item.variantId
        : null,
      discountType: item.discountType,
      discountValue: item.discountValue,
      startDate: toEditableString(item.startDate),
      endDate: toEditableString(item.endDate),
      isActive: item.isActive,
    })) as ProductDiscountInput[],
    offers: product.offers.map((item) => ({
      title: item.title,
      description: toEditableString(item.description),
      offerPrice: item.offerPrice,
      startDate: toEditableString(item.startDate),
      endDate: toEditableString(item.endDate),
      isActive: item.isActive,
    })) as ProductOfferInput[],
    attributes: product.attributes.map((item) => ({
      clientKey: item.id,
      name: item.name,
      isActive: item.isActive,
    })),
    attributeValues: product.attributeValues.map((item) => ({
      clientKey: item.id,
      attributeClientKey: item.attributeId,
      value: item.value,
      isActive: item.isActive,
    })),
    variantMap: product.variantMap.map((item) => ({
      attributeId: item.attributeId,
      attributeClientKey: item.attributeId,
      valueId: item.valueId,
      valueClientKey: item.valueId,
      isActive: item.isActive,
    })),
    stockItems:
      product.stockItems.length > 0
        ? product.stockItems.map((item) => ({
            variantClientKey: item.variantId
              ? variantClientKeyById.get(item.variantId) ?? item.variantId
              : null,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            reservedQuantity: item.reservedQuantity,
            isActive: item.isActive,
          }))
        : [createEmptyProductStockItem()],
    stockMovements: product.stockMovements.map((item) => ({
      variantId: item.variantId,
      variantClientKey: item.variantId
        ? variantClientKeyById.get(item.variantId) ?? item.variantId
        : null,
      warehouseId: item.warehouseId,
      movementType: item.movementType,
      quantity: item.quantity,
      referenceType: toEditableString(item.referenceType),
      referenceId: toEditableString(item.referenceId),
      movementAt: item.movementAt,
      isActive: item.isActive,
    })) as ProductStockMovementInput[],
    seo: product.seo
      ? ({
          metaTitle: toEditableString(product.seo.metaTitle),
          metaDescription: toEditableString(product.seo.metaDescription),
          metaKeywords: toEditableString(product.seo.metaKeywords),
          isActive: product.seo.isActive,
        } satisfies ProductSeoInput)
      : {
          metaTitle: "",
          metaDescription: "",
          metaKeywords: "",
          isActive: true,
        },
    storefront: product.storefront
      ? ({
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
          catalogBadge: toEditableString(product.storefront.catalogBadge),
          promoBadge: toEditableString(product.storefront.promoBadge),
          promoTitle: toEditableString(product.storefront.promoTitle),
          promoSubtitle: toEditableString(product.storefront.promoSubtitle),
          promoCtaLabel: toEditableString(product.storefront.promoCtaLabel),
          fabric: toEditableString(product.storefront.fabric),
          fit: toEditableString(product.storefront.fit),
          sleeve: toEditableString(product.storefront.sleeve),
          occasion: toEditableString(product.storefront.occasion),
          shippingNote: toEditableString(product.storefront.shippingNote),
          isActive: product.storefront.isActive,
        } satisfies ProductStorefrontInput)
      : {
          department: product.storefrontDepartment,
          homeSliderEnabled: product.homeSliderEnabled,
          homeSliderOrder: 0,
          promoSliderEnabled: product.promoSliderEnabled,
          promoSliderOrder: 0,
          featureSectionEnabled: product.featureSectionEnabled,
          featureSectionOrder: 0,
          isNewArrival: product.isNewArrival,
          isBestSeller: product.isBestSeller,
          isFeaturedLabel: product.isFeaturedLabel,
          catalogBadge: "",
          promoBadge: "",
          promoTitle: "",
          promoSubtitle: "",
          promoCtaLabel: "",
          fabric: "",
          fit: "",
          sleeve: "",
          occasion: "",
          shippingNote: "",
          isActive: true,
        },
    tags:
      product.tags.length > 0
        ? product.tags.map((item) => ({
            name: item.name,
            isActive: item.isActive,
          }))
        : [createEmptyProductTag()],
    reviews: product.reviews.map((item) => ({
      userId: item.userId,
      rating: item.rating,
      review: toEditableString(item.review),
      reviewDate: item.reviewDate,
      isActive: item.isActive,
    })) as ProductReviewInput[],
  }
}

export function toProductUpsertPayload(values: ProductFormValues): ProductUpsertPayload {
  const images = values.images.filter((image) => hasValue(image.imageUrl))
  const variants = values.variants
    .filter((variant) => isMeaningfulVariant(variant))
    .map((variant) => ({
      ...variant,
      images: variant.images.filter((image) => hasValue(image.imageUrl)),
      attributes: variant.attributes.filter(
        (attribute) =>
          hasValue(attribute.attributeName) && hasValue(attribute.attributeValue)
      ),
    }))
  const attributes = values.attributes.filter((attribute) => hasValue(attribute.name))
  const validAttributeKeys = new Set(attributes.map((attribute) => attribute.clientKey))
  const attributeValues = values.attributeValues.filter(
    (value) => hasValue(value.value) && hasValue(value.attributeClientKey) && validAttributeKeys.has(value.attributeClientKey)
  )
  const validVariantKeys = new Set(variants.map((variant) => variant.clientKey))
  const prices = values.prices.filter(
    (price) => price.variantClientKey == null || validVariantKeys.has(price.variantClientKey)
  )
  const stockItems = values.stockItems.filter(
    (item) =>
      hasValue(item.warehouseId) &&
      (item.variantClientKey == null || validVariantKeys.has(item.variantClientKey))
  )
  const tags = values.tags.filter((tag) => hasValue(tag.name))
  const discounts = values.discounts.filter((discount) => hasValue(discount.discountType))
  const offers = values.offers.filter((offer) => hasValue(offer.title))
  const stockMovements = values.stockMovements.filter(
    (movement) => hasValue(movement.movementType) && hasValue(movement.movementAt)
  )
  const reviews = values.reviews.filter(
    (review) => review.rating >= 1 && review.rating <= 5 && hasValue(review.reviewDate)
  )
  const attributeIdByKey = new Map<string, string>()
  attributes.forEach((attribute) => {
    attributeIdByKey.set(attribute.clientKey, attribute.clientKey)
  })

  const attributeValueIdByKey = new Map<string, string>()
  attributeValues.forEach((value) => {
    attributeValueIdByKey.set(value.clientKey, value.clientKey)
  })

  return {
    ...values,
    images,
    variants: variants.map((variant) => ({
      clientKey: variant.clientKey,
      sku: variant.sku,
      variantName: variant.variantName,
      price: variant.price,
      costPrice: variant.costPrice,
      stockQuantity: variant.stockQuantity,
      openingStock: variant.openingStock,
      weight: variant.weight,
      barcode: variant.barcode || null,
      isActive: variant.isActive,
      images: variant.images,
      attributes: variant.attributes.map((attribute) => ({
        attributeName: attribute.attributeName,
        attributeValue: attribute.attributeValue,
        isActive: attribute.isActive,
      })),
    })),
    prices: prices.map((price) => ({
      variantId: price.variantClientKey,
      variantClientKey: price.variantClientKey,
      mrp: price.mrp,
      sellingPrice: price.sellingPrice,
      costPrice: price.costPrice,
      isActive: price.isActive,
    })),
    discounts,
    offers,
    attributes: attributes.map((attribute) => ({
      clientKey: attribute.clientKey,
      name: attribute.name,
      isActive: attribute.isActive,
    })),
    attributeValues: attributeValues.map((value) => ({
      clientKey: value.clientKey,
      attributeId: attributeIdByKey.get(value.attributeClientKey) ?? value.attributeClientKey,
      attributeClientKey: value.attributeClientKey,
      value: value.value,
      isActive: value.isActive,
    })),
    variantMap: attributeValues.map((value) => ({
      attributeId: attributeIdByKey.get(value.attributeClientKey) ?? value.attributeClientKey,
      attributeClientKey: value.attributeClientKey,
      valueId: attributeValueIdByKey.get(value.clientKey) ?? value.clientKey,
      valueClientKey: value.clientKey,
      isActive: value.isActive,
    })),
    stockItems: stockItems.map((item) => ({
      variantId: item.variantClientKey,
      variantClientKey: item.variantClientKey,
      warehouseId: item.warehouseId,
      quantity: item.quantity,
      reservedQuantity: item.reservedQuantity,
      isActive: item.isActive,
    })),
    stockMovements,
    tags,
    reviews,
  } as ProductUpsertPayload
}
