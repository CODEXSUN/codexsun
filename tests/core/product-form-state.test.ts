import assert from "node:assert/strict"
import test from "node:test"

import {
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
      imageUrl: "/public/media/2026/04/product-image.png",
      isPrimary: true,
      sortOrder: 1,
      isActive: true,
    },
  ]
  form.stockItems = [
    {
      variantClientKey: null,
      warehouseId: "",
      quantity: 0,
      reservedQuantity: 0,
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
  assert.equal(payload.images[0]?.imageUrl, "/public/media/2026/04/product-image.png")
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
