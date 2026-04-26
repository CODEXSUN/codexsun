import assert from "node:assert/strict"
import test from "node:test"

import {
  buildVariantMatrix,
  calculatePricingFromPurchase,
  createDefaultProductFormValues,
  createEmptyProductVariant,
  toProductUpsertPayload,
} from "../../apps/core/web/src/features/product/product-form-state.js"

test("product form payload builder removes empty placeholder rows before submit", () => {
  const form = createDefaultProductFormValues()

  form.name = "Payload Product"
  form.sku = "PAYLOAD-001"
  form.images = [
    {
      imageUrl: "",
      isPrimary: false,
      sortOrder: 1,
      isActive: true,
    },
    {
      imageUrl: "/storage/2026/04/product-image.png",
      isPrimary: true,
      sortOrder: 1,
      isActive: true,
    },
  ]
  form.tags = [
    { name: "", isActive: true },
    { name: "Featured", isActive: true },
  ]
  form.attributes = [
    {
      clientKey: "attribute:color",
      name: "Color",
      isActive: true,
    },
    {
      clientKey: "attribute:blank",
      name: "",
      isActive: true,
    },
  ]
  form.attributeValues = [
    {
      clientKey: "value:red",
      attributeClientKey: "attribute:color",
      value: "Red",
      isActive: true,
    },
    {
      clientKey: "value:blank",
      attributeClientKey: "attribute:blank",
      value: "",
      isActive: true,
    },
  ]

  const blankVariant = createEmptyProductVariant()
  const realVariant = createEmptyProductVariant()
  realVariant.clientKey = "variant:red"
  realVariant.sku = "PAYLOAD-001-RED"
  realVariant.variantName = "Red"
  realVariant.images = [
    {
      imageUrl: "",
      isPrimary: true,
      isActive: true,
    },
  ]

  form.variants = [blankVariant, realVariant]

  const payload = toProductUpsertPayload(form)

  assert.equal(payload.images.length, 1)
  assert.equal(payload.images[0]?.imageUrl, "/storage/2026/04/product-image.png")
  assert.equal(payload.stockItems.length, 0)
  assert.equal(payload.tags.length, 1)
  assert.equal(payload.tags[0]?.name, "Featured")
  assert.equal(payload.attributes.length, 1)
  assert.equal(payload.attributeValues.length, 1)
  assert.equal(payload.variantMap.length, 1)
  assert.equal(payload.variants.length, 1)
  assert.equal(payload.variants[0]?.sku, "PAYLOAD-001-RED")
  assert.equal(payload.variants[0]?.images.length, 0)
})

test("variant matrix rebuilds fresh rows with product defaults and three image slots", () => {
  const form = createDefaultProductFormValues()

  form.name = "Cotton T-Shirt"
  form.code = "PROD-001"
  form.sku = "TSHIRT-001"
  form.basePrice = 799
  form.costPrice = 540
  form.attributes = [
    {
      clientKey: "attribute:color",
      name: "Color",
      isActive: true,
    },
    {
      clientKey: "attribute:size",
      name: "Size",
      isActive: true,
    },
  ]
  form.attributeValues = [
    {
      clientKey: "value:red",
      attributeClientKey: "attribute:color",
      value: "Red",
      isActive: true,
    },
    {
      clientKey: "value:blue",
      attributeClientKey: "attribute:color",
      value: "Blue",
      isActive: true,
    },
    {
      clientKey: "value:m",
      attributeClientKey: "attribute:size",
      value: "M",
      isActive: true,
    },
  ]
  form.variants = [
    {
      ...createEmptyProductVariant(),
      sku: "OLD-SKU",
      variantName: "Old Variant",
      price: 10,
      costPrice: 5,
    },
  ]

  const variants = buildVariantMatrix(form)

  assert.equal(variants.length, 2)
  assert.equal(variants[0]?.variantName, "Cotton T-Shirt - Red / M")
  assert.equal(variants[0]?.sku, "TSHIRT-001-RED-M")
  assert.equal(variants[0]?.price, 799)
  assert.equal(variants[0]?.costPrice, 540)
  assert.equal(variants[0]?.images.length, 3)
  assert.equal(variants[0]?.images[0]?.isPrimary, true)
  assert.equal(variants[0]?.images[1]?.isPrimary, false)
  assert.equal(variants[1]?.variantName, "Cotton T-Shirt - Blue / M")
  assert.equal(variants[1]?.sku, "TSHIRT-001-BLUE-M")
})

test("pricing formula rounds purchase markup into selling and mrp values", () => {
  const formula = calculatePricingFromPurchase(100, {
    purchaseToSellPercent: 50,
    purchaseToMrpPercent: 75,
  })

  assert.equal(formula.purchasePrice, 100)
  assert.equal(formula.sellingPrice, 150)
  assert.equal(formula.mrp, 175)
})
