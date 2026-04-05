import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import test from "node:test"

import { createAuthService } from "../../apps/cxapp/src/services/service-factory.js"
import { getStorefrontCatalog, getStorefrontLanding, getStorefrontProduct } from "../../apps/ecommerce/src/services/catalog-service.js"
import { getAuthenticatedCustomer, registerCustomer, updateCustomerProfile } from "../../apps/ecommerce/src/services/customer-service.js"
import {
  createCheckoutOrder,
  listCustomerOrders,
  trackOrderByReference,
  verifyCheckoutPayment,
} from "../../apps/ecommerce/src/services/order-service.js"
import { getServerConfig } from "../../apps/framework/src/runtime/config/index.js"
import {
  createRuntimeDatabases,
  prepareApplicationDatabase,
} from "../../apps/framework/src/runtime/database/index.js"

test("ecommerce storefront supports customer registration, mock checkout, portal orders, and public tracking", async () => {
  const tempRoot = mkdtempSync(path.join(os.tmpdir(), "codexsun-ecommerce-services-"))

  try {
    const config = getServerConfig(tempRoot)
    config.database.driver = "sqlite"
    config.database.sqliteFile = path.join(tempRoot, "primary.sqlite")
    config.offline.enabled = false
    config.commerce.razorpay.enabled = false

    const runtime = createRuntimeDatabases(config)
    const authRequestMeta = { ipAddress: null, userAgent: null }

    try {
      await prepareApplicationDatabase(runtime)
      const authService = createAuthService(runtime.primary, config)

      const landing = await getStorefrontLanding(runtime.primary)
      const catalog = await getStorefrontCatalog(runtime.primary, {})
      const product = await getStorefrontProduct(runtime.primary, {
        slug: catalog.items[0]?.slug ?? null,
      })

      assert.equal(landing.settings.hero.title.length > 0, true)
      assert.equal(catalog.items.length > 0, true)
      assert.equal(product.item.id, catalog.items[0]?.id)

      const registration = await registerCustomer(runtime.primary, config, {
        displayName: "Asha Raman",
        email: "asha@codexsun.local",
        phoneNumber: "+91 98888 77777",
        password: "Password@123",
        companyName: "",
        gstin: "",
        addressLine1: "18 River Road",
        addressLine2: "",
        city: "Chennai",
        state: "Tamil Nadu",
        country: "India",
        pincode: "600001",
      })

      assert.equal(registration.email, "asha@codexsun.local")

      const customerSession = await authService.login(
        {
          email: "asha@codexsun.local",
          password: "Password@123",
        },
        authRequestMeta
      )

      const refreshedCustomer = await getAuthenticatedCustomer(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(refreshedCustomer.displayName, "Asha Raman")

      await updateCustomerProfile(
        runtime.primary,
        config,
        customerSession.accessToken,
        {
          displayName: "Asha Raman",
          phoneNumber: "+91 98888 11111",
          companyName: "Asha Retail",
          gstin: "",
          addressLine1: "18 River Road",
          addressLine2: "Floor 2",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          pincode: "600001",
        }
      )

      const checkout = await createCheckoutOrder(
        runtime.primary,
        config,
        {
          items: [{ productId: product.item.id, quantity: 2 }],
          shippingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          billingAddress: {
            fullName: "Asha Raman",
            email: "asha@codexsun.local",
            phoneNumber: "+91 98888 11111",
            line1: "18 River Road",
            line2: "Floor 2",
            city: "Chennai",
            state: "Tamil Nadu",
            country: "India",
            pincode: "600001",
          },
          notes: null,
        },
        customerSession.accessToken
      )

      assert.equal(checkout.payment.mode, "mock")
      assert.equal(checkout.order.paymentStatus, "pending")

      const verified = await verifyCheckoutPayment(runtime.primary, config, {
        orderId: checkout.order.id,
        providerOrderId: checkout.payment.providerOrderId,
        providerPaymentId: "mock_payment_001",
        signature: "mock_signature",
      })

      assert.equal(verified.item.paymentStatus, "paid")
      assert.equal(verified.item.status, "confirmed")

      const customerOrders = await listCustomerOrders(
        runtime.primary,
        config,
        customerSession.accessToken
      )

      assert.equal(customerOrders.items.length, 1)
      assert.equal(customerOrders.items[0]?.orderNumber, verified.item.orderNumber)

      const tracked = await trackOrderByReference(runtime.primary, {
        orderNumber: verified.item.orderNumber,
        email: "asha@codexsun.local",
      })

      assert.equal(tracked.item.id, verified.item.id)
      assert.equal(
        tracked.item.timeline.some((entry) => entry.code === "payment_captured"),
        true
      )
    } finally {
      await runtime.destroy()
    }
  } finally {
    rmSync(tempRoot, { recursive: true, force: true })
  }
})
