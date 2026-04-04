import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import {
  createProduct,
  deleteProduct,
  listProducts,
  updateProduct,
} from "../../apps/core/src/services/product-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

const adminUser = {
  id: "auth-user:platform-admin",
  email: "sundar@sundar.com",
  phoneNumber: "9999999999",
  displayName: "Sundar",
  actorType: "admin" as const,
  isSuperAdmin: true,
  avatarUrl: null,
  isActive: true,
  organizationName: "Codexsun",
  roles: [],
  permissions: [],
  createdAt: "2026-03-30T00:00:00.000Z",
  updatedAt: "2026-03-30T00:00:00.000Z",
}

test("core product service supports create update and delete CRUD", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-core-products-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false

    const runtime = createRuntimeDatabases(config)

    try {
      await prepareApplicationDatabase(runtime)

      const initial = await listProducts(runtime.primary)
      assert.equal(initial.items.length > 0, true)

      const created = await createProduct(runtime.primary, adminUser, {
        code: "",
        name: "Core Phase Product",
        slug: "",
        description: "Shared core product master.",
        shortDescription: "Shared product",
        brandId: "brand:aster-loom",
        brandName: "Aster Loom",
        categoryId: "product-category:t-shirts",
        categoryName: "T-Shirts",
        productGroupId: "product-group:apparel",
        productGroupName: "Apparel",
        productTypeId: "product-type:finished-good",
        productTypeName: "Finished Good",
        unitId: "unit:piece",
        hsnCodeId: "hsn:6109",
        styleId: "style:relaxed",
        sku: "CORE-TSHIRT-001",
        hasVariants: false,
        basePrice: 499,
        costPrice: 240,
        taxId: "tax:gst-5",
        isFeatured: true,
        isActive: true,
        storefrontDepartment: "men",
        homeSliderEnabled: false,
        promoSliderEnabled: false,
        featureSectionEnabled: true,
        isNewArrival: true,
        isBestSeller: false,
        isFeaturedLabel: true,
        images: [
          {
            imageUrl: "https://placehold.co/600x800/f0e0d0/2d211b?text=Core+Product",
            isPrimary: true,
            sortOrder: 1,
            isActive: true,
          },
        ],
        variants: [],
        prices: [
          {
            variantId: null,
            mrp: 599,
            sellingPrice: 499,
            costPrice: 240,
            isActive: true,
          },
        ],
        discounts: [],
        offers: [],
        attributes: [],
        attributeValues: [],
        variantMap: [],
        stockItems: [
          {
            variantId: null,
            warehouseId: "warehouse:chennai-central",
            quantity: 25,
            reservedQuantity: 2,
            isActive: true,
          },
        ],
        stockMovements: [],
        seo: {
          metaTitle: "Core Phase Product",
          metaDescription: "Core phase product description.",
          metaKeywords: "core, product",
          isActive: true,
        },
        storefront: {
          department: "men",
          homeSliderEnabled: false,
          homeSliderOrder: 0,
          promoSliderEnabled: false,
          promoSliderOrder: 0,
          featureSectionEnabled: true,
          featureSectionOrder: 3,
          isNewArrival: true,
          isBestSeller: false,
          isFeaturedLabel: true,
          catalogBadge: "Core",
          fabric: "Cotton",
          fit: "Regular",
          sleeve: "Half Sleeve",
          occasion: "Casual",
          shippingNote: "Ships in 2 days",
          isActive: true,
        },
        tags: [{ name: "Core", isActive: true }],
        reviews: [],
      })

      assert.equal(created.item.code, "CORE-TSHIRT-001")
      assert.equal(created.item.primaryImageUrl?.includes("Core+Product"), true)

      const createdWithVariants = await createProduct(runtime.primary, adminUser, {
        code: "PRD-VAR-001",
        name: "Variant Driven Product",
        slug: "variant-driven-product",
        description: "Variant-aware product master.",
        shortDescription: "Variant product",
        brandId: "brand:aster-loom",
        brandName: "Aster Loom",
        categoryId: "product-category:t-shirts",
        categoryName: "T-Shirts",
        productGroupId: "product-group:apparel",
        productGroupName: "Apparel",
        productTypeId: "product-type:finished-good",
        productTypeName: "Finished Good",
        unitId: "unit:piece",
        hsnCodeId: "hsn:6109",
        styleId: "style:relaxed",
        sku: "VAR-TSHIRT-001",
        hasVariants: true,
        basePrice: 799,
        costPrice: 390,
        taxId: "tax:gst-5",
        isFeatured: false,
        isActive: true,
        storefrontDepartment: "men",
        homeSliderEnabled: false,
        promoSliderEnabled: false,
        featureSectionEnabled: false,
        isNewArrival: false,
        isBestSeller: false,
        isFeaturedLabel: false,
        images: [],
        variants: [
          {
            clientKey: "variant:red-m",
            sku: "VAR-TSHIRT-001-RM",
            variantName: "Red / M",
            price: 799,
            costPrice: 390,
            stockQuantity: 12,
            openingStock: 12,
            weight: null,
            barcode: null,
            isActive: true,
            images: [],
            attributes: [
              { attributeName: "Color", attributeValue: "Red", isActive: true },
              { attributeName: "Size", attributeValue: "M", isActive: true },
            ],
          },
        ],
        prices: [
          {
            variantId: "variant:red-m",
            variantClientKey: "variant:red-m",
            mrp: 899,
            sellingPrice: 799,
            costPrice: 390,
            isActive: true,
          },
        ],
        discounts: [],
        offers: [],
        attributes: [
          { clientKey: "attribute:color", name: "Color", isActive: true },
          { clientKey: "attribute:size", name: "Size", isActive: true },
        ],
        attributeValues: [
          {
            clientKey: "value:red",
            attributeId: "attribute:color",
            attributeClientKey: "attribute:color",
            value: "Red",
            isActive: true,
          },
          {
            clientKey: "value:m",
            attributeId: "attribute:size",
            attributeClientKey: "attribute:size",
            value: "M",
            isActive: true,
          },
        ],
        variantMap: [
          {
            attributeId: "attribute:color",
            attributeClientKey: "attribute:color",
            valueId: "value:red",
            valueClientKey: "value:red",
            isActive: true,
          },
          {
            attributeId: "attribute:size",
            attributeClientKey: "attribute:size",
            valueId: "value:m",
            valueClientKey: "value:m",
            isActive: true,
          },
        ],
        stockItems: [
          {
            variantId: "variant:red-m",
            variantClientKey: "variant:red-m",
            warehouseId: "warehouse:chennai-central",
            quantity: 12,
            reservedQuantity: 1,
            isActive: true,
          },
        ],
        stockMovements: [],
        seo: null,
        storefront: null,
        tags: [],
        reviews: [],
      })

      assert.equal(createdWithVariants.item.variants.length, 1)
      assert.equal(createdWithVariants.item.prices[0]?.variantId, createdWithVariants.item.variants[0]?.id)
      assert.equal(
        createdWithVariants.item.stockItems[0]?.variantId,
        createdWithVariants.item.variants[0]?.id
      )
      assert.equal(
        createdWithVariants.item.attributeValues[0]?.attributeId,
        createdWithVariants.item.attributes[0]?.id
      )

      const updated = await updateProduct(runtime.primary, adminUser, created.item.id, {
        ...{
          code: "PRD-CORE-001",
          name: "Core Phase Product Updated",
          slug: "core-phase-product-updated",
          description: "Updated shared core product master.",
          shortDescription: "Updated shared product",
          brandId: "brand:northline",
          brandName: "Northline",
          categoryId: "product-category:accessories",
          categoryName: "Accessories",
          productGroupId: "product-group:accessories",
          productGroupName: "Accessories",
          productTypeId: "product-type:finished-good",
          productTypeName: "Finished Good",
          unitId: "unit:piece",
          hsnCodeId: "hsn:6109",
          styleId: "style:basics",
          sku: "CORE-TSHIRT-001",
          hasVariants: false,
          basePrice: 549,
          costPrice: 260,
          taxId: "tax:gst-12",
          isFeatured: false,
          isActive: true,
          storefrontDepartment: "accessories",
          homeSliderEnabled: false,
          promoSliderEnabled: true,
          featureSectionEnabled: true,
          isNewArrival: false,
          isBestSeller: true,
          isFeaturedLabel: false,
          images: [
            {
              imageUrl:
                "https://placehold.co/600x800/efe4da/2d211b?text=Core+Product+Updated",
              isPrimary: true,
              sortOrder: 1,
              isActive: true,
            },
          ],
          variants: [],
          prices: [
            {
              variantId: null,
              mrp: 649,
              sellingPrice: 549,
              costPrice: 260,
              isActive: true,
            },
          ],
          discounts: [],
          offers: [],
          attributes: [],
          attributeValues: [],
          variantMap: [],
          stockItems: [],
          stockMovements: [],
          seo: null,
          storefront: null,
          tags: [{ name: "Updated", isActive: true }],
          reviews: [],
        },
      })

      assert.equal(updated.item.name, "Core Phase Product Updated")
      assert.equal(updated.item.code, "PRD-CORE-001")
      assert.equal(updated.item.tagCount, 1)

      const deleted = await deleteProduct(runtime.primary, adminUser, created.item.id)
      assert.equal(deleted.deleted, true)

      const listedAfterDelete = await listProducts(runtime.primary)
      assert.equal(listedAfterDelete.items.some((item) => item.id === created.item.id), false)
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
